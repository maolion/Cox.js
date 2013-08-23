/**
 * @DATE 2012/11/11
 * @author maolion.j@gmail.com
 * @一个支持简单面向对象设计的工具测试版本
 */

var slice = Array.prototype.slice;
var EMPTY_FUNCTION = function(){};
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
function Interface( name, methods ){
    var list, obj,
        LENGTH,INTERFACE_INFO;
    list = [];
    this.__name__ = typeof name === "string" ? name : "";
    methods = arguments.length == 1 ? name : methods;
    methods = typeof methods === "object" ? methods : {};

    for( var k in methods ){
        if( methods.hasOwnProperty( k ) ){
            list.push( k );
        }
    }
    LENGTH = list.length;
    INTERFACE_INFO = this.__name__ + "{ " + list.join(", ") + " }";
    obj = Object.create( Interface.prototype );
    obj.implementIn = function( obj, noerror ){
        noerror = !!noerror;
        for( var i = 0; i < LENGTH; i++ ){
            var method = list[i];
            if( !( method in obj && typeof obj[method] === "function" ) ){
                if( !noerror ){
                    throw Error( "实例没有实现接口类 " + INTERFACE_INFO + " 中的 `"+ method +"` 公共接口" );
                }
                return false;
            }
        }
        return true;
    }
    return obj;
}
 
function Inherit(proto){
    var obj;
    if( !proto || typeof proto != "function" && typeof proto != "object" ){
        throw Error("Inherit( proto ): proto参数需要一个 Function类或Object类实例！");
    }
    obj = Object.create( Inherit.prototype );
    obj.proto = proto;
    return obj;
}
function Implements(){
    var ilist, obj;
    ilist = slice.call( arguments );
    if( !ilist.length ){
        throw Error( "Implements( interface[, interface...] ): 至少需要一个Interface类实例!" )
    }
    for( var i = 0, l = ilist.length; i < l; i++ ){
        var item = ilist[i];
        if( !item ||  !( item instanceof Interface ) ){
            throw Error( "Implements( interfac[, interface...] ): 参数只接受Interface类实例!" )
        }
    }
    obj = Object.create( Implements.prototype );
    obj.ilist = ilist;
    return obj;
}

