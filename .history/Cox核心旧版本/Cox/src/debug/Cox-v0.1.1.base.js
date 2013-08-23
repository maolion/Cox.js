/**
 * ${project} < ${FILE} >
 *
 * @DATE    2012/12/1
 * @VERSION ${version}
 * @AUTHOR  ${author}
 * 
 * ----------------------------------------------------------------------------
 *  Cox 是开原的 JavaScript 框架，
 *  它是在标准原生 JavaScript 基础之上对 JavaScript 使用的扩展
 *
 *  Copyright(c) 2012 Cox, 江宜玮( maolion.j@gmail.com )
 *  
 *  Cox 采用 MIT许可协议
 *       http://www.opensource.org/licenses/mit-license.php
 * 
 *  以上这些版权声明和声明必须包含在源代码的所有拷贝中。
 *
 * ----------------------------------------------------------------------------
 * Cox.base, 框架基础模块
 * 
 * Cox.base主要实现的功能模块
 * -   函数重载
 * -   实现面向对象设计的一套工具
 * -   模块管理
 * -   一些实用的工具(函数)集
 * -   单元测试工具(只存在在debug版本里)
 * 
 * ----------------------------------------------------------------------------
 *
 */
;void function __Cox_Base__(){

    //#top-variables
    var 
        SLICE                 = Array.prototype.slice,
        GLOBAL                = (function(){ return this; }()),
        EMPTY_FUNCTION        = function(){},
        SROT_UP_STRING_LENGTH = function( a, b ){ return a.length > b.length; },
        RE_LINE_END           = /\n\r|\r\n|\r|\n/g,
        RE_FUNC_SIGN          = /function\s*(\w+)*\s*(\([^\)]*\))/,
        RE_TPL_INDEX_SIGN     = /\{(\d+)\}/g, 
        RE_WHITE_SPACE        = /\s/,
        OP_TYPE               = 1,
        OP_PARAMSTYPE         = 2,
        undefined             = void 0,
        Cox                   = { VERSION : "0.1.1" },
        newObject             = null,
        _UTest                = null,
        _Util                 = null,
        __Util                = null,
        _Limit                = null,
        _Optional             = null,
        _Params               = null,
        _Signature            = null,
        _Overload             = null,
        _Implements           = null,
        _Extends              = null,
        _Interface            = null,
        _ClassMode            = null,             
        _Entity               = null,
        _Abstract             = null,
        _Single               = null,
        _Finaly               = null,
        _Class                = null,
        _Define               = null,
        _Depend               = null,
        _Use                  = null,
        _Modules              = null
    ; 
    GLOBAL.Cox = Cox;

    //扩展或修补 环境提供的 console
    void function __console__( ){
        var left_whitespace = "";

        GLOBAL.console = GLOBAL.console || {
            log : EMPTY_FUNCTION
        };  

        if( !console.group ){
            console._log = console.log;
            console.log  = function ( message ){
                message = SLICE.call( arguments ).join( " " );
                RE_LINE_END.lastIndex = 0;
                message = message.replace( RE_LINE_END, "\n" + left_whitespace );
                console._log( left_whitespace + message );
            };
            console.error = console.log;
            console.info  = console.log;
            console.warn  = console.log;
            console.debug = console.log;
            console.group = function( message ){
                message = SLICE.call( arguments ).join( " " );
                RE_LINE_END.lastIndex = 0;
                message = message.replace( RE_LINE_END, " " );         
                console.log( "+", message );
                left_whitespace += "|    ";
            };
            console.groupEnd = function(){
                left_whitespace = left_whitespace.slice( 0, -5 );
                console.log( "|" );            
            };
        }
        /*
        // test console.group
        console.group( "<xxx\ncctv>" );
        console.log( "abc", "ccctv\nacwww\n\nabcdefg" )
        console.log( "abc" )
        console.log( "abc" )
        console.log( "abc" )
        console.group( "<xxx>" );
        console.log("cba");
        console.groupEnd();
        console.log("xxxx");
        console.groupEnd();*/
    }( );

    //Cox.UTest 用于完成单元测试
    void function __Cox_UTest__( ){

        var pendingasserts = {};
        
        _UTest = Cox.UTest = {};
        /**
         * assert 用于保证满足某个或多个特定条件( 他只被用于添加测试组中提供的测试处理器中 )
         * @param { Object } values  如果只给定一个条件表达式，则assert用于保证其条件结果是真值。如果给定多个的条件表达式，那么assert用于保证这些条件表达式，的结果都相同。
         * @param { string } message 可选参数 参数列表最后一参数 用于描述当前assert保证的条件表达式
         */
        function assert( values, message ){
            var args, value_count, failed;
            
            if( !arguments.length ){
                return;
            }

            args        = SLICE.call( arguments );
            values      = args.slice( 0, args.length - 1 || 1 );
            value_count = values.length;
            message     = args[ value_count ] || "assert( " + values.join(", ") + " )";

            if( value_count === 1 ){
                failed  = !values[0];
                this.testmessage.push( {
                    failed    : failed,
                    message   : message
                } );
                if( failed ){
                    return;
                }     
            }

            for( var i = 1, value = values[0]; i < value_count; i++ ){
                failed = value !== values[i];
                value  = values[i];

                this.testmessage.push( {
                    failed    : failed,
                    message   : message
                } );

                if( failed ){
                    break;
                }
            }
        };
        
        /**
         * log 用于输出日记信息( 它只用于添加测试组中提供的测试处理器中 )
         * @param { String } 如果明确给定了 log信息类型(type参数, 参数列表中后一项)则参数列表中第一项与倒数最后第二项, 否则就是整个参数列表， 就被当作输出信息 
         * @param { String } type 参数列表最后一项，其值必须是已经在console对象上已经实现的接口标识符
         */
        function log( message, type ){
            var args = SLICE.call( arguments );
            messages = args.slice( 0, -1 );
            type     = args[ args.length - 1 ];

            if( messages.length === 0 || typeof console[type] !== "function" ){
                messages.push( type );
                type = _UTest.LOG;
            }
            this.testmessage.push( [ messages, type ] );
        }

        /**
         * _UTest.add 添加一测试单元组到测试听候列表中
         * @param { String } groupname 测试单元组标识符
         * @param { Function } handler 测试单元组测试处理器 
         */
        _UTest.add = function( groupname, handler ){
            var group;
            groupname = groupname || "";

            //添加的测试单元信息先会挂在一个等等测试的听候列表
            if( pendingasserts.hasOwnProperty( groupname ) ){
                group = pendingasserts[ groupname ];
            }else{
                group = pendingasserts[ groupname ] = {
                    handlers    : [],
                    testmessage : [],
                    log         : log,
                    assert      : assert
                };
            }

            group.handlers.push( handler );
        };

        /**
         * _UTest.remove 将一个或多个测试单元组从测试听候列表中移除
         * @param { String } 参数列表第一项至最后一项 测试单元组标识符
         */
        _UTest.remove = function( groupname ){
            for( var i = 0, l = arguments.length; i < l; i++ ){
                groupname = arguments[i];
                if( pendingasserts.hasOwnProperty( groupname ) ){
                    delete pendingasserts[ groupname ];
                }
            }
        };

        /**
         * _UTest.removeAll 将所有测试单元组从测试听候列表中移除
         */
        _UTest.removeAll = function(){
            pedingasserts = {};
        }
        /**
         * Utest.test 执行测试 挂在测试听候列表中的 全部或指定的测试单元组
         * @param { String } 参数列表第一项至参数列表最后一项 如果参数列表为空，则测试全部测试单元组，否则就只测试在参数列表中指定的测试单元组
         */
        _UTest.test = function( groupnames ){
            var args;
            
            if( arguments.length ){
                args       = SLICE.call( arguments );
                groupnames = {};
                for( var i = 0, l = args.length; i < l; i++ ){
                    groupnames[ args[i] ] = 1;
                }
            }
            for( var groupname in pendingasserts ){
                if( pendingasserts.hasOwnProperty( groupname ) ){
                    if( !groupnames || groupnames.hasOwnProperty( groupname ) ){
                        var 
                            group    = pendingasserts[ groupname ],
                            handler  = null,
                            result   = null,
                            errcount = 0
                        ;
                        delete pendingasserts[ groupname ];
                        group.handlers = __Util.List.unique( group.handlers );
                        console.group( "test", "<" + groupname + ">" )    
                        while( handler = group.handlers.shift() ){
                            if( handler.name ){
                                log.call( group, "<_UTest.test> # invoke", handler.name, "#" );
                            }
                            handler.call( group );
                            log.call( group, "" );
                        }
                        while( info = group.testmessage.shift() ){
                            if( info instanceof Array ){
                                if( !_UTest.onlyfailed ){
                                    console[ info[1] ].apply( console, info[0] );
                                }
                            }else{
                                if( info.failed ){
                                    errcount++;
                                    console.error( 
                                        "Assertion failed: ", 
                                        info.message 
                                    );
                                    if( _UTest.block ){
                                        console.groupEnd();
                                        break;
                                    }
                                }else if( !_UTest.onlyfailed ){
                                    console.log(
                                        "Assertion ok: ",
                                        info.message
                                    );
                                }
                            }
                        }
                        if( errcount === 0 ){                    
                            console.log( "all pass." );
                        }
                        console.groupEnd();
                    }
                    
                }
            }
        };

        //是否让输出信息只显示错误的
        _UTest.onlyfailed = false;
        //测试中如果有不通过的测试是否阻止其后的其他测试。
        _UTest.block      = true;
        
        //log信息类型常量标识
        _UTest.ERROR      = "error";
        _UTest.WARN       = "warn";
        _UTest.INFO       = "info";
        _UTest.LOG        = "log";
        /*
        //测试输出信息全部使用环境提供的 console模块里的接口
        console          = GLOBAL.console || {
            asscre         : EMPTY_FUNCTION,
            count          : EMPTY_FUNCTION,
            debug          : EMPTY_FUNCTION,
            group          : EMPTY_FUNCTION,
            groupCollapsed : EMPTY_FUNCTION,
            groupEnd       : EMPTY_FUNCTION,
            log            : EMPTY_FUNCTION,
            dir            : EMPTY_FUNCTION,
            info           : EMPTY_FUNCTION,
            time           : EMPTY_FUNCTION,
            timeEnd        : EMPTY_FUNCTION,
            timeStart      : EMPTY_FUNCTION,
            trace          : EMPTY_FUNCTION,
            warn           : EMPTY_FUNCTION,
            table          : EMPTY_FUNCTION
        };*/
        /*
        //_UTest Examples
        _UTest.block = false;

        _UTest.add( "module1", function(){
            this.assert( 0, "A" );
            this.assert( 1, "B" );
        } );
        _UTest.add( "module2", function(){
            this.assert( 1, "Ax" );
            this.assert( 0, "Bx" );
        } );
        _UTest.add( "module3", function(){
            this.assert( 1, "Axx" );
            this.assert( 1, "Bxx" );
        } );
        //_UTest.remove( "module1" ); //把module1的测试从测试列表中删除
        //_UTest.test( "module1", "module3" );//选择性的测试指定的模块
        _UTest.test();
        */
    }();  

    newObject = Object.create || (function(){
        function co_bridge(){};
        return function newObject( proto ){
            co_bridge.prototype = proto;
            return new co_bridge;
        }
    }());
    // Operator 用于创建一操作符（用于完成某些计算并求结果的函数） 
    function Operator( type, handler ){
        var info, op;
        
        if( arguments.length === 1 ){
            op   = handler = type;
            type = undefined;
        }else{
            if( typeof handler != "function" ){
                return false;
            }
            op   = function(){
                var obj = newObject( op.prototype );
                handler.apply( obj, arguments )
                return obj;
            };
        }

        info                      = RE_FUNC_SIGN.exec( handler.toString() );
        op.__NAME__               = info[1] || "Operator" + info[2];
        op.__OPERATOR_TYPE__      = type;
        op.prototype.value        = null;
        op.prototype.equals       = Operator.prototype.equals;
        op.toString = function(){
            return this.__NAME__;
        };
        Operator.oplist.push( op );
        return op;
    };
    Operator.oplist = [];
    Operator.prototype.equals = function( obj ){
        if( this === obj ){ return true; }
        return obj instanceof this.constructor && this.value === obj.value;
    };
    Operator.__instanceLike__ = function( object ){
        return typeof object === "function" && __Util.List.indexOf( Operator.oplist, object ) !== -1;   
    };

    function Null(){}
    Null.__instanceLike__ = function( object ){
        return object === null || object === undefined;
    };

    function PlainObject( ){}
    PlainObject.__instanceLike__ = function( object ){
        return object && object.constructor === Object;
    };

    function List(){}
    List.__instanceLike__ = function( object ){
        if( object ){
            var length = object.length;

            if( object instanceof Array || typeof object === "string" || object instanceof String ){
                return true;
            }
            
            if( typeof length === "number" && length ){
                for( var i = 0; i < length; i++ ){
                    if( !object.hasOwnProperty( i ) ){
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };

    _Limit = Operator( OP_TYPE, function Limit( start, end ){
        start = ~~start;
        end = ~~end;
        this.value = {
            start : Math.min( start, end ),
            end : Math.max( start, end )
        };
    } );

    //Cox.Util & Cox.__Util 里提供了一些公用的函数工具集
    void function __Cox_Util__(){
        var 
            oc_bridge = function(){},
            CANT_ENUM_PROPERTYS = [
                "toString",
                "toLocalString",
                "valueOf",
                "constructor",
                "propertyIsEnumerable",
                "isPrototypeOf",
                "hasOwnProperty"
            ]
        ;
        
        _Util = Cox.Util = {};
        __Util = Cox.__Util = {};

        //用于 Object类型实例 上的一些操作
        __Util.Object = {

            /**
             * __Util.Object.create 
             */
            create : newObject,

            /**
             * __Util.Object.mix 将一对象属性成员 集成到另一对象上
             * @param { Object } dest 目标对象
             * @param { Object } source 源对象
             * @param { Boolean } override 源对象上的属性成员是否覆盖目标对象的同名属性成员
             * @return { Object } 返回 目标对象 
             */
            mix : function ( dest, source, override ){
                dest = dest || {};
                override = !!override;
                _Util.enumDict( source, source.constructor === dest.constructor, function( v, key ){
                    if( override ){
                        dest[key] = v;
                    }else if( !( key in dest ) ){
                        dest[key] = v;
                    }
                } );
                return dest;
            },

            /**
             * __Util.Object.keys 返回一对象的自身属性列表
             * @param { Object } obj 源对象
             * @return { Array }
             */
            keys : function ( obj ){
                var keys = [], 
                    n    = 0;
                _Util.enumDict( obj, true, function( v, key ){
                    keys.push( key );
                } );

                return keys;
            }
        };

        __Util.Function = {
            /**
             * __Util.Function.bind 将一对象绑定在一函数运行时刻的this上
             * @param { Function } func
             * @param { Object } obj
             * @return { Function }
             */
            bind : function( func, obj ){
                return function(){
                    return func.apply( obj, arguments );
                };
            },
            /**
             * __Util.Function.memoize 缓存函数计算结果
             * @param { Function } func
             * @return { Function }
             */
            memoize : function( func ){
                var memoize = {};
                return function(){
                    var 
                        args = SLICE.call( arguments ),
                        key  = JSON.stringify( args )
                    ;
                    if( memoize.hasOwnProperty( key ) ){
                        return memoize[ key ];
                    }else{
                        return memoize[ key ] = func.apply( this, arguments );
                    }
                };
            }
        };

        //用于 字符串 上的一些操作
        __Util.String = {
            /**
             * __Util.String.trim 剔除字符串首尾两段的空白字符
             * @param { String } str
             * @return { String }
             */
            trim : function( str ){
                var 
                    s   = -1,
                    e   = str.length
                ;
                while( RE_WHITE_SPACE.test( str.charAt( ++s ) ) );
                while( e > s && RE_WHITE_SPACE.test( str.charAt( --e ) ) );
                return str.slice( s, e + 1 );
            },
            /**
             * __Util.String.format 使用指定的字符串模板格式和参数返回一个格式化字符串。
             * @param { String } tpl 模板 模板中类似{index}的组件会被替换成tpl参数后对应索引的参数值索引值从0开始
             * @param { String } args
             * @return { String }
             */
            format : function( tpl ){
                var args = SLICE.call( arguments, 1 );
                RE_TPL_INDEX_SIGN.lastIndex = 0;
                return tpl.replace( RE_TPL_INDEX_SIGN, function( a, b ) {
                    return args[ b ];
                } );
            }
        };

        //用于 列表数据 上的一些操作
        __Util.List = {
            /**
             * __List.List.forEach 枚举一序列中的每一列表项
             * @param { List } list 枚举的列表
             * @param { Function } callback 回调函数，作用于枚举到的每一项数值 
             * @param { Object } obj 回调函数中 this引用对象
             */
            forEach :　function ( list, callback, obj ){
                for( var i = 0, l = list.length; i < l ; i++ ){
                    var next = callback.call( obj, list[i], i, list );
                    if( next === false ){
                        break;
                    }else if( typeof next === "number" ){
                        i = ~~--next;
                    }
                }
            },
            /**
             * __Util.List.unique 从一个列表中获取一组独一元二的元素项
             * @param { Array } list 源列表
             * @return { Array }
             */
            unique : function ( list ){
                var 
                    newlist = [],
                    n       = 0
                ;
                LOOP1: for( var i = 0, l = list.length; i < l ; i++ ){
                    var v = list[i];
                    for( var i2 = 0; i2 < n; i2++ ){
                        if( v === newlist[i2] ){
                            continue LOOP1;
                        }
                    }
                    newlist[n++] = v;
                }
                return newlist;
            },
            /**
             * __Util.List.map 创建一个新列表 列表项对应的值是 枚举指定列表中每一项作用于回调函数的返回值
             * @param { Array } list 
             * @param { Function } callback
             * @param { Object } obj
             * @return { Array } 
             */
            map : function( list, callback, obj ){
                var newlist = [];
                for( var i = 0, l = list.length; i < l ; i++ ){
                    newlist[i] = callback.call( obj, list[i], i, list );
                }
                return newlist;
            },
            /**
             * __Util.List.filter 创建一新列表，列表项 是从指定的列表中筛选出的项
             * @param { Array } list
             * @param { Function } callback 回调函数，返回值为0，当前列表项就会被添加到新列表中
             * @param { Object } obj
             * @return { Array }
             */
            filter : function( list, callback, obj ){
                var newlist = [];
                for( var i = 0, l = list.length; i < l ; i++ ){
                    if( callback.call( obj, list[i], i, list ) ){
                        newlist[ i ] = list[ i ];
                    }
                }
                return newlist;
            },

            /**
             *  __Util.List.reduce 根据回调函数中提供的算法来对列表进行统一计算
             * @param { Array } list
             * @param { Function } callback( 最近一次的进行结果, 当前枚举到的列表项, 索引，列表 )
             * @param { Number } initvalue 初始计算结果，默认是列表项第一项的值
             * @return { Number }
             */
            reduce : function( list, callback, initvalue ){
                var 
                    v = ~~initvalue,
                    i = 0,
                    l = list.length 
                ;
                if( arguments.length < 3 ){
                    if( l === 0 ){
                        return false;
                    }
                    v = initvalue = ~~list[ i++ ];
                }

                for( ; i < l; i++ ){
                    v = callback( v, list[i], i, list );
                }
                return v;
            },

            /**
             * __Util.List.indexOf 返回一个元素荐在一列表中的索引位置
             * @param { Array } list 源列表
             * @param { item } Object 查找项目
             * @return { Number } 返回 0 或 +n 表示列表索引， -1 表示查找项目并不包含在 源列表中 
             */
            indexOf : function ( list, item ){
                var index = -1;
                for( var i = 0, l = list.length; i < l ; i++ ){
                    if( list[i] === item ){
                        index = i;
                        break;
                    }
                }
                return index;
            }
        };

        /**
         * _Util.isType 确定某一值是否为一类型
         * _Util.isType 将所有 Function 类型实例视为一类型，将任意一对象 只要实现了 __instanceLike__ 方法就视其为一类型
         * @param { Function/Object } type
         * @return { Boolean }
         */
        _Util.isType = function( type ){
            if( typeof type === "function" ){
                if( Operator.__instanceLike__( type ) ){
                    return type.__OPERATOR_TYPE__ === OP_TYPE;
                }
            }else{
                return !!type && typeof type === "object" && typeof type.__instanceLike__ === "function";
            }
            return true;
        };

        /**
         * _Util.is 确定一对象是否为某一指定类型的实例
         * @param { Object } object 对象
         * @param { Function/Object } type 类型，必须是 _Util.isType( type ) === true
         * @param { Boolean }
         */
        _Util.is = function( object, type) {

            if( !type ){
                return false;
            }

            if( typeof type.__instanceLike__  === "function" ){
                return type.__instanceLike__( object );
            }

            if (object != null && type === Object){
                return true;
            }else if( object === null ){
                return false;
            }

            switch( typeof object ){
                case "object":
                case "function":
                case "undefined":
                    return typeof type === "function" && object instanceof type;
                default:
                    //for string, number and boolean
                    return object.constructor === type;
            }
        };

        /**
         * _Util.enumRange 枚举某一范围内中的数字(以一个数字开始 以1递增 到另一数字结束)
         * @param { _Limit } limit 枚举的数字范围
         * @param { Function } callback 回调函数，作用于枚举到的每一项数值。
         */
        _Util.enumRange = function ( limit, callback ){
            var start, end;
            if( !( limit instanceof _Limit) || typeof callback !== "function"  ){
                return false;
            }

            start = limit.value.start;
            end   = limit.value.end;
            for( var i = start, l = end; i <= l; i++ ){
                var next = callback( i, start, end );
                if( next === false ){
                    break;
                }else if( typeof next === "number" ){
                    i = ~~--next;
                }
            }

        }

        /**
         * _Util.enumList 枚举某一列表中的每一列表项
         * @param { List } list 枚举的列表
         * @param { Function } callback 回调函数，作用于枚举到的每一项数值 
         */
        _Util.enumList = function ( list, callback ){ 
            var isstr = typeof list === "string" || list instanceof String;
            if( !_Util.is( list, List ) || typeof callback !== "function" ){
                return false;
            }
            
            for( var i = 0, l = list.length; i < l; i++ ){
                var next = callback( isstr ? list.charAt(i) : list[i], i, list );
                if( next === false ){
                    break;
                }else if( typeof next === "number" ){
                    i = ~~--next;
                }
            }
        };

        /**
         * _Util.enumDict 枚举某一字典（键值对对象）中的每一键值对
         * @param { Object } dict 枚举的字典
         * @param { Boolean } enumself 是否只枚举字典自身键值，而不枚举它继承链上的键值
         * @param { Function } callback 回调函数，作用于枚举到的每一项数值
         */
        _Util.enumDict = function ( dict, enumself, callback ){
            var propertys = CANT_ENUM_PROPERTYS.slice();
            
            if( !( typeof dict === "object" || typeof dict === "function" ) || typeof callback !== "function"  ){
                return false;
            }

            enumself      = !!enumself;
            for( var key in dict ){
                var tindex;
                if( enumself && !dict.hasOwnProperty( key ) ){
                    continue;
                }
                
                if( propertys.length && __Util.List.indexOf( propertys, key ) > -1 ){
                    propertys.length = 0
                }

                if( callback( dict[key], key, dict ) === false ){
                    break;
                }
            }
            //处理 for .. in ... 在IE中被忽略的属性成员
            if( propertys.length ){
                var key;
                while( key = propertys.pop() ){
                    if( !dict.hasOwnProperty( key ) ){
                        continue;
                    }
                    if( callback( dict[ key ], key, dict ) === false ){
                        break;
                    }
                }

            }
        }

        _Util.mix = __Util.Object.mix;

        _UTest.add( "Cox.Util.isType", function test_isType(){
            this.assert( _Util.isType( Object ), "_Util.isType( Object ) === true" );
            this.assert( _Util.isType( undefined ) === false, "_Util.isType( undefined ) === false " );
            this.assert( _Util.isType( function newtype(){} ), "_Util.isType( function newtype(){} ) === true" );
            var Type = {
                __instanceLike__ : function( obj ){
                    return obj instanceof Function;
                }
            };

            this.assert( _Util.isType( Type ), "_Util.isType( Type ) === true " );
            delete Type.__instanceLike__;
            this.assert( _Util.isType( Type ) === false, "_Util.isType( Type ) === false " );
        } );


        _UTest.add( "Cox.Util.is", function test_is(){
            this.assert( _Util.is( null, Object ) === false, "_Util.is( null, Object ) === false" );
            this.assert( _Util.is( "string" ) === false, "_Util.is( \"string\" ) === false " );
            this.assert( _Util.is( "string", undefined ) === false, "_Util.is( \"string\", undefined ) === false"  );            
            this.assert( _Util.is( "string", String ), "_Util.is( \"string\", String ) === true" );
            this.assert( _Util.is( "string", Object ), "_Util.is( \"string\", Object ) === true" );

            var Null = {
                __instanceLike__ : function( obj ){
                    return obj === null;
                }
            };
            
            this.assert( _Util.is( null, Null ), "_Util.is( null, Null ) === true" );

            function A(){};
            
            this.assert( _Util.is( new A, A ), "_Util.is( new A, A ) === true" );
            function B(){};
            B.prototype = A.prototype;
            B.prototype.constructor = B;
            

            this.assert( _Util.is( new B, B ), "_Util.is( new B, B ) === true" );
            this.assert( _Util.is( new B, A ), "_Util.is( new B, A ) === true" );
            this.assert( _Util.is( new A, B ), "_Util.is( new A, B ) === false" );
        } );
        
        _UTest.add( "Cox.Util.enumRange", function test_enumRange(){
            var 
                testvalue = "",
                callback = function( v ){ testvalue += v; }
            ;
            _Util.enumRange( _Limit( 5 ), callback );

            this.assert( testvalue === "012345", "testvalue === \"012345\"" );

            testvalue = "";
            _Util.enumRange( _Limit( -3, 3 ), callback );

            this.assert( testvalue === "-3-2-10123", "testvalue === \"-3-2-10123\"" );

            testvalue = "";
            _Util.enumRange( 3, callback );

            this.assert( testvalue === "", "testvalue === \"\"" );

            testvalue = "";
            callback = function( v ){
                if( v === 3 ){
                    return false;
                }else{
                    testvalue += v;
                }
            }
            _Util.enumRange( _Limit( 3 ), callback );
            this.assert( testvalue === "012", "testvalue === \"012\"" );

            testvalue = "";
            callback = function( v, i ){
                testvalue += v;
                return v+2;
            }
            _Util.enumRange( _Limit( 4 ), callback );

            this.assert( testvalue === "024", "testvalue === \"024\"" );

        } );
              
        _UTest.add( "Cox.Util.enumList", function test_enumList(){
            var 
                testvalue = "",
                callback = function( v ){ testvalue += v; }
            ;
            _Util.enumList([ 1, 2, 3 ], callback );
            
            

            this.assert( testvalue === "123", "testvalue === \"123\"" );

            testvalue = "";
            _Util.enumList( "HelloWorld", callback );

            
            this.assert( testvalue === "HelloWorld", "testvalue=\"HelloWorld\"" );

            testvalue = "";
            _Util.enumList( {
                0 : "h",
                1 : "e",
                2 : "l",
                3 : "l",
                4 : "o",
                length : 5
            }, callback );
            

            
            this.assert( testvalue === "hello", "testvalue === \"hello\"" );
            
            testvalue = "";
            _Util.enumList( {
                0 : "h",
                1 : "e",
                2 : "l",
                3 : "l",
                4 : "o"
            }, callback );
            
            this.assert( testvalue === "", "testvalue === \"\"" );

            testvalue = "";
            callback = function( v, i ){
                if( i === 3 ){
                    return false;
                }else{
                    testvalue += v;
                }
            }
            _Util.enumList( {
                0 : "h",
                1 : "e",
                2 : "l",
                3 : "l",
                4 : "o",
                length : 5
            }, callback );
            this.assert( testvalue === "hel", "testvalue === \"hel\"" );

            testvalue = "";
            callback = function( v, i ){
                testvalue += v;
                return i+2;
            }
            _Util.enumList( "01234", callback );

            this.assert( testvalue === "024", "testvalue === \"024\"" );

        } );
         
        _UTest.add( "Cox.Util.enumDict", function test_enumDict(){
            var 
                testvalue = "",
                callback = function(v){ testvalue += v }
            ;

            var obj = {
                a : 100,
                b : 200
            };
            testvalue = 0;
            _Util.enumDict( obj, true, callback );

            this.assert( testvalue === 300, "testvalue === 300" );
            
            testvalue = "";
            obj = {
                valueOf : "hello",
                toString : "world"
            };

            _Util.enumDict( obj, true, callback );
            this.assert( testvalue === "helloworld", "testvalue=\"helloworld\"" );

            function A(){};
            A.prototype.a = 100;
            A.prototype.b = 200;
            function B(){};
            B.prototype = A.prototype;
            B.prototype.constructor = B;
            testvalue = 0;
            obj = new B;
            obj.c = 1;
            _Util.enumDict( obj, true, callback );
            this.assert( testvalue === 1, "testvalue === 1" );

            testvalue = 0;
            _Util.enumDict( obj, false, callback );
            this.assert( testvalue === 301, "testvalue === 301" );

            testvalue = 0;
            callback = function( v, i ){
                if( v === 200 ){
                    return false;
                }else{
                    testvalue += v;
                }
            }
            _Util.enumDict( obj, false, callback );
            this.assert( testvalue <= 101, "testvalue <= 101" );

        } );

        _UTest.add( "Cox.__Util.String", function test_String(){
            this.assert( __Util.String.trim( "" ) === "", '__Util.String.trim( "" ) === ""' );
            this.assert( __Util.String.trim( "       " ) === "", '__Util.String.trim( "       " ) === ""' );
            this.assert( __Util.String.trim( "       A" ) === "A", '__Util.String.trim( "       A" ) === "A"' );
            this.assert( __Util.String.trim( "       A       " ) === "A", '__Util.String.trim( "       A       " ) === "A"' );
            this.assert( __Util.String.trim( "A       " ) === "A", '__Util.String.trim( "A       " ) === "A"' );
            this.assert( __Util.String.trim( "      b A b      " ) === "b A b", '__Util.String.trim( "      b A b     " ) === "b A b"' );
            
            this.assert(
                __Util.String.format( "{0}" ) === "undefined",
                '__Util.String.format( "{0}" ) === "undefined"'
            );
            this.assert(
                __Util.String.format( "{0}", "A" ) === "A",
                '__Util.String.format( "{0}", "A" ) === "A"'
            );

            this.assert(
                __Util.String.format( "{0}.{1}", "A", "B" ) === "A.B",
                '__Util.String.format( "{0}.{1}", "A", "B" ) === "A.B"'
            );
        } );
        
        _UTest.add( "Cox.__Util.Object", function test_create(){
            var testobj;
            function A(){};
            A.prototype.test = function(){
                return true;
            }
            testobj = __Util.Object.create( A.prototype );
            
            
            
            this.assert( typeof testobj === "object", "typeof testobj === \"object\"" );
            this.assert( testobj instanceof A, "testobj instanceof A" );
            this.assert( testobj.constructor, A, "testobj.constructor === A" );
            this.assert( testobj.test(), "testobj.test()" );
            var obj = {
                constructor : A,
                test : function(){
                    return "test";
                }
            };
            
            

            testobj = __Util.Object.create( obj );
            this.assert( testobj.constructor, A, "testobj.constructor === A" );
            this.assert( testobj.test(), "test", "testobj.test() === \"test\" " );
        } );

        _UTest.add( "Cox.__Util.Object", function test_mix(){
            var obj     = { a : "a1", b : "b1" },
                testobj = { a : "a2" };

            __Util.Object.mix( testobj, obj );
            

            this.assert( testobj.a === "a2", 'testobj.a==="a2"' );
            this.assert( testobj.hasOwnProperty( "b" ), 'testobj.hasOwnProperty( "b" )' );

            __Util.Object.mix( testobj, obj, true );

            

            this.assert( testobj.a === "a1", 'testobj.a === "a1"' );
            this.assert( testobj.b === "b1", 'testobj.b === "b1"' ); 

            function A(){};
            A.prototype.a = 100;
            A.prototype.b = 200;
            function B(){};
            B.prototype = A.prototype;
            B.prototype.constructor = B;
            B.prototype.c = 300;
            var a1 = new A, a2 = new A;
            var b1 = new B;

            __Util.Object.mix( a1, b1 );

            this.assert( a1.c === 300, "a1.c === 300" );

            testobj = {};
            __Util.Object.mix( testobj, b1 );

            this.assert( testobj.a + testobj.b + testobj.c === 600, "testobj.a + testobj.b + testobj.c === 600" );

        } );

        _UTest.add( "Cox.__Util.List", function test_unique(){
            var list = [ 1, 2, 3, 4, 5, 1, 2, 3 ];
        
            this.assert( __Util.List.unique( list ).join("") === "12345", "__Util.List.unique( list ).join(\"\") === \"12345\"" );
            var t1 = [ 1, 2 ],
                t2 = [ 1, 2 ];
            list   = __Util.List.unique( [ t1, t1, t1, t2 ] );
            this.assert( list.length === 2, "list.length === 2" );

            this.assert( __Util.List.unique( list )[1] == t2, "__Util.List.unique(list)[1] === t2" );

            list = [ 1, 2, 3, 4, 5, 2 ];
            
            this.assert( 
                __Util.List.indexOf( list, 2 ) === 1, 
                "__Util.List.indexOf( list, 2 ) === 1" 
            );
            this.assert( 
                __Util.List.indexOf( list, 6 ) === -1, 
                "__Util.List.indexOf( list, 6 ) === -1" 
            );
            this.assert(
                __Util.List.map( list, function( v, i ){ return i; } ).join("") === "012345",
                '__Util.List.map( list, function( v ){ return i; } ).join("") === "012345"'
            );
            this.assert(
                __Util.List.filter( list, function( v, i ){ return i % 2; } ).join("") === "242",
                '__Util.List.filter( list, function( v ){ return i % 2; } ).join("") === "242"'
            );

            list = [ 1, 2, 3 ];

            this.assert(
                __Util.List.reduce( list, function( p, c ){ return p + c; } ) === 6,
                "__Util.List.reduce( list, function( p, c ){ return p + c; } ) === 6"
            );
            this.assert(
                __Util.List.reduce( list, function( p, c ){ return p + c; }, 2 ) === 8,
                "__Util.List.reduce( list, function( p, c ){ return p + c; }, 2 ) === 8"
            );
        } );

    }();

    void function __Cox_Overload__(){
        /**
         * getTypename 获取某一类型的标识符
         * @param { Function/Object } type
         * @return { String }
         */
        function getTypeName( type ){
            return type.name || type.__NAME__ || type.toString();
        }

        /**
         * _Optional 用于标记 参数为可选
         * @param { Function/Object } type 可选参数类型，值必须是 _Util.isType( type ) === true
         * @param { Object } defaultValue 默认值
         * @return { Object } 
         */
        _Optional = Operator( OP_PARAMSTYPE, function Optional( type, defaultValue ){
            if( !_Util.isType(type) ){
                throw new TypeError( 
                    "Optional操作符 需要一个类型引用操作单元（type参数)." 
                );
            }

            if( arguments.length === 1 ){
                switch( type ){
                    case Number:
                    //case Integer:
                        defaultValue = 0;
                        break;
                    case String:
                        defaultValue = "";
                        break;
                    case Boolean:
                        defaultValue = false;
                        break;
                    case Object:
                        defaultValue = {};
                        break;
                    case Array:
                        defaultValue = [];
                        break;
                    default:
                        defaultValue = null;
                }
            }else{
                if( !_Util.is( defaultValue, type ) && !_Util.is( defaultValue, Null ) ){
                    throw new TypeError( "Optional操作符中 defaultValue参数（如果给定)的值类型必须与type参数的类型匹配.");
                }
            }
            this.value    = [ type, defaultValue ];
            this.__NAME__ = "Optional( " + getTypeName( type ) + ", `" + defaultValue + "` )";
        } );
        
        /**
         * _Optional.prototype.equals 与其他对象的相等性测试
         */
        _Optional.prototype.equals = function( object ){
            return object instanceof _Optional && object.value[0] === this.value[0];
        }

        /**
         * _Params 用于标记 可变长参数列表
         * @param { Function/Object } type 可变长参数项类型,  值必须是 _Util.isType( type ) === true
         * @return{ Object }
         */
        _Params = Operator( OP_PARAMSTYPE, function Params( type ){
            if( !_Util.isType( type ) ){
                throw new TypeError( "Params操作符 需要一个类型引用操作单元（type参数)." );
            }
            this.value    = type;
            this.__NAME__ =  "Params( " + getTypeName( type ) + " )";
        } );
        
        //参数签名格式错误类
        function SignatureError( message ){
            this.type        = SignatureError;
            this.name        = "SignatureError";
            this.message     = message;
            this.description = message;
        }
        SignatureError.prototype = newObject( Error.prototype );
        SignatureError.prototype.constructor = SignatureError;

        /**
         * analysis_signature 用于分析函数签名
         * 检查参数类型列表项的排列位置是否符合规定的
         * 参数列表项的排列位置规定：
         * - Params操作符的使用只允许在参数类型列表的最后一位
         * - Optional操作符的使用只允许在Params操作之前的任意一位置，不过多个Optional操作符的使用必须是连续排列的
         * - 普通参数类型只允许在Params操作符之前的任意一位置。
         * @param { Array } types 参数类型列表
         * @return { Object } 包含参数列表必须匹配最少多少个实参、参数类型列表中可选参数组的开始与结束位置等
         */
        function analysis_signature( types ){
            var 
                lastindex,
                optionStartIndex   = -1,
                optionEndIndex     = -1,
                paramsStartIndex   = -1,
                argumentsMinLength = 0
            ;
            if( !( types instanceof Array ) ){
                return false;
            }
            lastindex = types.length - 1;
            _Util.enumList( types, function( type, index, list ){
                if( _Util.is( type.constructor, Operator ) && !_Util.isType( type.constructor ) ){
                    switch( type.constructor ){
                        case _Optional:
                            if( paramsStartIndex !== -1 ){
                                throw new SignatureError( 
                                    "参数签名中 Optional操作符不允许排列在 Params 操作符之后" 
                                );
                            }
                            if( optionStartIndex === -1 ){
                                optionStartIndex = index;
                                optionEndIndex   = index + 1;
                            }else if( optionEndIndex === index ){
                                optionEndIndex = index + 1;
                            }else{
                                throw new SignatureError( 
                                    "参数签名中 多个Optional操作符必须是在类型列表中连续排列"
                                );
                            }
                        break;
                        case _Params:
                            if( paramsStartIndex !== -1 || index !== lastindex ){
                                throw new SignatureError( 
                                    "参数签名中 只允许有一个Params操作符，并且它排列在类型列表中的最后一位"
                                );
                            }
                            paramsStartIndex = index;
                        break;
                        default:
                            throw new SignatureError( 
                                "参数签名中 不允许有除 Optional、Params操作符之外的其他操作符" 
                            );
                    }
                }else if( _Util.isType( type ) ){
                    argumentsMinLength++;
                }else{
                    throw new SignatureError( 
                        "参数签名中 不允许有非类型值的列表项" 
                    );
                }
            } );

            return {
                optionStartIndex   : optionStartIndex,
                optionEndIndex     : optionEndIndex,
                paramsStartIndex   : paramsStartIndex,
                argumentsMinLength : argumentsMinLength
            };
        } 

        /**
         * _Signature 描述参数签名的信息对象
         */
        _Signature = Operator( OP_TYPE, function Signature( types ){
            types            = SLICE.call( arguments );
            this.value       = analysis_signature( types );
            this.value.types = types;
        } );

        /**
         * _Signature.prototype.equals 与其他对象的相等性测试
         */
        _Signature.prototype.equals = function( osign ){
            var 
                paramtypes = this.value.types,
                oparamtypes = null,
                result = true
            ;
            if( osign === this ){ return true; }
            if( osign instanceof _Signature ){
                if( osign.value.optionStartIndex !== this.value.optionStartIndex
                 || osign.value.optionEndIndex !== this.value.optionEndIndex 
                 || osign.value.paramsStartIndex !== this.value.paramsStartIndex 
                ){
                    return false;
                }
                oparamtypes = osign.value.types;
            }else{
                oparamtypes = osign;
            }

            if( !( oparamtypes instanceof Array ) || paramtypes.length != oparamtypes.length ){
                return false;
            }

            _Util.enumList( oparamtypes, function( type, index ){
                var type2 = paramtypes[ index ];
                if( type !== type2 && ( typeof type.equals !== "function" || !type.equals( type2 ) ) ){
                    result = false;
                    return false;
                }
            } );

            return result;
        };

        /**
         * _Signature.prototype.resolve 使用参数签名对象来解析指定的实参列表
         * @param { List } args 实参列表
         * @return{ Boolean/Array } 如果参数签名与传递的实参列表不匹配时返回 false, 否则返回一个经过重新设定的参数列表(即实际参数列表)
         */
        _Signature.prototype.resolve = function( args ){
            var 
                types           = this.value.types.slice(), 
                require_length  = this.value.argumentsMinLength,
                dest_args       = [],
                last_option     = null
            ;

            if( !_Util.is( args, List ) || args.length < require_length ){
                return false;
            }

            if( this.value.paramsStartIndex === -1 ){
                if( args.length > this.value.optionEndIndex - this.value.optionStartIndex + require_length ){
                    return false;
                }
            }
            while( args.length || types.length ){
                var 
                    type = types.shift(),
                    item = args[0]
                ;
                if( !type ){
                    return false;
                }
                switch( type.constructor ){
                    case _Optional:
                        var opargs = args.splice( 0, args.length - require_length );
                        do{
                            item = opargs[0];
                            if( opargs.length && ( _Util.is( item, type.value[0] ) || _Util.is( item, Null ) ) ){
                                last_option = [ item, dest_args.length, type.value[1] ];
                                dest_args.push( opargs.shift() );
                            }else{
                                dest_args.push( type.value[1] );
                            }
                        }while( _Util.is( types[0], _Optional ) && ( type = types.shift() ) );
                        args.unshift.apply( args, opargs );
                    break;
                    case _Params:
                        var va_args = [];
                        while( args.length ){
                            item = args.shift();
                            if( _Util.is( item, type.value ) || _Util.is( item, Null ) ){
                                va_args.push( item );
                            }else{
                                return false;
                            }
                        }
                        dest_args.push( va_args );
                    break;
                    default:
                        if( _Util.is( item, type ) || _Util.is( item, Null ) ){
                            dest_args.push( args.shift() );
                            require_length--;
                        }else if( last_option ){
                            item = last_option[0];
                            if( _Util.is( item, type ) || _Util.is( item, Null ) ){
                                dest_args[ last_option[1] ] = last_option[2];
                                dest_args.push( item );
                                last_option = null;
                            }else{
                                return false;
                            }
                        }else{
                            return false;
                        }
                    break;
                }
            }

            return dest_args;
        };

        _Signature.prototype.toString = function( name ){
            var types, typenames;
            types = this.value.types;
            typenames = [];
            _Util.enumList( types, function( type ){
                typenames.push( type.name || type.__NAME__ || type.toString()  );
            } );
            return ( name || "function" ) + "( " + typenames.join( ", " ) + " );";
        };

        var __Overload__ = {
            /**
             * __Overload__.define 对一个函数进行重载
             * @param { Function/Object } 参数类型列表 第一个参数至倒数第二个参数
             * @param { Function } funcbody 函数体 最后一个参数
             * @return { void }  
             */
            define : function ( paramtypes, funcbody ){
                var 
                    args       = SLICE.call( arguments ),
                    paramtypes = args.slice( 0, -1 ),
                    func       = args[ args.length - 1 ],
                    olist      = this.__OVERLOAD_INFO__.__OVERLOAD_LIST__,
                    signature  = null
                ;

                if( typeof func != "function" ){
                    throw new TypeError( 
                        "在定义重载函数接口的参数列表中 最后一个参数必须是Function类型实例" 
                    );
                }
                if( paramtypes.length === 1 && _Util.is( paramtypes[0], _Signature ) ){
                    signature = paramtypes[0];
                }else{
                    signature = _Signature.apply( _Signature, paramtypes );
                }

                this.clear( signature );
                signature.__BUILD_FUNCTION__ = func;
                olist.push( signature );
            },
            /**
             * __Overload__.clear 清除重载列表中的某一指定重载或清空重载列表
             * 如果需要清空重载列表，则调用overload.clear时 不需要传递任何参数
             * @param{ Array/_Signature } siganture 函数签名（参数类型列表）
             */
            clear : function ( signature ){
                var olist = this.__OVERLOAD_INFO__.__OVERLOAD_LIST__;
                if( arguments.length === 0 ){
                    olist.length = 0;
                }else{
                    _Util.enumList( olist, function( item, index ){
                        if( item.equals( signature ) ){
                            olist.splice( index, 1 );
                            return false;
                        }
                    } );
                }
            },
            /**
             * __Overload__.defined 检测某一函数签名是否已经被定义在重载函数
             * @param{ Array/_Signature } siganture 参数签名（参数类型列表）
             * @return { Boolean }
             */
            defined : function ( signature ){
                var ret = false;
                if( !signature || !( signature instanceof Array || signature instanceof _Signature ) ){
                    return false;
                }
                _Util.enumList( this.__OVERLOAD_INFO__.__OVERLOAD_LIST__, function( item, index ){
                    if( item.equals( signature ) ){                        
                        ret = true;
                        return false;
                    }
                } );

                return ret;
            },

            clone : function (){
                var 
                    newoverload = _Overload( EMPTY_FUNCTION ),
                    info        = newoverload.__OVERLOAD_INFO__,
                    _info       = this.__OVERLOAD_INFO__
                ;
                info.__OVERLOAD_LIST__ = _info.__OVERLOAD_LIST__.slice();
                info.__NAME__          = newoverload.__NAME__ = _info.__NAME__;
                return newoverload;
            },

            toString : function (){
                var 
                    infos = [],
                    name  = this.__OVERLOAD_INFO__.__NAME__ || "function"
                ;
                _Util.enumList( this.__OVERLOAD_INFO__.__OVERLOAD_LIST__, function( signature, index ){
                    infos.push( signature.toString( name ) );
                } );
                infos.sort( SROT_UP_STRING_LENGTH );
                return infos.join("\n"); 
            }

        };

        

        /**
         * _Overload 定义一个能被重载的函数
         * @param { Function/Object } 参数类型列表 第一个参数至倒数第二个参数
         * @param { Function } funcbody 函数体 最后一个参数
         * @return { Function } 
         */
        _Overload = Operator( function Overload( paramtypes, funcbody ){
            
            var 
                info     = newObject( _Overload.prototype ),
                args     = SLICE.call( arguments ),
                overload = null

            ;

            if( paramtypes instanceof _Signature ){
                var signatures = args.slice( 1 );

                _Util.enumList( signatures, function( signature ){
                    if( !( signature instanceof _Signature ) ){
                        throw new TypeError(
                            "传递给当前 Overload函数的参数列表项值只允许是 Signature类型的实例."
                        );
                    }    
                } );
                signatures.unshift( paramtypes );

                info.__OVERLOAD_LIST__ = signatures;
                return info;
            }

            overload = function( ){
                var 
                    args      = SLICE.call( arguments ),
                    dest_args = null, 
                    func      = null
                ;

                _Util.enumList( info.__OVERLOAD_LIST__, function( signature, index ){
                    if( dest_args = signature.resolve( args ) ){
                        func = signature.__BUILD_FUNCTION__;
                        return false;
                    }
                } );

                if( !func ){
                    throw new Error( 
                        "传递的参数列表未能与当前函数重载列表中的任意一项匹配."
                    );
                }

                return func.apply( this, dest_args ); 
            };
            
            info.__OVERLOAD_LIST__     = [];
            info.__OVERLOAD__          = overload;

            _Util.mix( overload, __Overload__, true );
            overload.__OVERLOAD_INFO__ = info;

            overload.define.apply( overload, args );
            overload.__NAME__          = info.__NAME__ = args[ args.length -1 ].name;

            return overload;
        } );

        _Overload.prototype.defineIn = function( overload ){
            var ret = true;
            if( !( typeof overload === "function" && 
                overload.__OVERLOAD_INFO__ instanceof _Overload )
            ){
                return false;
            }
            _Util.enumList( this.__OVERLOAD_LIST__, function( signature ){
                if( !overload.defined( signature ) ){
                    ret = false;
                    return false;
                }
            } );
            return ret;
        };


        _UTest.add( "Cox.Overload", function test_analysis_signature(){
            this.assert( analysis_signature( [] ), "analysis_signature( [] ) === true" );
            this.assert( analysis_signature( [ String ] ), "analysis_signature( [ String ] ) === true" );
            this.assert( analysis_signature( [ List, _Limit ] ), "analysis_signature( [ List, _Limit ] ) === true" );
            this.assert( analysis_signature( [ _Params( String ) ] ), "analysis_signature( [ _Params( String ) ] ) === true" );
            this.assert( analysis_signature( [ Function, _Optional( String ), _Params( Number )] ), "analysis_signature( [ Function, _Optional( String ), _Params( Number ) ] ) === true" );
            this.assert( 
                analysis_signature( [ _Optional( String ), _Optional( String ), Function, _Params( Number )] ).optionStartIndex === 0, 
                "analysis_signature( [ _Optional( String ), _Optional( String ), Function, _Params( Number ) ] ).optionStartIndex === 0" 
            );
            this.assert( 
                analysis_signature( [ Function, _Optional( String ), _Params( Number )] ).argumentsMinLength === 1, 
                "analysis_signature( [ Function, _Optional( String ), _Params( Number ) ] ).argumentsMinLength === 1" 
            );
        } );

        _UTest.add( "Cox.Overload", function test_Signature(){
            var 
                s1 = _Signature(),
                s2 = _Signature( String, Number ),
                s3 = _Signature( _Optional( Number, -1 ) ),
                s4 = _Signature( Number, _Optional( Number, -1 ) ),
                s5 = _Signature( _Optional( Number ), Number ),
                s6 = _Signature( _Optional( Number ), _Optional( Boolean ), Number ),
                s7 = _Signature( _Params(Number) ),
                s8 = _Signature( Number, _Optional( Boolean ), _Optional( Number ), _Params( Boolean ) )
            ;

            this.assert( _Signature(), "_Signature()" );
            //test _Signature.prototype.equals
            this.log( s1.toString( "s1" ) );
            this.assert( s1.equals() === false, "s1.equals() === false" );
            this.assert( s1.equals( s1 ), "s1.equals( s1 ) === true" );
            this.assert( s1.equals( _Signature() ), "s1.equals( _Signature() ) === true" );
            this.assert( s1.equals( [] ), "s1.equals( [] ) === true" );
            
            this.log( s2.toString( "s2" ) );
            this.assert( s2.equals( s1 ) === false, "s2.equals( s1 ) === false" );
            this.assert( s2.equals( _Signature( String, Number ) ), "s2.equals( _Signature( String, Number ) ) === true" );
            this.assert( s2.equals( [ String, Number ] ), "s2.equals( [ String, Number ] )" );
            this.assert( s2.equals( "string" ) === false, "s2.equals( \"string\" ) === false" );

            this.assert( 
                s8.equals( _Signature( Number, _Optional( Boolean ), _Optional( Number ), _Params( Boolean ) ) ), 
                "s8.equals( Siganture( Number, _Optional( Boolean ), _Optional( Number ), _Params( Boolean ) ) )" 
            );

            //test _Signature.prototype.resolve
            this.assert( s1.resolve( [] ).length === 0, "s1.resolve( [] ).length === 0" );
            this.assert( s1.resolve( [1] ) === false, "s1.resolve( [1] ) === false" );
            this.assert( s2.resolve( [] ) === false, "s2.resolve( [] ) === false" );
            this.assert( s2.resolve( [ "a" ] ) === false, "s2.resolve( [ \"a\" ] ) === false" );
            this.assert( s2.resolve( [ "a", 0 ] ).length === 2, "s2.resolve( [ \"a\", 0 ] ).length === 2" );
            this.assert( s2.resolve( [ "A", 1 ] ).join("") === "A1", "s2.resolve( [ \"A\", 1 ] ).join(\"\") === \"A1\"" );
            this.assert( s2.resolve( [ null, 1 ] ).join("") === "1", "s2.resolve( [ null, 1 ] ).join(\"\") === \"1\"" );
            this.assert( s2.resolve( [ null, undefined ] ).length === 2, "s2.resolve( [ null, 1 ] ).length === 2" );
            //_Optional param
            this.log( s3.toString( "s3" ) );
            this.assert( s3.resolve( [] ).length === 1, "s3.resolve( [] ).length === 1" );
            this.assert( s3.resolve( [] )[0] === -1, "s3.resolve( [] )[0] === -1" );       
            this.assert( s3.resolve( [1] )[0] === 1, "s3.resolve()[0] === [1]" );
            this.assert( s3.resolve( [false] ) === false, "s3.resolve( [false] ) === false" );
            
            this.log( s4.toString( "s4" ) );
            this.assert( s4.resolve( [0] ).join("") === "0-1", "s4.resolve( [0] ).join(\"\") === \"0-1\"" );
            this.assert( s4.resolve( [0, 0] ).join( "" ) === "00", "s4.resolve( [0, 0] ).join( \"\" ) === \"00\"" );
            this.assert( s4.resolve( [0, false] ) === false, "s4.resolve( [0, false] ) === false" );
            this.assert( s4.resolve([  false, 0  ]) === false, "s4.resolve([  false, 0  ]) === false" );

            this.log( s5.toString( "s5" ) );
            this.assert( s5.resolve([  ]) === false, "s5.resolve([  ]) === false" );
            this.assert( s5.resolve([  2  ]).join("") === "02", "s5.resolve([  2  ]).join(\"\") === \"02\"" );
            this.assert( s5.resolve([  5, 40  ]).join("") === "540", "s5.resolve([  5, 40  ]).join(\"\") === \"540\"" );
            this.assert( s5.resolve([  null  ]).join("") === "0", "s5.resolve([  null  ]).join(\"\") === \"0\"" );
            this.assert( s5.resolve([  null, null  ]).join("") === "", "s5.resolve([  null, null  ]).join(\"\") === \"\"" );

            this.log( s6.toString( "s6" ) );
            this.assert( s6.resolve([  1  ]).join("") === "0false1", "s6.resolve([  1  ]).join(\"\") === \"0false1\"" );
            this.assert( s6.resolve([  true, 1  ]).join( "" ) === "0true1", "s6.resolve([  true, 1  ]).join( \"\" ) === \"0true1\"" )
            this.assert( s6.resolve([  222, 1.1  ]).join("") === "222false1.1", "s6.resolve([  222, 1.1  ]).join(\"\") === \"222false1.1\"" );

            //_Params param
            this.log( s7.toString( "s7" ) );
            this.assert( s7.resolve([  ])[0].length === 0, "s7.resolve([  ])[0].length === 0" );
            this.assert( s7.resolve([  0, 1, 2, null, null  ])[0].length === 5, "s7.resolve([  0, 1, 2, null, null  ])[0].length === 5" );
            this.assert( s7.resolve([  0, 1, 2, false  ]) === false, "s7.resolve([  0, 1, 2, false  ]) === false" );

            this.log( s8.toString( "s8" ) );
            this.assert( s8.resolve([  1  ])[0] === 1, "s8.resolve([  1  ])[0] === 1" );
            this.assert( s8.resolve([  1, 2  ])[2] === 2, "s8.resolve([  1, 2  ])[1] === 2" );
            this.assert( s8.resolve([  1, true  ])[1] === true, "s8.resolve([  1, true  ])[2] === true" );
            this.assert( s8.resolve([  1, true, true, false  ])[3].length === 2, "s8.resolve([  1, 2, true, true, false  ])[3].length === 2" );
            this.assert( s8.resolve([  1, 2, true, true, false  ])[3].length === 3, "s8.resolve([  1, 2, true, true, false  ])[3].length === 3" );
        } );
        
        _UTest.add( "Cox.Overload", function test_Overload(){
            var 
                testvalue = null,
                f1 = null
            ;
            f1 = _Overload( function f1(){ return true; } );
            f1.define( String, function( str ){ return str.toLowerCase(); } );
            f1.define( Number, Number, function( a, b ){ return a + b; } );
            f1.define( Boolean, _Optional(Number), function( a, b ){ return a ? b * b : b + b; } );
            f1.define( Boolean, Number, _Params( Number ), function( a, b, c ){
                var val = 0;
                _Util.enumList( c, function( v, index ){
                    if( a ){
                        val += v * b;                        
                    }else{
                        val += v + b;
                    }
                } );
                return val;
            } );
            this.log( f1 );
            this.assert( f1(), "f1() === true" );
            this.assert( f1( "TEST" ) === "test", "f1( \"TEST\" ) === \"test\"" );
            this.assert( f1( 1, 2 ) === 3, "f1( 1, 2 ) === 3" );
            this.assert( f1( true ) === 0, "f1( true ) === 0" );
            this.assert( f1( true, 3 ) === 9, "f1( true, 3 ) === 9" );
            this.assert( f1( true, 1, 1, 2, 3 ) === 6, "f1( true, 1, 1, 2, 3 ) === 6" );
            this.assert( f1( false, 1, 1, 2 ) === 5, "f1( true, 1, 1, 2  ) === 5" );
            this.assert( f1( true, 1 ) === 1, "f1( true, 1 ) === 1" );
            f1.clear( [ Boolean, _Optional( Number ) ] );
            this.assert( f1( true, 1 ) === 0, "f1( true, 1 ) === 0" );

            this.assert( f1.defined( ) === false, "f1.defined( ) === false" );
            this.assert( f1.defined( [] ), "f1.defined( [] ) === true" );
            this.assert( f1.defined( [ Number, Number ] ), "f1.defined( [ Number, Number ] ) === true" );
            this.assert( f1.defined( _Signature( String ) ), "f1.defined( _Signature( String ) ) === true" );
            this.assert( f1.defined( _Signature( Boolean ) ) === false, "f1.defined( _Signature( Boolean ) ) === false" );

            this.assert( 
                _Overload( _Signature(), _Signature( Number, Number ) ).defineIn( f1 ) === true, 
                "_Overload( _Signature(), _Signature( Number, Number ) ).defineIn( f1 ) === true" 
            );

            this.assert( 
                _Overload( _Signature( String ), _Signature( Number, Number ) ).defineIn( f1 ) === true, 
                "_Overload( _Signature( String ), _Signature( Number, Number ) ).defineIn( f1 ) === true" 
            );

            this.assert( 
                _Overload( _Signature( String, String ), _Signature( Number, Number ) ).defineIn( f1 ) === false, 
                "_Overload( _Signature( String, String ), _Signature( Number, Number ) ).defineIn( f1 ) === false" 
            );

            var 
                f2 = _Overload( function (){} ),
                f3 = f2.clone()
            ;

            f3.define( String, function(str){} );

            this.assert( f2 !== f3, "f1 === f2" );
            this.assert( f3.defined( _Signature() ), "f3.defined( _Signature() )" );
            this.assert( f3.defined( _Signature( String ) ), "f3.defined( _Signature( String ) === true" );
            this.assert( f2.defined( _Signature( String ) ) === false, "f2.defined( _Signature( String ) ) === false" );
        } );
        
        //_UTest.test();

    }();

    void function __Cox_Oop__(){
        
        _Extends  = Operator( OP_TYPE, function Extends( classs ){
            var classs = SLICE.call( arguments );
            this.value = __Util.List.unique( classs );
        } );

        _Implements = Operator( OP_TYPE, function Implements( interfaces ){
            interfaces = __Util.List.unique( SLICE.call( arguments ) );

            _Util.enumList( interfaces, function ( item, key ){
                if( !( item instanceof _Interface ) ){
                    throw new TypeError(
                        "Implements操作符参数列表项只允许接受Interface类型实例"
                    );
                }
            } );

            this.value = interfaces;

        } );



        void function __Cox_Oop_Interface__(){

            function checkSignature( methods ){
                _Util.enumDict( methods, true, function( type, name ){
                    var method = null;
                    if( !( type === Function || type instanceof _Overload ) ){
                        throw new TypeError(
                            "接口类中定义的成员只接受 Funtion类型和 Overload类型的实例"
                        );
                    }
                } );
            }

            /**
             * _Interface 用于定义一个接口类
             * @param { String } name 接口类标识符
             * @param { _Extends } extend 提供接口类需要被扩展的父接口类（一个或多个）
             * @param { Function } define 接口类的定义体，提供接口的描述
             * @return { _Interface } 
             */
            _Interface = Operator( OP_TYPE, function Interface( name, extend, define ){
                var 
                    cmethods  = {},
                    imethods  = {}
                ;

                if( extend ){
                    _Util.enumList( extend.value, function( item, index ){
                        if( !( item instanceof _Interface ) ){
                            throw new TypeError(
                                "接口类只允许扩展由Interface操作符创建的接口类"
                            );
                        }
                    } );
                    extend = extend.value;
                }

                if( define && typeof define !== "function" ){
                    throw new TypeError(
                        "接口类只允许使用Function类型的实例作为接口类的类体（提供公共接口的定义）"
                    );
                }

                this.__NAME__             = name || "";
                this.__EXTENDS__          = extend || null;
                this.__CLASS_METHODS__    = cmethods;
                this.__INSTANCE_METHODS__ = imethods;

                cmethods.prototype        = {};

                define.call( cmethods, cmethods, imethods );
                delete cmethods.constructor;
                _Util.mix( imethods, cmethods.prototype, true );
                delete cmethods.prototype;
                checkSignature( cmethods );
                checkSignature( imethods );

            } );

            /**
             * _Interface.prototype.extended 检查接口类是否扩展了另一接口类（父接口类）
             * @param { _Interface } iface 接口类
             * @return { Boolean }
             */
            _Interface.prototype.extended  = function( iface ){
                var ret = false;
                if( !this.__EXTENDS__ || !( iface instanceof _Interface ) ){
                    return false;
                }

                if( __Util.List.indexOf( this.__EXTENDS__, iface ) !== -1 ){
                    return true;
                }

                _Util.enumList( this.__EXTENDS__, function ( item, index ){
                    if( item.extended( iface ) ){
                        ret = true;
                        return false;
                    }
                } );

                return ret;
            };

            /**
             * _Interface.prototype.implementIn 检查一个对象是否实现了接口类提供（描述）的所有接口（方法集）
             * 如果实现接口类的对象有未实现的接口或者实现与接口类描述的对应接口信息不匹配则会抛出异常。
             * @param { Object } obj 接口类的实现体
             * @return { Boolean }
             */
            _Interface.prototype.implementIn = function ( obj ){
                var 
                    _this   = this,
                    ignores = this.__IGNORE_EXTENDS__ instanceof Array ? this.__IGNORE_EXTENDS__ : [],
                    cls     = null,
                    objs    = [
                        {
                            methods : this.__CLASS_METHODS__,
                            obj     : cls = ( typeof obj === "function" ? obj : obj.constructor )
                        },
                        {
                            methods : this.__INSTANCE_METHODS__,
                            obj     : typeof obj === "function" ? obj.prototype : obj
                        }
                    ]
                ;

                //确保多个相同的接口类的implementIn方法只被调用一次
                if( __Util.List.indexOf( ignores, this ) === -1 ){
                    ignores.push( this );
                }else{
                    return true;
                }

                if( this.__PARENT__ ){
                    _Util.enumList( this.__EXTENDS__, function( extend, index ){
                        extend.__IGNORE_EXTENDS__ = ignores;
                        extend.implementIn( obj, ignores );
                        delete extend.__IGNORE_EXTENDS__;
                    } );
                }

                while( obj = objs.shift() ){
                    _Util.enumDict( obj.methods, true, function( type, key ){
                        var method = obj.obj[key];
                        if( typeof obj.obj !== "function" && key === "constructor" && 
                            method === cls && cls.__CLASS_INFO__
                        ){
                            method = cls.__CLASS_INFO__.__CONSTRUCTOR__ 
                        }

                        if( key in obj.obj ){
                            if( method === Function || typeof method !== "function" ){
                                throw new TypeError(
                                    _this + "接口类中的`" + key + "`接口以非Function类型实例被实现"
                                );
                            }
                            if( type instanceof _Overload && !type.defineIn( method ) ){
                                throw new TypeError(
                                    _this + "接口类中的`" + key + "`接口未被完全实现"
                                );
                            }
                        }else{
                            throw new Error(
                                _this + "接口类中的`" + key + "`接口未被实现"
                            );
                        }
                    } );        
                }

                return true;
            };

            _Interface.prototype.__instanceLike__ = function( obj ){
                if( !obj || typeof obj !== "object" ){
                    return false;
                }

                try{
                    this.implementIn( obj );
                    return true;        
                }catch( e ){
                    return false;
                }

            };

            _Interface.prototype.toString = function(){
                return "[interface " + this.__NAME__ + "]";
            };


            _UTest.add( "Cox.Oop.Interface", function test_Interface(){
                Ix = _Interface( "Ix", null, function ( Static, Public ){
                    Static.sm1 = Function;
                    Public.pm1 =  _Overload( _Signature() );
                } );
                
                Ib = _Interface( "Ib", _Extends( Ix ), function ( Static, Public ){
                    Public.pm2 = Function;
                } );
                
                Ic = _Interface( "Ic", _Extends( Ix, Ib ), function ( Static, Public ){
                    Static.sm2 = _Overload( _Signature(), _Signature( String ) );
                    Public.pm1 = _Overload( _Signature( _Params( Object ) ) );
                } );

                this.assert( Ix, "Ix" );
                this.assert( Ib, "Ib" ); 
                this.assert( Ic, "Ic" );

                this.assert( Ix instanceof _Interface, "Ix instanceof _Interface" );
                this.assert( Ib instanceof _Interface, "Ib instanceof _Interface" );
                this.assert( Ic instanceof _Interface, "Ic instanceof _Interface" );

                function A(){}
                A.sm1 = function sm1(){};
                A.sm2 = _Overload( function(){} );
                A.sm2.define( String, function(){} );
                A.prototype.pm1 = _Overload( function(){} );
                A.prototype.pm1.define( _Params( Object ), function(){} );
                A.prototype.pm2 = function(){};

                this.assert( Ix.implementIn( A ), "Ix.implementIn( A ) === true" );
                this.assert( Ib.implementIn( A ), "Ib.implementIn( A ) === ture" );
                this.assert( Ic.implementIn( A ), "Ic.implementIn( A ) === true" );
                this.assert( Ic.implementIn( new A ), "Ic.implementIn( new A ) === true" );
                
                this.assert( Ic.extended( _Interface ) === false, "Ic.extended( _Interface ) === false" );
                this.assert( Ic.extended( Ib ), "Ic.extended( Ib ) === true" );
                this.assert( Ic.extended( Ix ), "Ic.extended( Ix ) === true" );
                this.assert( Ib.extended( Ic ) === false, "Ib.extended( Ic ) === false" );
                this.assert( Ix.extended( Ib ) === false, "Ix.extended( Ib ) === false" );

                this.assert( _Util.is( A, Ix ) === false, "_Util.is( A, Ix ) === false" );
                this.assert( _Util.is( new A, Ix ), "_Util.is( new A, Ix ) === true" );
                this.assert( _Util.is( new String, Ix ) === false, "_Util.is( new String, Ix ) === false" );
                
            } );

        }();


        void function __Cox_Oop_Class__(){
            
            //Base 提供的方法都是所有通过Class操作符创建的类必须继承的方法
            //并且除 toString, equals 这些方法外 其他方法都是不可被重写的(因为它会直接把重写的相应方法给覆盖了)
            function Base(){}

            /**
             * Base.toString 使用字符串对一个类进行简单描述
             * @return { String }
             */
            Base.toString = function(){
                return "[" + this.__CLASS_INFO__.__MODE__ + " class " + this.__NAME__ + "]";
            };  

            /**
             * Base.implemented 一个类是否实现了某一接口类
             * @param { _Interface } itfn 接口类
             * @return { Boolean }
             */
            Base.implemented = function( itfn ){
                var 
                    ret  = false,
                    info = this.__CLASS_INFO__
                ;
                if( info.__IMPLEMENTS__ ){
                    if( __Util.List.indexOf( info.__IMPLEMENTS__, itfn ) !== -1 ){
                        return true;
                    }
                    _Util.enumList( info.__IMPLEMENTS__, function( item ){
                        if( item.extended( itfn ) ){
                            ret = true;
                            return false;
                        }
                    } );
                    if( ret ){
                        return true;
                    }
                }

                if( info.__SUPER__ ){
                    return info.__SUPER__.implemented( itfn );
                }
                return false;

            };

            /**
             * Base.extended 一个类似是否扩展了另一个类
             */
            Base.extended = function( cls ){
                return this.prototype instanceof cls;
            };

            /**
             * Base.prototype.Super 子类方法中访问父类(实例)属性或调用父类(实例)方法
             * @param { String } key 父类属性的标识符
             * @param { Object } args 新值或调用参数(参数列表就是 第二位到最后)
             * @return { Object } 返回父类的成员的数值或 调用父类方法成员时得到的返回值
             */
            Base.prototype.Super = function ( key, args ){
                var 
                    args   = SLICE.call( arguments, 1 ),
                    value  = null,
                    info   = this.constructor.__CLASS_INFO__,
                    _super = null,
                    _info  = null,
                    _this  = null,
                    prop   = null,
                    obj    = null
                ;

                if( !( typeof key === "string" || key instanceof String ) ){
                    throw new TypeError( 
                        "类实例 Super( key, args )方法的 key参数项只接受 String类型实例" 
                    );
                }

                key = key === "constructor" || !key ? "__CONSTRUCTOR__" : key;

                if ( this.__CSLEVEL__ === undefined ) {
                    this.__CSLEVEL__ = info.__SUPER__;
                }

                _super = this.__CSLEVEL__;
                _info  = _super.__CLASS_INFO__;
                
                if( _super ){
                    if( ( key === "constructor" || key === "__CONSTRUCTOR__" ) && _info ){
                        _this = this;
                        key   = "__CONSTRUCTOR__";
                        prop  = _info[ key ];
                        obj   = null;
                    }else{
                        if( !( key in _super.prototype || key in _super )  ){
                            throw new Error(
                                "在 " + _super + "类 中没有定义 `" + key + "`成员"
                            );
                        }

                        if( key in _super.prototype ){
                            _this = this;
                            obj   = _super.prototype;
                        }else{
                            _this = _super;
                            obj   = _super;
                        }
                        
                        prop = obj[key];
                    }

                    if( typeof prop === "function" ){
                        if( _this === this ){
                            this.__CSLEVEL__ = ( _info && _info.__SUPER__ ) || null;
                        }
                        value = prop.apply( _this, args );
                    }else{
                        if( obj && args.length ){
                            obj[key] = args[0];
                        }
                        value = obj[key];
                    }
                }

                delete this.__CSLEVEL__;
                return value;
            };

            /**
             * Base.prototype.instanceOf 一个类实例是否是某一类型的实例
             * @param { Function/_Interface  } cls 类
             * @return { Boolean }
             */ 
            Base.prototype.instanceOf = function( cls ){
                if( cls instanceof _Interface ){
                    return this.constructor.implemented( cls );
                }else{
                    return this instanceof cls;
                }
            };

            /**
             * Base.prototype.isPrototypeOf 指出对象是否存在于另一个对象的原型链中
             * @param { Object } object
             * @return { Boolean }
             */
            Base.prototype.isPrototypeOf = function( object ){
                if( this.constructor.prototype === this ){
                    return object instanceof this.constructor;
                }else if( object ){
                    var proto = object;
                    while( proto && proto = proto.constructor.prototype ){
                        if( this === proto ){
                            return true;
                        }
                    }
                }
                return false;
            };

            /**
             * Base.prototype.toString 一串用于简单描述某一类型实例的字符串
             * @return { String }
             */
            Base.prototype.toString = function( ){
                return "[object " + this.constructor.__NAME__ + "]";
            };


            //_ClassMode 专用于标记类模式的一类型
            _ClassMode = Operator( OP_TYPE, function( name ){
                this.__NAME__ = name;
            } );
            _ClassMode.prototype.toString = function(){
                return this.__NAME__;
            };
            //_ClassMode.prototype.newClass 返回一个相关类模式对应的类构造器（类执行）
            _ClassMode.prototype.newClass = EMPTY_FUNCTION;
            //_ClassMode.prototype.submit 它需要完成的主要目标是 维护 类定义时提供接口的正确性
            _ClassMode.prototype.submit   = EMPTY_FUNCTION;

            //抽象类的 标记
            _Abstract = _ClassMode( "Abstract" );

            /**
             * Abstract.implementIn 检测一个抽象类里提供的抽象接口是否被它的实现类(或类实例)正确的实现了
             * 如果检测到有未被正确实现的抽象接口那么该函数就会抛出一个异常信息
             * @param { _Class } abclass 抽象类
             * @param { Object/Function } obj 实现类（或类实例)
             */
            _Abstract.implementIn = function( abclass, obj ){
                var 
                    info    = abclass.__CLASS_INFO__,
                    _this   = abclass,
                    _super  = info.__SUPER__,
                    _info   = _super && _super.__CLASS_INFO__,
                    cls     = null,
                    objs    = [
                        {
                            methods : info.__CLASS_METHODS__,
                            obj     : cls = ( typeof obj === "function" ? obj : obj.constructor )
                        },
                        {
                            methods : info.__INSTANCE_METHODS__,
                            obj     : typeof obj === "function" ? obj.prototype : obj
                        }
                    ]
                ;
                
                if( _info && _info.__MODE__ === _Abstract ){
                    _Abstract.implementIn( _super, obj );
                }
                while( obj = objs.shift() ){
                    _Util.enumDict( obj.methods, true, function( type, key ){
                        var method = obj.obj[key];
                        
                        if( typeof obj.obj !== "function" && key === "constructor" && 
                            method === cls && cls.__CLASS_INFO__
                        ){
                            method = cls.__CLASS_INFO__.__CONSTRUCTOR__ 
                        }

                        if( key in obj.obj ){
                            if( method === Function || typeof method !== "function" ){
                                throw new TypeError(
                                    _this + "抽象类中的`" + key + "`接口以非Function类型实例被实现"
                                );
                            }

                            if( type instanceof _Overload && !type.defineIn( method ) ){
                                throw new TypeError(
                                    _this + "抽象类中的`" + key + "`接口未被完全实现"
                                );
                            }
                        }else{
                            throw new Error(
                                _this + "抽象类中的`" + key + "`接口未被实现"
                            );
                        }
                    } );        
                }

                return true;
            };

            _Abstract.newClass = function( classinfo ){
                return classinfo.__CLASS__ = function(){
                    throw new Error(
                        classinfo.__CLASS__ + "抽象类不允许被实例化！"
                    );
                };
            };

            _Abstract.submit = function( classinfo ){
                var 
                    cmethods    = {}, 
                    imethods    = {},
                    newclass    = classinfo.__CLASS__,
                    proto       = newclass.prototype,
                    constructor = proto.constructor,
                    tostring    = null
                ;
                _Util.enumDict( newclass, true, function( value, key ){
                    if( value === Function || value instanceof _Overload ){
                        cmethods[key] = value;
                        delete newclass[key];
                    }
                } );
                delete cmethods.constructor;
                _Util.enumDict( proto, true, function( value, key ){
                    if( value === Function || value instanceof _Overload ){
                        imethods[key] = value;
                        delete proto[key];
                    }
                } );
                classinfo.__CLASS_METHODS__    = cmethods;
                classinfo.__INSTANCE_METHODS__ = imethods;

                if( constructor !== newclass ){
                    if( !( constructor === Function || constructor instanceof _Overload ) ){
                        if( typeof constructor === "function" ){
                            classinfo.__CONSTRUCTOR__ = constructor;
                        }else{
                            throw new TypeError(
                                "在类定义中为类实例提供的constructor成员只允许赋值为 Function类型实例"
                            );
                        }
                    }
                }

                tostring = newclass.toString;
                _Util.mix( newclass, Base, true );

                if( tostring !== Function.prototype.toString ){
                    newclass.toString = tostring;
                }
                delete newclass.constructor;
                newclass.implementIn = function( obj ){
                    return _Abstract.implementIn( this, obj );
                }
                newclass.prototype = proto;
            };

            _Single = _ClassMode( "Single" );
            _Single.newClass = function( classinfo ){
                return classinfo.__CLASS__ = function(){
                    return _Single.getInstance.apply( classinfo.__CLASS__, arguments );
                };
            };

            _Single.getInstance = function(){
                var info = this.__CLASS_INFO__;
                if( !info.__SINGLE_INSTANCE__ ){
                    info.__SINGLE_INSTANCE__ = newObject( this.prototype );
                    info.__CONSTRUCTOR__.apply( info.__SINGLE_INSTANCE__, arguments );
                }
                return info.__SINGLE_INSTANCE__;
            }

            _Finaly = _ClassMode( "Finaly" );
            _Finaly.newClass = function( classinfo ){
                return classinfo.__CLASS__ = function(){
                    if( !( 
                        this.constructor === classinfo.__CLASS__ &&  
                        this instanceof classinfo.__CLASS__ 
                    ) ){
                        throw new Error(
                            classinfo.__CLASS__ + "类不能在当前情况情况下进行实例化"
                        );
                    }
                    classinfo.__CONSTRUCTOR__.apply( this, arguments );
                };
            };

            _Entity = _ClassMode( "Entity" );
            _Entity.newClass = function( classinfo ){
                return  classinfo.__CLASS__ = function(){
                    classinfo.__CONSTRUCTOR__.apply( this, arguments );
                };
            };

            _Single.submit = _Finaly.submit = _Entity.submit = function( classinfo ){
                var 
                    newclass    = classinfo.__CLASS__,
                    proto       = newclass.prototype,               
                    constructor = proto.constructor,
                    _super      = classinfo.__SUPER__,
                    _info       = _super && _super.__CLASS_INFO__,
                    tostring    = null
                ;
                tostring = newclass.toString;
                _Util.mix( newclass, Base, true );

                if( classinfo.__MODE__ === _Single ){
                    newclass.getInstance = _Single.getInstance;
                }
                if( tostring !== Function.prototype.toString  ){
                    newclass.toString = tostring;
                }
                tostring = proto.toString;
                _Util.mix( proto, Base.prototype, true );
                if( tostring !== Object.prototype.toString ){
                    proto.toString = tostring;
                }
                proto.constructor = constructor;
                if( constructor !== newclass ){
                    if( constructor !== Function && typeof constructor === "function" ){
                        classinfo.__CONSTRUCTOR__ = constructor;
                    }else{
                        throw new TypeError(
                            "在类定义中为类实例提供的constructor成员只允许赋值为 Function类型实例"
                        );
                    }
                }

                if( _info && _info.__MODE__ === _Abstract ){
                    _Abstract.implementIn( _super, newclass );
                }
                if( classinfo && classinfo.__IMPLEMENTS__ ){
                    classinfo.__IMPLEMENTED__( newclass, classinfo.__SUPER__ );
                }

                newclass.prototype = proto;
            };

            var __IMP_INF_CACHE__ = null;

            /**
             * implemented_interface 检测实体类是否完全实现了继承的所有接口类提供的抽象接口
             * 如果有未被正确实现的抽象接口，就会有一个异常抛出
             * @param { _Class } cls 类
             * @param { _Class } sup 类的父类
             */
            function implemented_interface( cls, sup ){
                var 
                    start = __IMP_INF_CACHE__ === null,
                    info  = sup && sup.__CLASS_INFO__
                ;
                if( start ){
                    __IMP_INF_CACHE__ = [];
                }
                if( info && info.__IMPLEMENTED__ === implemented_interface ){
                    info.__IMPLEMENTED__( cls, info.__SUPER__ );
                }
                try{
                    _Util.enumList( this.__IMPLEMENTS__, function( inf, index ){
                        if( __Util.List.indexOf( __IMP_INF_CACHE__, inf ) === -1 ){
                            __IMP_INF_CACHE__.push( inf );                
                            inf.implementIn( cls );
                        }
                    } );
                }catch( e ){
                    __IMP_INF_CACHE__ = null;
                    throw e;
                }

                if( start ){
                    __IMP_INF_CACHE__ = null;
                }
            }

            /**
             * _Class 用于创建一个自定义类型
             * @param { String } name 类标识
             * @param { _ClassMode/null } mode 类模式标记
             * @param { Extend/null } extend 扩展类（或父类)
             * @param { _Implements/null } interfaces 需要实现的接口类(集)
             * @param { Function } 类定义体
             * @param { Function } 自定类型
             */
            _Class = Operator( function Class( name, mode, extend, interfaces, define ){
                var 
                    newclass        = null,
                    constructor     = EMPTY_FUNCTION,
                    name            = name || define.name,
                    info            = {
                        __CONSTRUCTOR__     : EMPTY_FUNCTION,
                        __SINGLE_INSTANCE__ : null,
                        __CLASS__           : null,
                        __MODE__            : mode,
                        __SUPER__           : null,
                        __IMPLEMENTS__      : null,
                        __NAME__            : define.name
                    }
                ;   

                newclass = mode.newClass( info );

                if( extend ){
                    var sinfo;
                    if( !( extend.value[0] instanceof Function ) ){
                        throw new TypeError(
                            "类的扩展父类只允许是 Function类型实例"
                        );
                    }

                    if( extend.value.length > 1 ){
                        throw new Error(
                            "类不允许扩展（继承）多个父类"
                        );
                    }

                    extend = extend.value[0];
                    sinfo  = extend.__CLASS_INFO__;
                    if( sinfo && sinfo.__MODE__ === _Finaly ){
                        throw new Error(
                            extend + "类不可被扩展"
                        );
                    }
                    if( sinfo && typeof sinfo.__CONSTRUCTOR__ === "function" ){
                        constructor = sinfo.__CONSTRUCTOR__;
                        if( typeof constructor.clone === "function" ){
                            constructor = constructor.clone();
                        }
                    }
                    _Util.enumDict( extend, true, function( item, key ){
                        if( item && typeof item.clone === "function" ){
                            newclass[key] = item.clone();
                        }else{
                            newclass[key] = item;
                        }
                    } );

                    newclass.prototype  = newObject( extend.prototype );
                    
                    _Util.enumDict( extend.prototype, true, function( item, key ){
                        if( item && typeof item.clone === "function" ){
                            newclass.prototype[key] = item.clone(); 
                        }
                    } );
                }
                interfaces = interfaces && interfaces.value;

                newclass.prototype.constructor = constructor;
                define.call( newclass, newclass, newclass.prototype );

                delete newclass.constructor;

                info.__IMPLEMENTED__           = implemented_interface;
                info.__IMPLEMENTS__            = interfaces;
                info.__SUPER__                 = extend;
                info.__NAME__                  = name;
                mode.submit( info );
                newclass.prototype.constructor = newclass;
                newclass.__CLASS_INFO__        = info;
                newclass.__NAME__              = name;
                return newclass;
            } );
            


            _UTest.add( "Cox.Oop.Class", function test_Class(){
                var _this = this;
                var C1 = _Class( "C1", _Entity, null, null, function( Static, Public ){
                    _this.assert( Static === this && Public === this.prototype, "class define" );
                    Public.constructor = function(){
                        _this.assert( true, "C1 constructor called" );
                        this.__value = true;
                    };
                    Public.m1 = function(){
                        _this.assert( true, "call instance method" );
                        _this.assert( this.__value, "get property" );
                    };
                    Static.m1 = function(){
                        _this.assert( true, "call static method" );
                    }
                } );
                var obj = new C1;
                _this.assert( obj instanceof C1, "obj instanceof C1" );
                obj.m1();
                C1.m1();
                _this.assert( C1.toString() === "[Entity class C1]", "C1.toString() === \"[Entity class C1]\"" )
                _this.assert( obj.toString() === "[object C1]", "obj.toString() === \"[object C1]\"" );
                _this.assert( obj !== new C1(), "obj !== new C1()" );
                
                var C2 = _Class( "C2", _Single, null, null, function(){

                } );

                _this.assert( new C2 === new C2, "new C2 === new C2" );

            } );
            
            _UTest.add( "Cox.Oop.Class", function test_Class_Extend(){
                var _this = this;
                var C1 = _Class( "C1", _Entity, null, null, function( Static, Public ){
                    Public.constructor = function(){
                        _this.assert( true, "C1 constructor called" );
                    };
                    Public.m1 = function(){
                        _this.assert( true, "(new A).m1 called" );
                    };
                } );

                var C2 = _Class( "C2", _Finaly, _Extends( C1 ), null, function( Static, Public ){
                    Public.m1 = function(){
                        this.Super( "m1" );
                        _this.assert( true, "(new C2).m1 called" );
                    }
                } );

                var obj = new C2;
                obj.m1();
                _this.assert( obj instanceof C2, "obj instanceof C2" );
                _this.assert( obj instanceof C1, "obj instanceof C1" );
                _this.assert( obj.instanceOf( C2 ), "obj.instanceOf( C2 ) === true" );
                _this.assert( obj.instanceOf( C1 ),"obj.instanceOf( C1 ) === true" );
                _this.assert( C2.extended( C1 ), "C2.extended( C1 ) === true" );
                _this.assert( C1.extended( C2) === false, "C1.extended( C2) === false" );
                _this.assert( C1.prototype.isPrototypeOf( {} ) === false, "C1.prototype.isPrototypeOf( {} ) === false" );
                _this.assert( C1.prototype.isPrototypeOf( obj ), "C1.prototype.isPrototypeOf( obj ) === true" );
                _this.assert( C2.prototype.isPrototypeOf( obj ), "C2.prototype.isPrototypeOf( obj ) === true" );
                
                try{
                    var C3 = _Class( "C3", _Entity, _Extends( C2 ), null, function (){} );
                }catch( e ){
                    _this.assert( true, "can't extend [Finaly class C2]" );
                }

                var C4 = _Class( "C4", _Entity, _Extends( C1 ), null, function( Static, Public ){
                    Public.constructor = _Overload( String, function( str ){
                        this.Super( "constructor" );
                        _this.assert( true, "C4 constructor(String) called" );
                        _this.assert( _Util.is( str, String ), "_Util.is( str, String ) == true" );
                    } );
                } );

                new C4( "Hello" );

            } );   
            

            _UTest.add( "Cox.Oop.Class", function test_Class_Abstract(){
                var _this = this;
                var AC1 = _Class( "AC1", _Abstract, null, null, function( Static, Public ){
                    Static.m1 = Function;
                    Public.m1 = Function;
                    Public.constructor = _Overload( _Signature(), _Signature( String ) );
                } );

                var AC2 = _Class( "AC2", _Abstract, _Extends( AC1 ), null, function( Static, Public ){
                    Public.constructor = _Overload( function constructor(){
                        _this.assert( true, "AC2 constructor called" );
                    } );
                    Public.test = _Overload( _Signature() );
                } );

                var C1  = _Class( "C1", _Entity, _Extends( AC2 ), null, function( Static, Public ){
                    Static.m1 = function(){};
                    Public.m1 = function(){
                        return true;
                    };
                    Public.constructor.define( String, function( str ){
                        _this.assert( true, "C1 constructor(String) called" );
                    } );
                    Public.test = _Overload( function(v){} );
                } );
                new C1();
                new C1( "Abc" );
                this.assert( AC1.implementIn( C1 ), "AC1.implementIn( C1 ) === true" );
                this.assert( AC2.implementIn( C1 ), "AC2.implementIn( C1 ) === true" );
                this.assert( C1.extended( AC1 ), "C1.extended( AC1 ) === true " );
                this.assert( C1.extended( AC2 ), "C1.extended( AC2 ) === true " );

            } );
    
            _UTest.add( "Cox.Oop.Class", function test_Class_Implement_Interface(){
                var _this = this;
                var Ia = _Interface( "Ia", null, function ( Static, Public ){
                    Public.test = Function;
                } );
                var Ib = _Interface( "Ib", null , function( Static, Public ){
                    Public.constructor = _Overload( _Signature( Number ) );
                } );

                var Ic = _Interface( "Ic", _Extends( Ia, Ib ), function ( Static, Public ){
                } );

                var C1 = _Class( "C1", _Entity, null , _Implements( Ic ), function( Static, Public ){
                    Public.test = function ( n ){
                        return "C1" + n;
                    };
                    Public.constructor = _Overload( Number, function constructor(){
                        _this.assert( true, "C1 constructor called" );
                    } ) ;   
                } );

                var obj = new C1( 1 );

                _this.assert( obj.instanceOf( Ia ), "obj.instanceOf( Ia ) === true" );
                _this.assert( obj.instanceOf( Ib ), "obj.instanceOf( Ib ) === true" );
                _this.assert( obj.instanceOf( Ic ), "obj.instanceOf( Ic ) === true" );

                var C2 = _Class( "C2", _Finaly, _Extends( C1 ), null, function( Static, Public ){
                    Public.test = function( str, n ){
                        return str + "-" + this.Super( "test", ~~n )
                    }
                } );
                obj = new C2( 0 );
                _this.assert( C2.implemented( Ic ), "C2.implemented( Ic ) === true" );
                _this.assert( C2.implemented( Ia ), "C2.implemented( Ia ) === true" );
                _this.assert( C2.implemented( Ib ), "C2.implemented( Ib ) === true" );
                
                _this.assert( obj.test( "C2", 1 ) === "C2-C11", "obj.test( \"C2\", 1 ) === \"C2-C11\"" );

            } );   

        }();    

    }();

    void function __Cox_Module_Manage__(){

        var 
            RE_URL_SIGN        = /(?:https?|file):\/{2,3}([^\?#]+).*$/i,
            RE_PROTOCOL_SIGN   = /^\w+:\/{2,3}/,
            RE_URL_ROOT        = /^(\w+:\/{2,3}[^\/]+)/,
            RE_URL_PARAMS      = /(?:\?([^#]*))?(#.*)?$/,
            RE_DIR_NAME        = /^(.*)\/.*$/,
            RE_MODULE_NAME     = /^[\w.]+$/,
            RE_PATH_SEP        = /\\{1,}/g,
            REQUIRE            = typeof require === "function" && global.require !== require && require,
            REL                = GLOBAL.document && GLOBAL.document.documentElement,
            LOCA_URL           = ( GLOBAL.location && GLOBAL.location.href ) || "",
            LOCA_PROTOCOL      = null,
            LOCA_ROOT          = null,
            MODULE_ROOT        = null,
            MODULE_INIT        = 0,
            MODULE_LOADING     = 1,
            MODULE_LOADED      = 2,
            MODULE_READY       = 3,
            MODULE_DEFINED     = 4,
            MODULE_LOAD_FAIL   = -1,
            MODULE_DEFINE_FAIL = -2,
            Module             = null,
            loadedModules      = {},
            loadingModules     = {},
            pendingModules     = [],
            loadModuleEvents   = {
                "load"   : [],
                "loading": [],
                "loaded" : [],
                "error"  : []
            },

            config             = {
                debug       : false,
                roots       : { }
            }
        ;
        /**
         * realpath 计算一相对路径对应的绝对路径
         * @param { String } path 相对路径
         * @return { String }
         */
        function realpath( path ){
            var n = 0;

            RE_PATH_SEP.lastIndex = 0;
            path  = path.replace( RE_PATH_SEP, "/" );
            path  = path.split( "/" );
            _Util.enumList( path, function( item, index ){
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
            } );
            path.length = n;
            path.unshift( "" );
            return path.join("/");
        }

        /**
         * basename 计算一路径里最末端的文件（夹）名
         * @param { String } path
         * @return {String}
         */
        function basename( path ){
            var index;
            RE_PATH_SEP.lastIndex = 0;
            path  = path.replace( RE_PATH_SEP, "/" );
            path  = path.charAt( path.length - 1 ) === "/" ? path.slice( 0, -1 ) : path;
            index = path.lastIndexOf( "/" );
            if( index > -1 ){
                path = path.slice( index + 1 );
            }
            return path;
        }

        /**
         * dirname 计算一路径里末端节点的上级目录
         * @param { String } path
         * @return{ String }
         */
        function dirname( path ){
            var index;
            RE_PATH_SEP.lastIndex = 0;
            path  = path.replace( RE_PATH_SEP, "/" );
            index = path.lastIndexOf( "/" );
            if( index !== -1 ){
                path = path.slice( 0, index ) || "/";
            }else{
                path = "";
            }
            return path;
        }

        /**
         * splitProtocol 将一URL拆分成两部分，第一部分是协议标识，第二部分是具体的路径
         * @param { String } url
         * @return { Array }
         */
        function splitProtocol( url ){
            var protocol = url.match( RE_PROTOCOL_SIGN );
            protocol = protocol && protocol[0] || "";
            return [ protocol, url.replace( protocol, "" ) ];
        }

        //模块或（模块文件）被加载完成时被调用
        function loadedModule( module ){
            var 
                ndepend  = module.depend,
                npending = ndepend && ndepend.pending
            ;

            loadedModules[ module.id ] = module;
            _Modules.fireEvent( "loaded", [ module ] ); 
            console.log( "loaded: ", module.id );

            if( module.state <= MODULE_LOADING ){
                module.state = MODULE_LOADED;
            }

            for( var index = pendingModules.length - 1; index >= 0; index-- ){
                var 
                    pmodule = pendingModules[ index ],
                    depend  = pmodule.depend,
                    pending = depend.pending
                ;

                //加载完成的模块在 听候模块列表中某一模块的依赖列表里。
                if( pending[ module.id ] instanceof Module ){
                    //如果加载完成的模块有依赖模块则必须将他的依赖添加到依赖他的模块中的依赖列表里
                    if( npending && npending.count ){
                        _Util.enumDict( npending, true, function( npmodule, id ){
                            if( npmodule instanceof Module ){ 
                                if( id === pmodule.id || pending[ id ] instanceof Module ){
                                    return;
                                }

                                pending[ id ] = npmodule;
                                pending.count++;
                            }
                        } );
                    }
                    //模块依赖的reallist里也包含着依赖模块依赖的reallist
                    if( ndepend ){
                        _Util.mix( depend.reallist, ndepend.reallist, true );
                        delete depend.reallist[ pmodule.id ];
                    }
                    
                    if( module.id in depend.list  ){
                        depend.list[ module.id ] = module;
                    }
                    depend.reallist[ module.id ] = module; 

                    pending.count--;
                    delete pending[ module.id ];

                    if( pending.count === 0 ){
                        pmodule.state = MODULE_READY;
                        pendingModules.splice( index, 1 );
                        if( typeof pmodule.__MAIN__ === "function" ){
                            pmodule.__MAIN__.call( null, _require( pmodule ), pmodule );
                        }else{
                            console.log( "ready:", pmodule.id );
                        }

                    }     
                }
            }
        }

        /**
         * require 请求支援模块
         * @param { String } 请求模块的uri
         * @return { Object } 模块公共接口集
         */
        function _require( tmodule ){
            var 
                tdepend = tmodule.depend,
                dir     = dirname( tmodule.url )
            ;
            return function require( uri ){
                var 
                    module = null,
                    define = null
                ;
                _Util.enumDict( tdepend.reallist, true, function( m, k ){
                    if( m.uri === uri
                     || k.slice( 0 - uri.length ) === uri 
                     || k.slice( 0 - uri.length - 3 ) === uri + ".js"
                     || realpath( k ) === realpath( dir + "/" + uri )
                    ){ 
                        module = m;
                        return false;
                    }
                } );
                
                if( !( module instanceof Module ) ){
                    throw new Error(
                        "请求的 " + uri + " 模块未被加载或未在 " + ( tmodule.uri || "当前执行"  ) + " 模块的依赖列表中声明."
                    );
                }

                if( module.state === MODULE_DEFINE_FAIL ){
                    throw new Error(
                        "请求的 " + uri + " 模块存在内部定义错误"
                    );
                }

                if( !module.exports ){
                    module.exports = {};
                }

                if( module.state !== MODULE_DEFINED && typeof module.__DEFINE__ === "function" ){
                    try{
                        define       = module.__DEFINE__;
                        module.state = MODULE_DEFINED;
                        delete module.__DEFINE__;
                        define.call( 
                            null, 
                            _require( module ), 
                            module.exports, 
                            module, 
                            module.url,
                            dirname( module.url )
                        );
                    }catch( e ){
                        module.__DEFINE__ = define;
                        module.state      = MODULE_DEFINE_FAIL;
                        throw e;
                    }
                }
                return module.exports;
            };
        }

        //浏览器环境和Node.js环境的兼容处理
        if( LOCA_URL.length ){
            LOCA_PROTOCOL = LOCA_URL.match( RE_PROTOCOL_SIGN )[0];
            LOCA_ROOT     = LOCA_URL.match( RE_URL_ROOT )[1];
            MODULE_ROOT   = LOCA_URL.match( RE_DIR_NAME )[1];
        }else if( REQUIRE ) {
            LOCA_PROTOCOL = "";
            LOCA_ROOT     = dirname( REQUIRE.main.filename );
            //RE_PATH_SEP.lastIndex = 0;
            //MODULE_ROOT   = __dirname.replace( RE_PATH_SEP, "/" );
            MODULE_ROOT   = LOCA_ROOT;
        }

        //default module root

        config.roots[ "~/" ]    = MODULE_ROOT;
        RE_PATH_SEP.lastIndex   = 0;
        config.roots[ "~/Cox" ] = ( REQUIRE ? __dirname.replace( RE_PATH_SEP, "/" ) : MODULE_ROOT ) + "/modules";

        /**
         * Class: Module 模块信息类
         * @constructor( String uri, String, root, _Depend depend, Function define )
         * @method setUri( String, uri, String, root ) 设置 模块的uri
         * @method loadDependModules() 加载依赖的模块
         */
        Module = _Class( "Module", _Finaly, null, null, function ( Module, Public ){
            var moduleUriFormats = [
                {
                    pattern : /^\w+:\/{2,3}[\S]+$/,
                    resolve : function( url ){
                        return url
                    }
                },
                {
                    pattern : /^~\/[\S]+$/,
                    resolve : function( uri ){
                        var root = "~/";
                        __Util.List.forEach( uri.slice( 2 ).split( "/" ), function( item, index ){
                            if( ( root + item ) in config.roots ){
                                root += item;
                                return false;
                            }
                        } );
                        return merge( config.roots[ root ], uri.slice( root.length ) )
                    }
                },
                {
                    pattern : /^(?:\.{1,2}?\/|\/)[\S]+$/,
                    resolve : function( uri, root ){
                        if( uri.charAt( 0 ) === "/" ){
                            root  = LOCA_ROOT;
                        }
                        return merge( root, uri );
                    }
                },
                {
                    pattern : /^[\S]+$/,
                    resolve : function( uri, root ){
                        return [ "", merge( root, uri ) ];
                    }
                }
            ];

            //模块的加载器
            function loadModule( module ){
                var 
                    loader = document.createElement( "script" ),
                    url    = module.url || module.urlSubstitute
                ;
                
                loader.setAttribute( "type"   , "text/javascript" );
                loader.setAttribute( "charset", "utf-8"  );
                loader.setAttribute( "async"  , "true" );
                loader.setAttribute( "defer"  , "true" );
                loader.setAttribute( "src"    , url );

                if( loader.addEventListener ){
                    loader.addEventListener( "load", loaded, true );
                    loader.addEventListener( "error", loadfail, true );
                }else{
                    loader.attachEvent( "onreadystatechange", loaded );
                }
                
                REL.firstChild.insertBefore( loader, null );

                function loaded(){ 
                    if( loader.addEventListener || loader.readyState === "loaded" || loader.readyState === "complete" ){
                        delete loadingModules[ module.id ];
                        _Modules.fireEvent( "load", [ module ] ); 
                        loadedModule( module );
                        if( loader.removeEventListener ){
                            loader.removeEventListener( "load", loaded );
                        }else{
                            loader.detachEvent( "onreadystatechange", loaded );
                        }
                    }
                }

                function loadfail(){
                    delete loadingModules[ module.id ];
                    module.state = MODULE_LOAD_FAIL;
                    if( loader.removeEventListener ){
                        loader.removeEventListener( "error", loadfail );
                    }
                    _Modules.fireEvent( "error", [ module ] ); 
                    console.log( "load fail:", module.id );
                    throw new Error(
                        "未能加载 [ " + module.uri + "(" + url + ") 模块 ]"
                    );
                }
            }

            function merge( root, uri ){
                var protocol = splitProtocol( root );
                root       = protocol[1];
                protocol   = protocol[0];
                return protocol + realpath( root + "/" + uri ).slice( 1 );
            }

            if( REQUIRE ){
                merge = function( root, uri ){
                    return realpath( root + "/" + uri ).slice( 1 );
                };

                loadModule    = function( module ){
                    var load = null;
                    try{
                        try{
                            load = REQUIRE( module.url );
                        }catch( e ){
                            if( module.urlSubstitute ){
                                load = REQUIRE( module.urlSubstitute );
                            }else{
                                throw e;
                            }
                        }
                    }catch( e ){
                        module.state = MODULE_LOAD_FAIL;
                        _Modules.fireEvent( "error", [ module ] ); 
                        console.log( "load fail:", module.id );
                        throw e;
                    }finally{
                        delete loadingModules[ module.id ];
                    }

                    module.__REAL__ = load;

                    if( !module.__DEFINE__ ){
                        module.exports = load;
                    }

                    _Modules.fireEvent( "load", [ module ] );
                    loadedModule( module );
                };

                moduleUriFormats[ 3 ].resolve = function( uri, root ){
                    return [ uri, merge( root, uri ) ];
                };
            }



            Public.constructor = function( uri, root, depend, define ){
                this.setUri( uri, root );
                this.depend     = depend;
                this.state      = MODULE_INIT;
                this.exports    = null;
                this.__DEFINE__ = define;
            };

            Public.setUri = function( uri, root ){
                /*if( RE_MODULE_URI.test( uri ) === false ){
                    throw new Error(
                        "错误的模块标记符格式\"" + uri + "\""
                    );
                }*/
                var url   = "";
                uri       = __Util.String.trim( uri || "" );
                root      = _Util.is( root, String ) ? root : config.roots[ "~/" ];

                uri && __Util.List.forEach( moduleUriFormats, function( format, index ){
                    if( format.pattern.test( uri ) === true ){
                        url = format.resolve( uri, root );
                        return false;
                    }
                }, this );

                
                if( url instanceof Array ){
                    this.id            = uri;
                    this.url           = url[ 0 ];
                    this.urlSubstitute = url[ 1 ];
                }else {
                    this.id  = url;
                    this.url = url;
                }

                this.uri = uri;
            };

            Public.loadDependModules = function( ){
                var _this = this;
                if( !this.depend || !this.depend.pending.count ){
                    return false;
                }
                pendingModules.push( this );
                _Util.enumDict( this.depend.list, true, function( module, id ){
                    if( module instanceof Module ){
                        var loaded = false;
                        loaded = loadedModules[ id ];

                        console.log( "Load:", module.id );
                        
                        if( loaded instanceof Module ){
                            _this.depend.list[ id ] = loaded;
                            _this.depend.reallist[ id ] = loaded;
                            loadedModule( loaded );
                            return;
                        }

                        if( module.master instanceof Module ){
                            return;
                        }

                        if( loadingModules[ id ] instanceof Module ){
                            return;
                        }
                        module.state = MODULE_LOADING;
                        loadingModules[ module.id ] = module;
                        console.log( "Loading:", module.id );
                        _Modules.fireEvent( "loading", [ module ] ); 
                        loadModule( module );
                    }
                } );
            };
        } );
    
        /**
         * Modules 用于包装 模块集
         * @param { Module/String } 参数列表只接受Module类型和String类型实例
         */
        _Modules = Operator( OP_TYPE, function Modules( modules ){
            var 
                args    = __Util.List.unique( SLICE.call( arguments ) ),
                modules = {}
            ;

            _Util.enumList( args, function( uri, key ){
                var module;
                if( typeof uri === "string" ){
                    var 
                        uris = uri.split( "+" ),
                        uri  = uris.shift()
                    ;
                    
                    module = new Module( uri );
                    modules[ module.id ] = module;
                    if( uris.length ){
                        module.branch = {};
                        _Util.enumList( uris, function( buri, index ){
                            var bmodule = new Module( uri + "." + buri );
                            bmodule.uri           = buri;
                            bmodule.url           = module.url;
                            bmodule.master        = module;
                            module.branch[ buri ] = bmodule;
                            modules[ bmodule.id ] = bmodule;
                        } );    
                    }
                    
                }else if( uri instanceof Module ){
                    module = uri;
                    modules[ module.id ] = module;
                }else{
                    throw new TypeError(
                        "Modules操作符的参数列表只允许接受 String类型或Module类型的实例."
                    );
                }
            } );

            this.value = modules;
        } );
        
        /**
         * Modules.debug 模块管理调试开关
         * @param { Boolean } debug
         */
        _Modules.debug = function( debug ){
            config.debug = !!debug;
        };

        /**
         * Modules.addRoot 添加添加根目录（或目录别名）
         * @param { String } alias 目录别名
         *   空字符 "" 为默认模块加载根目录
         * @param { String } root 目录路径
         */
        _Modules.addRoot = function( alias, root ){
            if( RE_URL_SIGN.test( root ) === false ){
                if( root.charAt( 0 ) === "/" ){
                    root = LOCA_ROOT + realpath( root );
                }else{
                    root = LOCA_ROOT + realpath( ( MODULE_ROOT + "/" + root ).replace( LOCA_ROOT, "" ) );
                }
            }
            config.roots[ "~/" + alias ] = root;
        };

        /**
         * Modules.removeRoot 删除某一根目录别名
         * @param { String } alias
         */
        _Modules.removeRoot = function( alias ){
            if( alias === "" ){
                config.roots[ "~/" ] = MODULE_ROOT;
            }else{
                delete config.roots[ "~/" + alias ];                
            }
        };

        /**
         * Modules.getLoadModules 获取已经加载完成的模块列表
         * @return { Object }
         */
        _Modules.getLoadedModules = function(){
            var modules = {};
            _Util.mix( modules, loadedModules, true );
            return modules;
        };

        /**
         * Modules.getPendingModules 获取 正在等待相对依赖模块的模块列表（听候列表）
         * @return { Array }
         */
        _Modules.getPendingModules = function(){
            return pendingModules.slice();
        };

        //触发事件
        _Modules.fireEvent   = function( eventtype, args ){
            var events = loadModuleEvents[ eventtype ];
            if( !( events instanceof Array ) ){
                return;
            }

            _Util.enumList( events, function( handler, index ){
                handler.apply( null, args );
            } );
        };
        
        /**
         * Modules.addEventListener 为模块加载添加全局（作用于需要加载的全部模块）监听事件
         * @param { String } eventtype 事件标识
         *  被接受的事件标识有
         *  loading 模块加载中
         *  loaded  模块加载完成
         *  error   模块加载失败
         * @param { Function } handler 监听事件处理器
         */
        _Modules.addEventListener = function( eventtype, handler ){
            if( !( loadModuleEvents[ eventtype ] instanceof Array ) || typeof handler !== "function" ){
                return;
            }
            loadModuleEvents[ eventtype ].push( handler );
        };

        //删除监听的事件
        _Modules.removeEventListener = function( eventtype, handler ){
            var 
                events = loadModuleEvents[ eventtype ],
                index  = null
            ;
            if( !( events instanceof Array ) || typeof handler !== "function" ){
                return;
            }
            if( ( index = __Util.List.indexOf( events, handler ) ) > -1 ){
                events.splice( index, 1 );
            }
        };

        /**
         * _Depend 包装模块的依赖列表
         * @param { String } modules 参数列表只接受String类型实例
         */
        _Depend = Operator( OP_TYPE, function Depend( modules ){

            if( !( modules instanceof _Modules ) ){
                modules = _Modules.apply( null, arguments );
            }

            this.reset( modules.value, config.moduleroot );
        
        } );

        /**
         * _Depend.prototype.reset 重载依赖列表
         * @param { Array } modules
         * @param { String } root
         */
        _Depend.prototype.reset = function( modules, root ){
            var _this = this;
            modules            = modules || this.list;
            this.list          = {};
            this.reallist      = {};
            this.pending       = {};
            this.pending.count = 0;
            
            _Util.enumDict( modules, true, function( module, id ){
                if( module instanceof Module && !( module.master instanceof Module ) ){
                    module.setUri( module.uri, root );
                    id = module.id;
                    _this.list[ id ]     = module;
                    _this.reallist[ id ] = module;
                    _this.pending[ id ]  = module;
                    _this.pending.count++;

                    if( typeof module.branch === "object" ){
                        _Util.enumDict( module.branch, true, function( module, id ){
                            if( module instanceof Module ){
                                var master = module.master;
                                module.id            = id = master.id + "." + id;
                                module.url           = master.url;
                                _this.list[ id ]     = module;
                                _this.reallist[ id ] = module;
                                _this.pending[ id ]  = module;
                                _this.pending.count++;
                            }
                        } );
                    }
                }
            } );

        };

        /**
         * _Define 定义一新模块
         * @param { String } modulename 模块名称
         * @param { Depend } depend 依赖列表
         * @param { Function } define 模块定义
         * @return { Module }
         */
        _Define = Operator( function Define( modulename, depend, define ){
            var 
                newmodule   = null, 
                modulename  = __Util.String.trim( modulename ),
                cmodulename = new RegExp( "\/" + modulename + "(?:\.js|\.JS)?$" )
            ;


            if( !( _Util.is( modulename, String ) ? modulename : "" ).length ){
                throw new TypeError(
                    "传递给 Define操作符参数列表中的第一个（modulename)参数必须是一个非空的 String类型实例"
                );
            }

            if( !RE_MODULE_NAME.test( modulename ) ){
                throw new Error(
                    "给定的 \"" + modulename + "\" 标识符不是正确格式的模块标识符\n" + 
                    "模块标识符只支持 (A-Za-z)由字母、(0-9)数字、(_)下划线、(.)点符号 组成的字符串."
                );
            }

            if( !define ){
                throw new Error(
                    "传递给 Define操作符参数列表中的第后一个（define)参数必须是一个 Function类型实例"
                );
            }

            _Util.enumDict( loadingModules, true, function( module, id ){
                if( module instanceof Module ){
                    if( module.branch && module.branch[ modulename ] instanceof Module ){
                        newmodule = module.branch[ modulename ];
                        loadedModule( newmodule );
                        return false;
                    }else{
                        if( !module.__DEFINE__ && cmodulename.test( module.id ) ){
                            newmodule = module;
                            return false;
                        }
                    }
                }
            } );

            if( !newmodule ){
                newmodule = new Module( modulename, "", depend, define );
                loadedModule( newmodule );
            }else if( depend ){
                depend.reset( depend.list, dirname( newmodule.url ) );
            }

            newmodule.__DEFINE__ = define;
            newmodule.depend     = depend;
            newmodule.loadDependModules();
            return newmodule;
        } );
    

        /**
         * _Use 使用模块
         * @param { Modules } modules 需要使用的模块
         * @param { Function } handler 
         */
        _Use = Operator( function Use( modules, handler ){
            var module = new Module( null, null, _Depend( modules ) );
            module.__MAIN__ = handler;
            module.loadDependModules();
        } );

        _UTest.add( "Cox.Module_Manage.funs", function test_funs(){
            this.assert( realpath( "" ) === "", 'realpath( "" ) === ""' );
            this.assert( realpath( "a" ) === "/a", 'realpath( "a" ) === "/a"' );
            this.assert( realpath( "a//b//c\\\\d" ) === "/a/b/c/d", 'realpath( "a//b//c\\\\d" ) === "/a/b/c/d"' );
            this.assert( realpath( "./a/x/y/../../b/./c/d/." ) === "/a/b/c/d", 'realpath( "./a/x/y/../../b/./c/d/." ) === "/a/b/c/d"' );

            this.assert( basename( "" ) === "", 'basename( "" ) === ""' );
            this.assert( basename( "a" ) === "a", 'basename( "a" ) === "a"'  );
            this.assert( basename( "a/b/c" ) === "c", 'basename( "a/b/c" ) === "c"' );
            this.assert( basename( "a/b/c.js" ) === "c.js", 'basename( "a/b/c.js" ) === "c.js"' );

            this.assert( dirname( "a" ) === "", 'dirname( "a" ) === ""' );
            this.assert( dirname( "a/b/c" ) === "a/b", 'dirname( "a/b/c" ) === "a/b"'  );
        } );
        
        _UTest.add( "Cox.Module_Manage.Module", function test_Module(){
            var module = new Module();
            this.assert( module, "instance Module" );

            module.setUri( "http://www.Cox.com/A" );
            
            this.assert( module.uri === "http://www.Cox.com/A", "(http://www.Cox.com/A) module.uri" );
            this.assert( module.url === "http://www.Cox.com/A", "(http://www.Cox.com/A) module.url" );
            this.assert( module.id  === "http://www.Cox.com/A", "(http://www.Cox.com/A) module.id" );

            module.setUri( "/A" );
            this.assert( module.uri === "/A", "(/A) module.uri" );
            this.assert( module.url === LOCA_ROOT + "/A", "(/A) module.url" );
            this.assert( module.id  === module.url, "(/A) module.id" );

            module.setUri( "./A" );
            this.assert( module.uri === "./A", "(./A) module.uri" );
            this.assert( module.url === config.roots[ "~/" ] + "/A", "(./A) module.url" );
            this.assert( module.id  === module.url, "(./A) module.id" );

            module.setUri( "A" );

            this.assert( module.uri === "A", "(A) module.uri" );
            this.assert( module.url === "A" || module.url === "", "(A) module.url" );
            this.assert( module.urlSubstitute === config.roots[ "~/" ] + "/A", "(A) module.urlSubstitute" );
            this.assert( module.id  === module.uri, "(A) module.id" );



        } );
        
        _UTest.add( "Cox.Module_Manage.Modules&Depend", function test_Modules_AND_Depend(){
            var 
                root1 = LOCA_ROOT,
                root2 = config.roots["~/"],
                root3 = config.roots["~/"] + "/modules",
                m1 = _Modules( "/A1", "~/A2", "~/Cox/A3", "./A", "./A+B", "C" ),
                d1 = _Depend( m1 );
            ;
            this.assert( m1.value[ root1 + "/A1" ].url );
            this.assert( m1.value[ config.roots["~/"] + "/A2" ].url );
            this.assert( m1.value[ config.roots["~/Cox"] + "/A3" ].url );
            this.assert( m1.value[ root2 + "/A" ].url );
            this.assert( m1.value[ root2 + "/A.B" ].url );
            this.assert( m1.value[ root2 + "/A" ].branch[ "B" ].url );
            this.assert( m1.value[ root2 + "/A" ].branch[ "B" ].master.id );
            this.assert( m1.value[ "C" ].uri );

            this.assert( d1.reallist[ root1 + "/A1" ].url );
            this.assert( d1.reallist[ config.roots["~/"] + "/A2" ].url );
            this.assert( d1.reallist[ config.roots["~/Cox"] + "/A3" ].url );
            this.assert( d1.reallist[ root2 + "/A" ].url );
            this.assert( d1.reallist[ root2 + "/A.B" ].url );
            this.assert( d1.reallist[ "C" ].uri );
            d1.reset( m1.value, root3 );

            this.assert( d1.reallist[ root1 + "/A1" ].url );
            this.assert( d1.reallist[ config.roots["~/"] + "/A2" ].url );
            this.assert( d1.reallist[ config.roots["~/Cox"] + "/A3" ].url );
            this.assert( d1.reallist[ root3 + "/A" ].url );
            this.assert( d1.reallist[ root3 + "/A.B" ].url );
            this.assert( d1.reallist[ "C" ].uri );
        } );
        //_UTest.test( "Cox.Module_Manage.Modules&Depend" );  
    }();

    //下列就是 Cox 提供的公共接口
    GLOBAL.Cox        = Cox;
                        Cox.__Util     = __Util;
                        Cox.Util       = _Util;
    GLOBAL.GLOBAL     = Cox.GLOBAL     = GLOBAL;
    GLOBAL.UTest      = Cox.UTest      = _UTest;
    GLOBAL.Optional   = Cox.Optional   = _Optional;
    GLOBAL.Params     = Cox.Params     = _Params;
    GLOBAL.Limit      = Cox.Limit      = _Limit;
    GLOBAL.Signature  = Cox.Signature  = _Signature;
    GLOBAL.Overload   = Cox.Overload   = _Overload;
    GLOBAL.Implements = Cox.Implements = _Implements;
    GLOBAL.Extends    = Cox.Extends    = _Extends;
    GLOBAL.Abstract   = Cox.Abstract   = _Abstract;
    GLOBAL.Single     = Cox.Single     = _Single;
    GLOBAL.Finaly     = Cox.Finaly     = _Finaly;
    GLOBAL.Depend     = Cox.Depend     = _Depend;
    GLOBAL.Modules    = Cox.Modules    = _Modules;

    GLOBAL.forEach = Cox.forEach = _Overload( Limit, Function, _Util.enumRange );
    GLOBAL.forEach.define( List, Function, _Util.enumList );

    GLOBAL.forEach.define( Object, _Optional( Boolean, true ), Function, _Util.enumDict );

    GLOBAL.Interface = Cox.Interface = _Overload(
        _Optional( String ), _Optional( _Extends ), Function,
        _Interface
    );

    GLOBAL.Class = Cox.Class = _Overload(
        _Optional( String ), _Optional( _ClassMode, _Entity ), _Optional( _Extends ), _Optional( _Implements ), Function,
        _Class
    );

    GLOBAL.Define = Cox.Define = _Overload( 
        String, _Optional( _Depend ), Function, 
        _Define  
    );

    GLOBAL.Use = Cox.Use = _Overload(
        _Modules, Function,
        _Use
    );

    if( typeof exports !== "undefined" ){
        module.exports = Cox;
    }
    //_UTest.onlyfailed = true;
    //_UTest.test( );
}();
