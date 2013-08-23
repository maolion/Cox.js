/*
 * @DATE 2012/11/21
 * @author maolion.j@gmail.com
 * 模块管理
 */



var slice,
    EMPTY_FUNCTION, BASEROOT,
    STRING_LENGTH_SROT_UP, 
    RE_URL_PARAMS, RE_FUNC_SIGN, RE_PROTOCOL_SIGN, RE_URL_SIGN, RE_URL_BASEROOT, RE_LINE_END_CHAR, RE_MODULE_ID;

slice            = Array.prototype.slice;  
EMPTY_FUNCTION   = function(){};
RE_FUNC_SIGN     =  /function\s*(\w+)*\s*(\([^\)]*\))/;
RE_URL_SIGN      = /(?:https?|file):\/{2,3}([^\?#]+).*$/i;
RE_LINE_END_CHAR = /\r\n|\n\r|\n/g;
RE_PROTOCOL_SIGN = /^\w+:\/{2,3}/;
RE_URL_BASEROOT  = /^(\w+:\/{2,3}[^\/]+)/;
RE_URL_PARAMS    = /(?:\?([^#]*))?(#.*)?$/;
RE_MODULE_ID     = /^[\w\/.]+$/;
STRING_LENGTH_SROT_UP = function( a, b ){
    return a.length > b.length;
}

if( !Object.create ){
    Object.create = (function(){
        function bridge(){};
        return function(proto){
            bridge.prototype = proto;
            return new bridge;
        }
    })();
}

var global = function(){ return this; }();

function extend( dest, source, override ){
    dest = dest || {};
    override = !!override;
    for( var key in source ){
        if( override ){
            dest[key] = source[key];
        }else if( !dest.hasOwnProperty(key) ){
            dest[key] = source[key];
        }
    }
    return dest;
}

function is(object, type) {
    if ( object === null || object === undefined || !type ){
        return false;
    }

    return (
        ( typeof type === "function" && object instanceof type ) ||
        ( typeof type.__isInstance__ === "function" && type.__isInstance__( object ) ) ||
        ( typeof type === "function" && new object.constructor instanceof type )
    );
}

function isType(type) {
    return (
        typeof type == "function" ||
        typeof type == "object" && typeof type.__isInstance__ === "function"
    );
}

function isTypeMark(TypeMark) {
    return (
        typeof TypeMark == "object" &&
        !!TypeMark && typeof TypeMark.__TYPE__ == "function"
    );
}

function TypeMark( type ){
    var info;
    if( typeof type != "function" ){
        return false;
    }
    info = RE_FUNC_SIGN.exec( type.toString() );

    type.__NAME__ = info[1] || "";
    type.prototype.__TYPE__ = type;
    type.prototype.__NAME__ = type.__NAME__;
    
    info = info[1] || "TypeMark" + info[2];
    type.toString = function(){
        return info;
    }
    return type;
}

function getTypeName( type ){
    var name;
    if( !isType(type) && !isTypeMark(type) ){
        throw Error( "getTypeName( type ): 传递给 type参数的值只允许为类型引用." );
    }
    name = type.__NAME__ || type.constructor.__NAME__ || "";

    if( !name && typeof type === "function" ){
        name = type.name;
    }

    return name;
}

function realpath( path ){
    var n = 0;
    path = path.split( "/" );
    for( var i = 0, l = path.length; i < l; i++ ){
        var item = path[i];
        switch( item ){
            case "":
            case ".":
            break;
            case "..":
                if( n > 0 ){
                    n--;
                }
            break;
            default:
                path[n++] = item;
            break;
        }
    }
    path.splice( n );
    path.unshift( "" );
    return path.join("/");
}

function basename( path ){
    var index;
    path = path.charAt( path.length - 1 ) === "/" ? path.slice( 0, -1 ) : path;
    index = path.lastIndexOf( "/" );
    if( index > -1 ){
        path = path.slice( index + 1 );
    }
    return path;
}

function dirname( path ){
    var index;
    index = path.lastIndexOf( "/" );
    if( index ){
        path = path.slice( 0, index );
    }
    return path;
}

function splitProtocol( path ){
    var protocol;
    protocol = path.match( path.match( RE_PROTOCOL_SIGN ) );
    protocol = protocol && protocol[0];
    return [ protocol, path.replace( protocol, "" ) ];
}
function objectKeys( obj ){
    var keys = [];
    for( var key in obj ){
        if( obj.hasOwnProperty( key ) ){
            keys.push( key );
        }
    }
    return keys;
}
function listUnique( list ){
    var newlist, n;
    newlist = [];
    n = 0;
    __lv1: for( var i = 0, l = list.length; i < l; i++ ){
        for( var i2 = 0; i2 < n; i2++ ){
            if( list[i] === newlist[i2] ){
                continue __lv1;
            }
        }   
        newlist[n++] = list[i]
    }
    return newlist;
}

function listIndexOf( list, item ){
    if( typeof list.indexOf === "function" ){
        return list.indexOf( item );
    }
    for( var i = 0, l = list.length; i < l; i++ ){
        if( list[i] === item ){
            return i;
        }
    }  
    return -1;
}

"Module Manager", function(){
    var 
    Module, Depend, Define, Use, config, 
    REL, PROTOCOL,
    loading_modules, loaded_modules,
    pendingModules;

    pendingModules  = [];

    PROTOCOL        = window.location.href.match( RE_PROTOCOL_SIGN )[0];
    BASEROOT        = window.location.href.match( RE_URL_BASEROOT )[1];
    REL             = document.documentElement;
    loading_modules = {};
    loaded_modules  = {};
    load_queue      = [];
    load_module     = "";
    config          = {
        debug      : false,
        moduleroot : dirname( window.location.href ),
        baseroot   : BASEROOT
    };

    function getModuleId( path ){
        //path = path.replace( RE_PROTOCOL_SIGN, "" );
        return path.replace( /\?\d+\&/, "?" ).replace( "?#", "#" ).replace( /(?:\.js)?(?:\?\d+)?$/, "" );
    };

    function getModuleUrl( modulename, root ){
        var newprefix, protocol, isurl, file;

        newprefix = !config.debug ? "" : "?" + new Date().getTime();

        isurl     = RE_PROTOCOL_SIGN.test( modulename );

        if( isurl ){
            file = modulename;
        }else{
            root       = modulename.charAt(0) === "/" ? config.baseroot : root || config.moduleroot;
            protocol   = splitProtocol( root );
            root       = protocol[1];
            protocol   = protocol[0] || PROTOCOL;
            file       = realpath( root + "/" + modulename ).slice( 1 );
        }
        
        if( !isurl ){
            file += ( file.slice( -3 ).toLowerCase() === ".js" ? "" : ".js" );
        }

        if( file.indexOf("?") === -1 && file.indexOf("#") === -1 ){
            file +=  newprefix;
        }else if( newprefix ){
            file = file.replace( RE_URL_PARAMS, newprefix + "&$1$2" );
        }
        file = !isurl ? protocol  + file : file;
        return file;
    };


    function loadModule( modules ){
        var module;
        for( var moduleid in modules ){
            var loaded
            module = modules[ moduleid ]
            if( module instanceof Module ){

                loaded = loaded_modules[ moduleid ];
                if( loaded ){
                    moduleLoaded( loaded  );
                    continue;
                }
                if( loading_modules[ moduleid ] || !module.file ){   
                    continue;
                }

                load( module );
            }
        }
    }

    function load( module ){
        var loader;
        loader = document.createElement( "script" );

        loader.setAttribute( "type", "text/javascript" );
        loader.setAttribute( "charset", "utf-8"  );
        loader.setAttribute( "async", "true" );
        loader.setAttribute( "defer", "true" );

        loader.setAttribute( "src", module.file );
        if( loader.addEventListener ){
            loader.addEventListener( "load", loaded );
        }
        
        REL.firstChild.insertBefore( loader, null );

        loading_modules[ module.id ] = module;

        function loaded(){          
            delete loading_modules[ module.id ];
            loaded_modules[ module.id ] = module;
            moduleLoaded( module );
            if( loader.removeListener ){
                loader.removeListener( "load", loaded );
            }
        }
    }
    
    function moduleLoaded( module ){
        var ndependmodules, moduleid;
        ndependmodules = module.dependmodules;
        for( var i = pendingModules.length - 1; i >= 0; i-- ){
            var tmodule, dmodule, dependmodules, wait;
            tmodule = pendingModules[i];
            dependmodules = tmodule.dependmodules;
            wait = dependmodules.wait;
            dmodule = wait[ module.id ];

            if( dmodule instanceof Module ){ 
                if( ndependmodules && ndependmodules.waitcount ){
                    for( var id in ndependmodules ){
                        if(  id === tmodule.id ){
                            continue;
                        }
                        if( !( dependmodules[ id ] instanceof Module ) && ndependmodules[ id ] instanceof Module ){
                            dependmodules.waitcount++;
                            dependmodules.count++;
                            dependmodules[ id ] = ndependmodules[ id ];
                            wait[ id ] = ndependmodules[ id ];
                        }
                    }
                }
                dependmodules.waitcount--;
                delete wait[ module.id ];
                if( !dependmodules.waitcount ){
                    pendingModules.splice( i, 1 );
                    if( typeof tmodule.run === "function" ){
                        tmodule.run.call( null, Require( tmodule ) );
                    }
                }
            }
        }
    }


    Depend = TypeMark( function Depend( mokdules ){
        var obj, args;
        args = slice.call( arguments );
        args = listUnique( args );
        obj  = Object.create( Depend.prototype );

        obj.reset = function( root ){
            var dependmodules, wait;
            dependmodules = {};
            wait          = {};
            for( var i = 0, l = args.length; i < l; i++ ){
                var item, info;
                item = args[i];
                if( typeof item !== "string" || item.length === 0 ){
                    throw Error( "Depend/Module( modules ): 参数列表只允许有String类型实例参数项" );
                }
                if( item.slice(-3).toLowerCase() === ".js" && !RE_PROTOCOL_SIGN.test( item ) ){
                    item = item.slice( 0, -3 );
                }
                info      = Object.create( Module.prototype );
                info.root = root || config.moduleroot;

                if( item.charAt(0) === "@" ){
                    info.id    = item.slice(1);
                    info.file  = "";
                    info.dir   = "";
                }else{
                    info.file  = getModuleUrl( item, root );
                    info.id    = getModuleId( info.file );
                    info.dir   = dirname( info.file );
                }
                info.oid                 = item;
                dependmodules[ info.id ] = info;
                wait[ info.id ]          = info;
            }
            dependmodules.count     = args.length;
            dependmodules.waitcount = args.length;
            dependmodules.wait      = wait;
            return dependmodules;
        }

        return obj;
    } );
    
    Module = TypeMark( function Module( modules ){
        var obj;
        if( !arguments.length ){
            throw Error( "Module( modules ): 参数列表至少需要一个参数." );
        }
        obj               = Object.create( Module.prototype );
        obj.dependmodules = Depend.apply( this, arguments  ).reset( config.moduleroot );
        return obj;
    } );

    Module.config = function( newconfig ){
        var root;
        root = newconfig.baseroot;
        if( typeof root === "string" && root.charAt( 0 ) === "/" ){
            if( ( PROTOCOL + root.slice( 1 ) ).indexOf( BASEROOT ) === -1 ){
                newconfig.baseroot = BASEROOT + root; 
            }
        }
        root = newconfig.moduleroot;
        if( typeof root === "string" && root.charAt( 0 ) === "/" ){
            if( ( PROTOCOL + root.slice( 1 ) ).indexOf( BASEROOT ) === -1 ){
                newconfig.moduleroot = BASEROOT + root; 
            }
        }
        extend( config, newconfig, true );
    }

    Require = TypeMark( function Require( tmodule ){
        function require( modulename ){
            var module, invoke, id;
            if( modulename.charAt( 0 ) !== "@" ){
                id = getModuleId( getModuleUrl( modulename, tmodule.dir || tmodule.root ) );
            }else{
                id = modulename.slice( 1 );
            }
            module = tmodule.dependmodules[ id ];
            if( !( module instanceof Module ) ){
                throw Error( 
                    "需求的模块( " + modulename + 
                    " )未被加载或它未在当前模块( " + ( tmodule.id || "" ) + 
                    " )的依赖列表中声明." );
            }

            module = loaded_modules[ id ];
            if( !module ){
                //debugger;
            }
            invoke = module.invoke;
            
            if( typeof invoke === "function" ){
                delete module.invoke;
                invoke.call( null, Require( module ), module.exports, module );
            }
            return module.exports;
        }
        require.prototype = Require;
        require.constructor = Require;
        return require;
    });

    Define = function Define( modulename, dependmodules, modulebody ){
        var args, module;
        args = slice.call( arguments );

        if( args.length === 0 ){
            throw Error( "Define( modulename, dependmodules, modulebody ): modulename 和 modulebody 参数必须要给定" );
        }
        modulename = "";
        dependmodules = null;
        modulebody = null;

        for( var i = 0, l = args.length; i < l; i++ ){
            var item = args[i];
            switch( typeof item ){
                case "string":
                    if( i != 0 ){
                        throw Error( "Define( modulename, dependmodules, modulebody ): 传递的String实例对象只允许在参数列表的第一位" );
                    }
                    modulename = item;
                break;
                case "object":
                    if( !( item instanceof Depend ) || i != ( modulename ? 1 : 0 ) ){
                        throw Error( "Define( modulename, dependmodules, modulebody ): 传递的Depend类型实例对象只允许在参数列表的第二位或参数列表项不接受此类型值" );
                    }
                    dependmodules = item;
                break;
                case "function":
                    if( modulebody != null ){
                        throw Error( "Define( modulename, dependmodules, modulebody ): 参数列表中允许有一个Function类型实例参数项" );
                    }
                    modulebody = item;
                break;
                default:
                    throw Error( "Define( modulename, dependmodules, modulebody ): 参数列表项不接受此类型值" );
                break;
            }
        }
        
        if( !RE_MODULE_ID.test( modulename ) ){
            throw Error( "Define( modulename, dependmodules, modulebody ): 传入给modulename参数的值( \"" + modulename + "\" ) 的格式不正确." );
        }

        if( !modulebody ){
            throw Error( "Define( modulename, dependmodules, modulebody ): 必须传递一个 Function类型实例对象给参数列表" );        
        }
        for( var moduleid in loading_modules ){
            if( loading_modules[ moduleid ] instanceof Module){
                if( moduleid.slice( 0 - modulename.length ) === modulename ){
                    module  = loading_modules[ moduleid ];
                    break;
                }
            }
            
        }
        if( !module ){
            module                       = Object.create( Module.prototype );
            module.id                    = modulename;
            module.oid                   = modulename;
            module.file                  = null;
            module.dir                   = null;
            module.root                  = config.moduleroot;
            loaded_modules[ modulename ] = module;  

            moduleLoaded( module ); 
        }

        module.invoke = modulebody;
        module.exports = {};
        module.dependmodules = dependmodules ? dependmodules.reset( module.dir ) : Depend().reset();

        if( module.dependmodules.waitcount ){
            pendingModules.push( module );
            loadModule( module.dependmodules );        
        }
        return module;
    };

    Use = function Use( modules, handler ){
        if( !( modules instanceof Module ) ){
            throw Error( "Use( modules, handler ): 传递给modules参数的值必须是Module类型实例. " );
        }
        if( typeof handler !== "function" ){
            throw Error( "Use( modules, handler ): 传递给handler参数的值必须是Function类型实例. " );
        }
        modules.run = handler;
        pendingModules.push(modules);
        loadModule( modules.dependmodules );
    };

    global.Depend = Depend;
    global.Module = Module;
    global.Define = Define;
    global.Use    = Use;

}();



//删除插入的script标签来释放占用的内存（在IE里）
//使用 setTimeout 来插入script，不阻塞 window.onload 的执行