function Class( classname, single, inherit, implements, classbody, args ){
    var Public, Private, Static, 
        Super, single_instance, constructor;

    args       = slice.call( arguments );
    classname  = "";
    single     = false;
    inherit     = undefined;
    implements = undefined;
    classbody  = undefined;
    
    if( args.length > 5 || args.length < 1 ){
        throw Error( "Class( classname, inherit, implements, classbody ): 只允许传递最少一个或最多5个参数到Class函数参数列表！" );
    }
    //classname = typeof classname === "string" ? classname : "";
    for( var i = 0, l = args.length; i < l ; i++ ){
        item = args[i];
        switch( typeof item ){
            case "string":
                if( i != 0 ){
                    throw Error(  "Class( classname, single, inherit, implements, classbody ): 只允许将String类实例传递给Class函数第一个参数"  );
                }
                classname = item;
            break;
            case "boolean":
                if( i > 2 ){
                    throw Error(  "Class( classname, single, inherit, implements, classbody ): 只允许将Boolean类实例传递给Class函数第一个或第二个参数"  );
                }
                single = item;
            break;
            case "function":
                classbody = item;
            break;
            default:
                if( item instanceof Inherit ){
                    inherit = item;
                }else if( item instanceof Implements ){
                    implements = item;
                }else{
                    throw Error( "Class( classname, single, inherit, implements, classbody ): 不允许将 " + typeof item + " 类型实例传递给Class函数!" );
                }
            break;
        }
    }
    
    function define_public( define ){
        switch( typeof define ){
            case "object": return define;
            case "function": Public = define;
        }
    }
    function define_private( define ){
        switch( typeof define ){
            case "object": return define;
            case "function": Private = [define];
        }
    }

    Public = EMPTY_FUNCTION;
    Private = [EMPTY_FUNCTION];
    Static = function( Public, Private ){
        Public = Public || {};
        Private = Private || {};
        Static.Public = extend( class_,  Public, true );
        Static.Private = Private;
        delete Private.Private;
        delete Private.Public;
        extend( Static, Private, true );
    }
    Super = inherit ? inherit.proto : null;
    classbody.call(
        class_, 
        define_public, 
        define_private,
        Static
    );

    if( Super ){
        if( typeof Super === "function" ){
            extend( class_, Super );
            class_.prototype = Object.create( Super.prototype );
            var s = Super;
            while( s && typeof s.__private__ === "function" ){
                Private.unshift( s.__private__ );
                s = s.__super__;
            }
        }else{
            class_.prototype = Object.create( Super );  
        }
        
    }

    constructor = EMPTY_FUNCTION;
    class_.prototype.constructor = null;
    Public.call( class_.prototype );

    if( class_.prototype.constructor && typeof class_.prototype.constructor === "function" ){
        constructor = class_.prototype.constructor;
    }
    class_.prototype.constructor = class_;

    if( implements ){
        for( var i, l = implements.length; i < l ; i++ ){
            implements[i].implementIn( class_.prototype );
        }
    }

    function class_(){
        if( single ){
            if( single_instance ){
               return single_instance;
            }else{
                single_instance = this;
            }
        }
        for( var i = 0, l = Private.length; i < l ; i++ ){
            Private[i].call( this );
        }
        constructor.apply( this, slice.call( arguments ) );
    }

    class_.prototype.Super = function( method, args ){
        var value;
        method = method || "constructor";

        if( typeof method != "string" ){
            throw Error( "(class instance).Super( method, args ): method参数只接受String类型参数!" )
        }
        if (this.__CSLEVEL__ === undefined) {
            this.__CSLEVEL__ = class_.__super__;
        }
        if (this.__CSLEVEL__ && typeof this.__CSLEVEL__.prototype[method] === 'function') {
            if( method === "constructor" ){
                method = this.__CSLEVEL__.prototype.__constructor__;  
            }else{
                method = this.__CSLEVEL__.prototype[method];
            }
            this.__CSLEVEL__ = this.__CSLEVEL__.__super__ || null;;
            value = method.apply( this, slice.call( arguments, 1 ) );
        }
        delete this.__CSLEVEL__;
        return value;
    }

    class_.prototype.__constructor__ = constructor;
    class_.__name__                  = classname;
    class_.__private__               = Private.slice(-1)[0];
    class_.__super__                 = Super;
    
    class_.toString                  = function(){
        return this.__name__;
    }
    return class_;
}



ITest = Interface( "ITest", {
    test : EMPTY_FUNCTION
} );
ITest2 = Interface( "ITest2",{
    test2 : EMPTY_FUNCTION
} );

A = Class( "A", Implements( ITest ), 
    function( Public, Private, Static ){
        Static(
            Public({
                p1 : 100000
            })
        )
        Private(function(){
            this._p1 = 0;
        });
        Public(function(){
            this.constructor = function(){
                console.log( "(A instance)(/*constructor*/)" )
                this._p1++;
            }
            this.test = function(){
                console.log( "(A instance).test()" );
                console.log( this._p1 )
            }
        });
    } 
);

B = Class( "B", Inherit( A ),
    function( Public, Private, Static ){
        Public(function(){
            this.constructor = function(){
                this.Super();
                console.log( "(B instance)(/*constructor*/)" )
                this._p1++;
            }
            this.test2 = function(){
                console.log( this._p1 );
            }
        });
    }
);

C = Class( "C", true, Inherit( B ), Implements( ITest, ITest2 ),
    function( Public, Private, Static ){
        Public(function(){
            this.constructor = function(){
                this.Super();
                console.log( "(C instance)(/*constructor*/)" );
                console.log( this._p1 );
            }
            this.test2 = function(){
                this.Super( "test2" );
                console.log( "哈哈。。。" );
            }
        })
    }
);

b = new C();
c = new C();
console.log( b === c );

c.test2();
