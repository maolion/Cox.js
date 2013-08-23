/**
 * @DATE 2012/11/21
 * @author maolion.j@gmail.com
 * 模块管理
 */

/*Module.config({
    path:{
        mbc : "http://www.cox.com/modules/mbc/"
    }
})

Module( "abcdeg", Depend( "mbc/pp/abc.www", "abc" ),
    function( Require, Public, Private ){
        var x = Require("mbc/pp");
        var b = Require("mbc/abc");
        Public({

        });
        Private({

        })
    }
);

Module( Depend( "mbc/pp/abc.www" ),
    function(){
        //main module
    }
)
*/



var slice,
    EMPTY_FUNCTION,
    STRING_LENGTH_SROT_UP, 
    RE_URL_PARAMS, RE_FUNC_SIGN, RE_PROTOCOL_SIGN, RE_URL_SIGN, RE_URL_BASEROOT, RE_LINE_END_CHAR;
slice            = Array.prototype.slice;
EMPTY_FUNCTION   = function(){};
RE_FUNC_SIGN     =  /function\s*(\w+)*\s*(\([^\)]*\))/;
RE_URL_SIGN      = /(?:https?|file):\/{2,3}([^\?#]+).*$/i;
RE_LINE_END_CHAR = /\r\n|\n|\n\r/g;
RE_PROTOCOL_SIGN = /^\w+:\/{2,3}/i;
RE_URL_BASEROOT  = /:\/{2,3}([^\/]+)/;
RE_URL_PARAMS    = /(?:\?([^#]*))?(#.*)?$/;
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

function uniqueList( list ){
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

function indexOfList( list, item ){
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

var __module_id__ = (function(){
    var PROTOCOL = window.location.href.match( RE_PROTOCOL_SIGN )[0];
    return function(path){
        var index, paths;
        paths = module_config.path;
        if( typeof paths === "object" ){
            for( var key in paths ){
                if( paths.hasOwnProperty(key) ){
                    path = path.replace( new RegExp( "^" + key ), paths[key] );
                }
            }            
        }
        if( path.charAt(0) === "/" ){
            path = PROTOCOL + realpath( module_config.baseroot + "/" + path ).slice(1);
        }else{
            path = RE_PROTOCOL_SIGN.test( path ) ? path : 
                PROTOCOL + realpath(  module_config.moduleroot + "/" + path ).slice(1);
        }
        return path;
    }
})();

var __module_file__ = function( moduleid ){
    var newprefix = "";
    if( module_config.debug ){
        newprefix = "?" + new Date().getTime();
    }
    if( !RE_PROTOCOL_SIGN.test(moduleid) ){
        moduleid = __module_id__( moduleid );
    }
    if( moduleid.indexOf("?") === -1 && moduleid.indexOf("#") === -1 ){
        moduleid += ".js" + newprefix;
    }else if( module_config.debug ){
        moduleid = moduleid.replace( RE_URL_PARAMS, newprefix + "&$1$2" );
    }
    return moduleid;
}

var Depend = TypeMark( function Depend( mokdules ){
    var obj, args, depends, n;
    args = slice.call( arguments );
    depends = [];
    for( var i = 0, l = args.length; i < l; i++ ){
        var item;
        item = args[i];
        if( typeof item !== "string" || item.length === 0 ){
            throw Error( "Depend( modules ): 参数列表只允许有String类型实例参数项" );
        }
        if( item.slice(-3).toLowerCase() === ".js" ){
            item = item.slice( 0, -3 );
        }
        item = __module_id__( item );
        depends.push( item );
    }
    depends = uniqueList( depends );
    obj = Object.create( Depend.prototype );
    obj.depends = depends;
    return obj;
} );


var module_config = (function(){
    var script, scripts, moduleroot,baseroot;
    scripts = slice.call( document.getElementsByTagName("SCRIPT") );
    while( script = scripts.pop() ){
        moduleroot = realpath( script.src.replace( RE_URL_SIGN, "$1" ) );
        if( basename( moduleroot ) === "Cox.Module.test.js" ){
            moduleroot = dirname( moduleroot );
            baseroot = script.src.match( RE_URL_BASEROOT )[1];
            break;
        }
        moduleroot = null;
    }
    if( !moduleroot ){
        throw Error("需要加载 Cox.Module.test.js脚本文件 ");
    }

    return {
        moduleroot : moduleroot,
        baseroot : baseroot
    };        
})();

var pendingModules, Modules;
pendingModules = {};
Modules = {};

var __require_module__ = function require( moduleid ){
    var module;
    moduleid = __module_id__( moduleid );
    module = pendingModules[ moduleid ] || Modules[ moduleid ];
    if( !module ){
        throw Error( "外部模块需要在先在依赖列表( Depend(...) )声明后才能被调用者使用！" );
    }
    if( module.invoke ){
        var invoke = module.invoke;
        delete module.invoke;
        delete pendingModules[ moduleid ];
        Modules[ moduleid ] = module;
        console.log( module )
        invoke.call(
            null,
            __require_module__,
            module.exports,
            module
        );

    }
    return module.exports;
}
var __invoke_main_module__ = function(){
    Module.main.invoke.call(
        null,
        __require_module__,
        Module.main.exports,
        Module.main
    );
    delete Module.main;
}
var __load_module__ = (function(){
    var lock, loader, load_queue, load_current, head;
    lock = false;
    loaded = {};
    load_queue = [];
    load_current = "";
    head = document.getElementsByTagName("HEAD")[0];

    function loader_loaded(){
        console.log("loaded "+load_current);
        loaded[ load_current ] = true;
        lock = false;
        load_current = null;
        loader.removeEventListener( "load", arguments.callee );
        __load_module__();

    }

    return function __load_module__( modules ){
        
        load_queue.unshift.apply( load_queue, modules );
        if( lock ){
            return;
        }

        if( !load_queue.length ){
            lock = false;
            __invoke_main_module__();
            return;
        }
        lock = true;
        load_current = load_queue.shift();
        if( loaded.hasOwnProperty( load_current ) ){
            loader_loaded();
            return;
        }

        loader = document.createElement("SCRIPT");
        loader.setAttribute( "async", "true" );
        loader.setAttribute( "src", __module_file__( load_current ) );
        if( document.addEventListener ){
            loader.addEventListener( "load", loader_loaded );
        }else{
            console.log("ie");
        }
        head.insertBefore( loader, head.firstChild );
    }
})();

function Module( moduleid, depends, modulebody ){

    var args, module, id;
    args = slice.call( arguments );
    if( args.length === 0 ){
        throw Error( "Module( moduleid, depends, modulebody ): 必须传递一个 Function类型实例对象给参数列表" );
    }
    moduleid = "";
    depends = [];
    modulebody = null;

    for( var i = 0, l = args.length; i < l; i++ ){
        var item = args[i];
        switch( typeof item ){
            case "string":
                if( i != 0 ){
                    throw Error( "Module( moduleid, depends, modulebody ): 传递的String实例对象只允许在参数列表的第一位" );
                }
                moduleid = item;
            break;
            case "object":
                if( !( item instanceof Depend ) || i != ( moduleid ? 1 : 0 ) ){
                    throw Error( "Module( moduleid, depends, modulebody ): 传递的Depend类型实例(或Array类型实例)对象只允许在参数列表的第一位或第二位" );
                }
                depends = item.depends;
            break;
            case "function":
                if( modulebody != null ){
                    throw Error( "Module( moduleid, depends, modulebody ): 参数列表中允许有一个Function类型实例参数项" );
                }
                modulebody = item;
            break;
        }
    }
 
    if( !modulebody ){
        throw Error( "Module( moduleid, depends, modulebody ): 必须传递一个 Function类型实例对象给参数列表" );        
    }
    var moduledefine = modulebody.toString();
    if( /Module\(\s*("|').*\1/.test( moduledefine ) ){
        throw Error( "module define BUG" );
    }
    moduleid = moduleid.length ? __module_id__( moduleid ) : moduleid;
    module = pendingModules[ moduleid ] = {
        moduleid : moduleid,
        invoke : modulebody,
        depends: depends,
        exports : {}
    };

    if( depends.length ){
        __load_module__( depends );
    }

    if( !Module.main ){
        Module.main = module;
    }
}

Module.main = null;
Module.config  = function( config ){
    extend( module_config, config, true );
    return module_config;
}

Module.config( {
    debug: true,
    moduleroot: "H:/project/web/Cox/modules",
    path : {
        "cba/abc" : "http://www.cox.com/cba/abc"
    }
} );

Module( Depend( "module1", "module2" ), function( require ){
    var m1, m2;
    console.log("#main#");
    console.log( "main require module1",  m1 = require( "module1" ) );
    console.log( "main require module2", m2 = require( "module2" ) );
    console.log( m1.name );
    console.log( m2.name );
} );

/*Import( Module( "module1", "module2" ), function( module1, module1 ){
    //
} )
*/


Use( Module( "module1", 'module2' ), function( require ) ){
    var x = require("module1");
    var b = require("module2");
    console.log( x.abc );
    console.log( b.abc );
}
