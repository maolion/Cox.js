/**
 * #Cox.js
 * ----------------------------------------------------------------------------
 * Cox.js 它是在标准原生 JavaScript 基础之上对 JavaScript 使用的扩展
 *  
 * ####License (授权许可)
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2013, Cox, 江宜玮 <maolion.j@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining  
 * a copy of this software and associated documentation files (the  
 * 'Software'), to deal in the Software without restriction, including  
 * without limitation the rights to use, copy, modify, merge, publish,  
 * distribute, sublicense, and/or sell copies of the Software, and to  
 * permit persons to whom the Software is furnished to do so, subject to  
 * the following conditions:  
 *
 * The above copyright notice and this permission notice shall be  
 * included in all copies or substantial portions of the Software.  
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,  
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF  
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,  
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE  
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
 *
 * ----------------------------------------------------------------------------
 *
 * -   Date 2013-9-10
 * -   Version 1.0
 * -   Author 江宜玮
 */

;void function(){
    var 
        //常量
        SLICE                 = Array.prototype.slice,
        GLOBAL                = (function(){ return this; }()),
        BASE_PROTOTYPE        = Object.prototype,
        EMPTY_FUNCTION        = function(){},
        SROT_UP_STRING_LENGTH = function( a, b ){ return a.length > b.length; },
        RE_CRLF               = /\n\r|\r\n|\r|\n/g,
        RE_FUNC_SIGN          = /function\s*(\w+)*\s*(\([^\)]*\))/,
        RE_TPL_INDEX_SIGN     = /\{(\d+)\}/g, 
        RE_WHITE_SPACE        = /\s/,
        OP_TYPE               = 1,
        OP_PARAMSTYPE         = 2, 
        undefined             = void 0,
        isNode                = typeof require === "function" && global.require !== require,
        isBrowser             = typeof window === "object"  && window === GLOBAL,
        Cox                   = { VERSION : "1.0.0" },
        newObject             = null,
        gunit                 = null,
        //主要功能模块（对外接口）
        _KeyWord              = null,
        _XObject              = null,
        _XFunction            = null,
        _XString              = null,
        _XList                = null,
        _PlainObject          = null,
        _Null                 = null,
        _Type                 = null,
        _Util                 = null,
        _is                   = null,
        _Nullable             = null,
        _Optional             = null,
        _Params               = null,
        _ParamTypeTable       = null,
        _Implements           = null,
        _Extends              = null,
        _Interface            = null,
        _ClassMode            = null, 
        _Entity               = null,
        _Abstract             = null,
        _Single               = null,
        _Finaly               = null,
        _Class                = null,
        _Event                = null,
        _EventListener        = null,
        _EventSource          = null,
        _Deferred             = null,
        _DeferredList         = null,
        _Define               = null,
        _Depend               = null,
        _Use                  = null,
        _Modules              = null
    ;
    
    //创建一个新对象，并将指定对象作用于新对象原型链上   
    newObject = Object.create || (function(){
        function co_bridge(){};
        return function newObject( proto ){
            co_bridge.prototype = proto;
            return new co_bridge;
        }
    }());

    
    //创建对象工厂类
    function ObjectFactory( factory, extend ){
        var 
            factory_wrap = function(){
                var 
                    obj  = newObject( factory_wrap.prototype )
                ;
                factory.apply( obj, arguments );
                return obj;
            },
            prototype    = null,
            orign_sign   = factory.toString()
        ;

        if( extend ){
            factory_wrap.prototype = newObject( extend );
        }
        prototype = factory_wrap.prototype;
        prototype.constructor = factory_wrap;
        
        //让包裹函数能得到“有用”的 toString信息
        factory_wrap.toString = function toString(){
            return orign_sign;
        };

        return factory_wrap;
    }

    /*
    实现 用于标记某功能模块的标识符为Cox的关键字（对外提供的核心接口标识符）
    每一个关键字都是独一无二的，一个关键字与另一个关键字的关系是有紧密相连的（也
    就是说两个（或多个)中，其中一个的使用离不开另一个,也可以被看作是辅助关系)。
    当然也有单独使用，互不依 赖的。每一个关键字都有一所属分组(目的只是为了更好
    区分关键字是针对哪些需要而被使用)

    由于此功能模块仅限内部使用，所以只考虑所有调用都是以正确方式被调用。
    */
    void function _IMPLEMENT_KEYWORD_(){
        var 
            groups = {
                Tool              : {},
                DataType          : {},
                ParamTypeModifier : {},
                Subsidiary        : {}
            },
            keywords = {}
        ;

        /**
         * _KeyWord 将某一标识符标记为关键字
         * @param { Skktring } name 需要被标记为关键字的标识符
         * @param { String } group 关键字所属分组
         *  默认会将关键字添加到General分组中
         *
         *  可接受的数据
         *  null, "Tool", "ParamTypeModifier", "Subsidiary",
         *  _KeyWord.TOOL,
         *  _KeyWord.DATATYPE,
         *  _KeyWord.PARAM_TYPE_MODIFIER,
         *  _KeyWord.SUBSIDIARY
         * 
         * @param { Function } handler 关键字关键的功能模块
         * @return { Function } 返回 handler参数引用
         * @example
         *  var Class    = _KeyWord( "Class", null, function Class(){...} );
         *  var Extends  = _KeyWord( "Extends", _KeyWord.Subsidiary, function(){...} );
         */
        _KeyWord = function KeyWord( name, group, handler ){
            var keyword = null;
            
            group = groups[ group || _KeyWord.TOOL ];
            //只为防止不以内置对象成员标识符发生冲突
            name  = "__Cox_" + name + "__";
            //将关键字名称与处理函数绑定一起目的是确保验证结果的可靠性
            //不直接将 keywords[ name ] 赋值为 handler的 目的是考虑到某些接口会
            //被重新包装后再对外提供
            keyword = keywords[ name ] || ( keywords[ name ] = {} );

            handler.__COX_KEYWORD_NAME__  = name;
            handler.__COX_SIGN__          = name;
            keyword.name                  = name;
            keyword[ handler.toString() ] = handler;
            group[ name ]                 = keyword;
            return handler;
        };

        _KeyWord.TOOL                 = "Tool";
        _KeyWord.DATATYPE             = "DataType";
        _KeyWord.PARAM_TYPE_MODIFIER  = "ParamTypeModifier";
        _KeyWord.SUBSIDIARY           = "Subsidiary";

        //快捷接口
        _KeyWord.Tool = function Tool( name, handler ){
            return _KeyWord( name, _KeyWord.TOOL, handler );
        };

        _KeyWord.DataType = function DataType( name, handler ){
            return _KeyWord( name, _KeyWord.DATATYPE, handler );
        };

        _KeyWord.ParamTypeModifier = function ParamTypeModifier( name, handler ){
            return _KeyWord( name, _KeyWord.PARAM_MTYPE_MODIFIER, handler );
        };

        _KeyWord.Subsidiary = function Subsidiary( name, handler ){
            return _KeyWord( name, _KeyWord.SUBSIDIARY, handler );
        };

        /**
         * _KeyWord.__instancelike__ 判断某一对象是否为KeyWord(也可理解为实例)
         * @param { Function } obj 
         * @param { String } group
         * @return { Boolean }
         * @example
         *  var Class    = _KeyWord( "Class", null, function Class(){...} );
         *  _KeyWord.__instancelike__( Class ); // true
         *  _KeyWord.__instancelike__( Class, "TOOL" ); // true
         *  _KeyWord.__instancelike__( Class, _KeyWord.PARAM_TYPE_MODIFIER ); // false
         */
        _KeyWord.__instancelike__ = function __instancelike__( obj, group ){
            var 
                keyword = null
            ;

            if( !( typeof obj == "function" && obj.__COX_KEYWORD_NAME__ ) ){
                return false;
            }
            keyword  = keywords[ obj.__COX_KEYWORD_NAME__ ];
            if( !( keyword && obj.toString() in keyword ) ){
                return false;
            }

            if( group ){
                group = groups[ group ];
                if( !( keyword.name in group ) ){
                    return false;
                }
            }

            return true;
        };
    
    }();
    //gunit.subUnit( "KeyWord" ).test();

    /*
     * 提供了一套常用的基础工具组件
     */
    void function __IMPLEMENT_UTIL__(){
        var 
            CANNOT_ENUM_PROPERTYS = -[1,] && [] || [
                "toString",
                "toLocalString",
                "valueOf",
                "constructor",
                "propertyIsEnumerable",
                "isPrototypeOf",
                "hasOwnProperty"
            ],
            SPECIAL_CHARS         = {
                '\b' : '\\b',
                '\t' : '\\t',
                '\n' : '\\n',
                '\f' : '\\f',
                '\r' : '\\r',
                '\v' : '\\v',
                '"'  : '\\"',
                '\\' : '\\\\'
            },
            ESCAPABLE = /[\\\"\x00-\x1f]/g
        ;
            
        //基础数据类型(或扩展)

        /**
         * PlainObject 提供一个干净的对象（其原型链上只有Object.prototype一级, 即Object类直属实例）
         * 提供该类的主要目的是用于确定某一对象实例是否为Object类“直属”实例
         */
        _PlainObject = _KeyWord( "PlainObject", _KeyWord.DATATYPE, function PlainObject(){
            return {};
        } );

        /**
         * PlainObject.__instacelike__ 用于判断某一对象实例是否为Object类“直属”实例
         * @param { Object } obj 对象实例
         * @return { Boolean } 如果对象实例是 Object的直属实例（其原型链上只有Object.prototype一级）
         * 返回结果为"true"否则为"false"
         */
        _PlainObject.__instancelike__ = function( obj ){
            return obj && obj.constructor === Object;
        };

        _Type = _KeyWord( "Type", _KeyWord.DATATYPE, function Type(){
            return Function.apply( null, arguments );
        } );

        _Type.__instancelike__ = function( type ){
            return !!type  && ( 
                typeof type === "function" || 
                typeof type.__instancelike__ === "function" 
            );
        }

        /**
         * Null 空数据类型
         */
        _Null = _KeyWord( "Null", _KeyWord.DATATYPE, function Null(){
            return null;
        } );

        /**
         * Null.__instancelike__
         * @param { null/undefined } obj
         * @return { Boolean }
         */
        _Null.__instancelike__ = function( obj ){
            return obj === null || obj === undefined;
        };

        /**
         * XObject 提供一些用于操作对象数据的一些静态方法集，通过 XObject构
         * 造出的对象与普通对象无任何差别
         */
        _XObject = _KeyWord( 
            "XObject", _KeyWord.DATATYPE, ObjectFactory( function XObject(){
                //...
            } )
        );

        /**
         * XObject.create 创建一个新对象，并将指定对象作用于新对象原型链上
         * @example
         *  var obj = null;
         *  obj = _XObject.create( { 
         *      p1 : 1
         *      m1 : function(){ return this.p1; }
         *  } );
         *  obj.m1() === 1;
         */
        _XObject.create = newObject;
            
        /**
         * XObject.forEach 将一回调函数作用于一对象枚举到的所有成员(也可以
         * 有选择性的包含对象原型链上的成员 ) 上
         * @param { Object } obj 需要被枚举（操作）的对象
         * @param { Boolean } onlyself 是否只枚举对象自身上的成员（即，不包含
         * 目标对象原型链中的成员),
         * @param { Function } callback 作用于每个枚举到的成员的回调函数，
         * 回调函数的参数列表依次为：[ 成员值，成员键名，目标对象 ] .
         * 如果需要让回调函数停止对象余下成员的枚举，可以将回调函数的返回值
         * 设置为 false
         * @param { Object } thisp 回调函数 内部 this 指向(默认为环境全局对象) 
         * @examples
         *  var obj = {
         *      p1 : 1,
         *      p2 : 2
         *  };
         *
         *  XObject.forEach( obj, true, function( value, key, obj ){
         *      //...
         *  } );
         *
         *  function A(){
         *      this.p1 = 1;
         *  }
         *  A.prototype.p2 = 2;
         *  XObject.forEach( new A, false, function( value, key, obj ){
         *      //...
         *  } );
         */
        _XObject.forEach = function( obj, onlyself, callback, thisp ){
            onlyself = !!onlyself;
            for( var key in obj ){
                if( onlyself && !obj.hasOwnProperty( key ) ){
                    continue;
                }
                if( callback.call( thisp, obj[ key ], key, obj ) === false ){
                    break;
                }
            }

            //for...in 在IE8- 的环境中无法枚举出已被标记为 dontEnum 的成员
            //dontEnum，即 obj.propertyIsEnumerable( key ) === false
            for( var i = CANNOT_ENUM_PROPERTYS.length - 1, key; i >= 0; i-- ){
                key = CANNOT_ENUM_PROPERTYS[ i ];
                if( onlyself && !obj.hasOwnProperty( key ) ){
                    continue;
                }
                if( callback.call( thisp, obj[ key ], key, obj ) === false ){
                    break;
                }
            }

        };

        /**
         * XObject.mix 将某一对象上的成员混合到另一对象上(对另一对象的扩展)
         * @param { Object } dest 目标对象，需要混合进新成员的对象
         * @param { Object } source 源对象，需要将成员混合到其他对象上的对象
         * @param { Boolean } override 当源对象与目标对象拥有同一成员键名时，
         * 是否允许用源对象成员覆盖目标对象上的同键名成员, 默认是不覆盖
         *
         * @param { Boolean } from_proto 混合进目标对象的成员是否允许来自源
         * 对象上的原型链中,默认情况下，如果目标对象与源对象不属同一构造器
         * 被构造的情况下，将允许源对象原型链中的成员混合进目标对象中.
         *
         * @return { Object } 返回混合结果（即，目标对象引用 )
         * @examples
         *  var
         *      obj1 = { p1 : 0 },
         *      obj2 = { p1 : 1, p2 : 2 }
         *  ;
         *  XObject.mix( obj1, obj2 );
         *  //obj1.p2 === 2;
         *  //obj1.p1 === 0;
         *  XObject.mix( obj1, obj2, true );
         *  //obj1.p1 === 1;
         *  function A(){}
         *  A.prototype.p3 = 3;
         *  XObject.mix( obj, new A, true );
         *  //obj.p3 === undefined
         *  XObject.mix( obj, new A, true, true );
         *  //obj.p3 === 3;
         */
        _XObject.mix = function mix( dest, source, override, from_proto ){
            dest       = dest || {};
            override   = !!override;
            //这里有一“自作聪明”的一判断，如果两个对象属不同构造器被构建出，
            //则 source 对象上原型链上的成员也会被混合到 dest对象上
            from_proto = from_proto === undefined ? 
                         source.constructor != dest.constructor : !!from_proto;
            _XObject.forEach( source, !from_proto, function( value, key ){
                if( override || !( key in dest ) ){
                    dest[ key ] = value;
                }

            } );
            return dest;
        };

        /**
         * XObject.keys 获取一对象中成员键名列表(注：返回的列表中不会包含
         * 对象原型链中的任何成员键名,并且无法保证返回的键名排列顺序)
         * @param { Object } obj 
         * @return { Array }
         * @example
         *  var objkeys = _XObject.keys( { p1 : 1, p2 : 2 } );
         */
        _XObject.keys = function kyes( obj ){
            var keys = [];
            _XObject.forEach( obj, true, function( value, key ){
                keys.push( key );
            } );
            return keys;
        };

        /**
         * XString 提供一些用于操作字符串数据的一些静态方法集，通过 XString构
         * 造出的字符串与 new String(...) 无任何差别
         */
        _XString = _KeyWord( "XString", _KeyWord.DATATYPE, function XString(){
            return new String( arguments[0] );
        } );

        /**
         * XString.trim 剔除字符串首尾两段的空白字符
         * @param { String } str
         * @return { String } 
         * @example
         *  XString.trim( " abc" );// === "abc"
         *  XString.trim( "abc " );// === "abc"
         *  XString.trim( "  abc  " );// === "abc"
         *  XString.trim( "a b c" );// === "a b c"
         */
        _XString.trim = function trim( str ){
            var 
                s   = -1,
                e   = str.length
            ;
            //得到字符串字第一个不为空格符的字符索引位置，最后一个不为空格符
            //字符的的索引位置，然后在根据这两索引值从源字符串中截取前后不存
            //在空格符的字符串
            while( RE_WHITE_SPACE.test( str.charAt( ++s ) ) );
            while( e > s && RE_WHITE_SPACE.test( str.charAt( --e ) ) );
            return str.slice( s, e + 1 );
        };

        /**
         * XString.leftTrim 剔除字符串前段的空白字符
         * @param { String } str
         * @return { String }
         * @examples
         *  XString.leftTrim( "abc" );// "abc"
         *  XString.leftTrim( " abc" );// "abc"
         */
        _XString.leftTrim = function leftTrim( str ){
            var s = -1;
            while( RE_WHITE_SPACE.test( str.charAt( ++s ) ) );
            return str.slice( s );
        };

        /**
         * XString.rightTrim 剔除字符串后段的空白字符
         * @param { String } str
         * @return { String }
         * @examples
         *  XString.rightTrim( "abc" );// "abc"
         *  XString.rightTrim( "abc " );// "abc"
         */
        _XString.rightTrim = function leftTrim( str ){
            var e = str.length;
            while( e > 0 && RE_WHITE_SPACE.test( str.charAt( --e ) ) );
            return str.slice( 0, e + 1 );
        };

        /**
         * XString.format 将给定参数数据填充到某一特定的字符串模板中，
         * 并返回结果
         * @param { String } tpl 字符串模板,
         * 格式如:"Hello,{0}", "Hi,{0}.{1}{n}"
         * @param { String } ... 填充数据
         * 参数列表中第二个参数用于填充字符串模板中的"{0}"，第三个用于填充
         * "{1}", 以 n => "{n-1}" 类推
         * @return { String }
         * @example
         *  XString.format( "Hello" );// === "Hello"
         *  XString.format( "Hello, {0}", "World" );// === "Hello, World"
         *  XString.format( "Hello, {0} {1}", "YiWei", "Jiang" );// === "Hello, YiWei Jiang"
         */
        _XString.format = function format( tpl ){
            var args = SLICE.call( arguments, 1 );
            RE_TPL_INDEX_SIGN.lastIndex = 0;
            return tpl.replace( RE_TPL_INDEX_SIGN, function( a, b ) {
                return args[ b ];
            } );
        };
        /**
         * XString.quote 获得某一字符串原始状态形式
         * @param { String } str
         * @return { String }
         * @examples
         *  XString.quote( "hello\nworld" );// '"hello\nworld"'
         */
        _XString.quote = function quote( str ){
            var newstr = null;
            ESCAPABLE.lastIndex = 0;
            newstr = str.replace( ESCAPABLE, function ( k ){
                var c = SPECIAL_CHARS[ k ];
                return typeof c === 'string'
                    ? c
                    : '\\u' + ('0000' + k.charCodeAt(0).toString(16)).slice(-4);
            } );
            return '"' + newstr + '"';
        };

        /**
         * XString.startsWith 判断字符串从某一指定索引位置开始（默认是0索
         * 引位置）是否以指定字符串开始
         * @param { String } str
         * @param { String } search
         * @param { Number } pos
         * @return { String }
         * @examples
         *  XString.startsWith( "ABC", "AB" );// true
         *  XString.startsWith( "ABC", "BC", 1 );// true
         */
        _XString.startsWith = function startsWith( str, search, pos ){
            pos  = ~~pos;
            return str.indexOf( search ) == pos;
        };

        /**
         * XString.endsWith 判断字符串从某一指定索引位置开始（默认是字符串最后一索
         * 引位置）是否以指定字符串结束
         * @param { String } str
         * @param { String } search
         * @param { Number } pos
         * @return { String }
         * @examples
         *  XString.endsWith( "ABC", "C" );// true;
         *  XString.endsWith( "ABC", "A", 1 );// true;
         */
        _XString.endsWith = function endsWith( str, search, pos ){
            pos = ( ~~pos || str.length ) - search.length;
            return str.lastIndexOf( search ) == pos;
        };

        /**
         * XString.__instancelike__ 判断某一对象是否能被“看作”为XString的实
         * 例（所有String类实例都可被看作是 XString 的实例 )
         * @param { Object } obj
         * @return { Boolean }
         */
        _XString.__instancelike__ = function( obj ){
            return obj instanceof String || typeof obj === "string";
        };

        _XList = _KeyWord( "XList", _KeyWord.DATATYPE , function XList(){
            return Array.apply( null, arguments );
        } );

        /**
         * XList.forEach 对有序列表时行遍历，并将指定的回调函数作用于每一
         * 列表项上
         * @param { Array } list 有序列表
         * @param { Function } callback 作用于数据项上的回调函数
         * @param { Object } obj 回调函数内部 this 指向
         * 回调函数的参数列表依次为：[ 项值，项索引，有序列表 ] .
         * 如果需要让回调函数停止对列表余下项的遍历，可以将回调函数的返回值
         * 设置为 false
         * 如果需要，可以手动的修改遍历次下次要遍历的列表项，只需回调函数返
         * 回一个正确(根据当前序列表项的索引范围而定)的整形数值即可.
         * @param { Object } thisp 回调函数 内部 this 指向(默认为环境全局对象) 
         * @example
         *  XList.forEach( [ 1, 2, 3 ], function( value, key, list ){
         *      //...
         *  } );
         */
        _XList.forEach = function forEach( list, callback, obj ){
            for( var i = 0, l = list.length; i < l ; i++ ){
                var next = callback.call( obj, list[i], i, list );
                if( next === false ){
                    break;
                }else if( typeof next === "number" ){
                    i = ~~next;
                }
            }
        }; 

        /**
         * XList.indexOf 从指定有序列表中查询某一指定列表项的索引值(第一次
         *  出现位置)
         * @param { Array } list 
         * @param { Object } item
         * @return { Number } >= 0 表示列表项在有序列表所处索引，其他则标识
         * 列表项不被包含在有序列表中
         * @example
         *  XList.indexOf( [ 1, 2, 3, 4 ], 2 ); // === 1
         *  XList.indexOf( [ 1, 2, 3, 4 ], 0 ); // === -1
         */
        _XList.indexOf = function indexOf( list, item ){
            var index = -1;
            for( var i = 0, l = list.length; i < l ; i++ ){
                if( list[i] === item ){
                    index = i;
                    break;
                }
            }
            return index;
        };

        /**
         * XList.lastIndexOf 从指定有序列表中查询某一指定列表项的索引值(最后一次
         *  出现位置)
         * @param { Array } list 
         * @param { Object } item
         * @return { Number } >= 0 表示列表项在有序列表所处索引，其他则标识
         * 列表项不被包含在有序列表中
         * @example
         *  XList.lastIndexOf( [ 1, 2, 3, 4, 3, 2, 1 ], 2 ); // === 6
         *  XList.LastIndexOf( [ 1, 2, 3, 4 ], 0 ); // === -1
         */
        _XList.lastIndexOf = function lastIndexOf( list, item ){
            for( var l = list.length, i = l - 1; i >= 0; i-- ){
                if( list[ i ] === item ){
                    return i;
                }
            }
            return -1;
        }

        /**
         * XList.unique 从指定有序列表中筛选出独一无二的列表项
         * @param { Array } list
         * @return { Array } 返回列表项都是独一无二的有序列表
         * @example
         *  var 
         *      a = {},
         *      b = [],
         *      c = 1
         *  ;
         *  XList.unique( [ 1, 2, 3, 1, 2, 3, 1, 3, 2, 3, 2 ] ); // [ 1, 2, 3 ]
         *  XList.unique( [ 1, c, a, a, b, a, b, c ] );// [ 1, a, b ]
         */
        _XList.unique = function unique( list ){
            var 
                newlist = [],
                n       = 0
            ;

            //创建一个新的有序列表(newlist)容器用于存储无重复的列表项
            //对原列表进行遍历，并将每一项与newlist中的列表项进行严格的相等
            //性比较，如果不存在有相同的就将其插入到newlist中，否则就无视该项
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
        };

        /**
         * XList.xUnique  高效能的,从指定有序列表中筛选出独一无二的列表项(但
         * 只适用于 包含简单数据类型(String, Number, Boolean)列表项的有序列
         * 表)
         * @param { Array } list 包含简单数据类型(String, Number, Boolean)
         * 列表项的有序列表
         * @return { Array } 返回列表项都是独一无二的有序列表
         * @example
         *  XList.xUnique( [ 1, 2, 3, 4, 3, 2, 1, 4, 3, 0 ] );// [ 1, 2, 3, 4, 0 ]
         *  XList.xUnique( [ "A", "A", "B", "C", "DDD", "A", "B", "C", "DDD" ] );// [ "A", "B", "C", "DDD" ]
         */
        _XList.xUnique = function xUnique( list ){
            var
                dictionary = {},
                newlist    = [],
                n          = 0
            ;
            //将列表项值作为字典对象的索引，用于快速查找重复项
            for( var i = 0, l = list.length; i < l; i++ ){
                var item = list[ i ];
                if( dictionary[ item ] !== 1 ){
                    newlist[ n++ ] = item;
                    dictionary[ item ] = 1;
                }
            }
            return newlist;
        };  

        /**
         * XList.map 创建一个新列表 列表项对应的值是 枚举指定列表中每一项作
         * 用于回调函数的返回值
         * @param { Array } list
         * @param { Function } callback
         * 回调函数的参数列表依次为：[ 项值，项索引，有序列表 ] .
         * @param { Object } thisp 回调函数 内部 this 指向(默认为环境全局对
         * 象) 
         * @return { Array }
         * @example
         * XList.map( [ 1, 2, 3 ], function( value, key, list ){ return value - 1; } );// [ 0, 1, 2 ]
         */
        _XList.map = function map( list, callback, obj ){
            var newlist = [];
            for( var i = 0, l = list.length; i < l ; i++ ){
                newlist[i] = callback.call( obj, list[i], i, list );
            }
            return newlist;
        };

        /**
         * XList.filter 根据回调函数中提供的筛选算法来对列表进行筛选
         * @param { Array } list
         * @param { Function } callback 回调函数定义筛选条件
         * 回调函数的参数列表依次为：[ 项值，项索引，有序列表 ] .
         * 回调函数返回值为true表示列表项被选中，false则表示列表项被忽略
         * @param { Object } thisp 回调函数 内部 this 指向(默认为环境全局对
         * 象) 
         * @return { Array }
         * @example
         *  XList.filter( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], function( value, key, list ){
         *      return value % 2
         *  } );// [ 2, 4, 6, 8 ]
         */
        _XList.filter = function filter( list, callback, obj ){
            var newlist = [];
            for( var i = 0, l = list.length; i < l ; i++ ){
                if( callback.call( obj, list[i], i, list ) ){
                    newlist.push( list[ i ] );
                }
            }
            return newlist;
        };

        /**
         * XList.reduce 根据回调函数中提供的算法来对列表进行统一计算
         * @param { Array } list
         * @param { Function } callback 提供统计算法的回调函数
         * 回调函数的参数列表依次为：[ 当前汇总, 当前列表项, 索引, 有序列表 ] .
         * @param { Number } sum 汇总初始值
         * @param { Object } thisp 回调函数 内部 this 指向(默认为环境全局对
         * 象) 
         * @return { Object } 统计汇总
         * @example
         *  XList.reduce( [ 1, 2, 3 ], function( sum, value, index, key ){
         *      return sum + value;
         *  } );// 6
         */
        _XList.reduce = function reduce( list, callback, sum, obj ){
            var 
                sum = ~~sum,
                i   = 0,
                l   = list.length 
            ;
            if( arguments.length < 3 ){
                if( l === 0 ){
                    return false;
                }
                sum = ~~list[ i++ ];
            }

            for( ; i < l; i++ ){
                sum = callback.call( obj, sum, list[i], i, list );
            }
            return sum;
        };

        /**
         * XList.some 将一给定回调用函数测试列表每一项元素，如果有一项能通过
         * 测试则该返回一个 true 的结果，否则返回一个false结果
         * @param { Array } list
         * @param { Function } callback
         * @param { Object } obj
         * @return { Boolean }
         * @examples
         *  var 
         *      list1 = [ 0, 0, 0],
         *      list2 = [ 0, 1, 0 ]
         *  ;
         *  XList.some( list1, function( value ){ return !!value }; } ); // false
         *  XList.some( list2, function( value ){ return !!value }; } ); // true
         */
        _XList.some = function some( list, callback, obj ){
            for( var i = 0, l = list.length; i < l; i++ ){
                if( callback.call( obj, list[i], i, list ) ){
                    return true;
                }
            }
            return false;
        };

        /**
         * XList.every 将一给定回调用函数测试列表每一项元素，如果每一项能通过
         * 测试则该返回一个 true 的结果，否则返回一个false结果
         * @param { Array } list
         * @param { Function } callback
         * @param { Object } obj
         * @return { Boolean }
         * @examples
         *  var 
         *      list1 = [ 0, 0, 0],
         *      list2 = [ 0, 1, 0 ],
         *      list3 = [ 1, 1, 1 ]
         *  ;
         *  XList.every( list1, function( value ){ return !!value }; ); // false
         *  XList.every( list2, function( value ){ return !!value }; ); // true
         *  XList.every( list3, function( value ){ return !!value; } ); // true
         */
        _XList.every = function every( list, callback, obj ){
            var value = true;

            for( var i = 0, l = list.length; i < l; i++ ){
                if( value = value && callback.call( obj, list[i], i, list ) ){
                    break;
                }
            }

            return value;
        };

        /**
         * XList.remove 删除给定列表中所有与给定值匹配的元素项
         * @param { Array } list
         * @param { Object } item
         * @param { Array } 返回 list
         * @example
         *  XList.remove( [ 1, 2, 2, 3, 2 ], 2 );//[ 1, 3 ]
         */
        _XList.remove = function remove( list, item ){
            var n = 0;
            for( var l = list.length, i = 0; i < l; i++ ){
                if( list[ i ] !== item ){
                    list[ n++ ] = list[ i ];
                }
            }
            list.length = n;
            return list;
        };

        /**
         * XList.shuffle 打乱列表中元素项的排列顺序（不影响原数据）
         * @param { Array } list
         * @return { Array }
         * @example
         *  XList.shuffle( [ 1, 2, 3, 4, 5, 6, 7 ] );//返回任何可能的排列
         */
        _XList.shuffle = function( list ){
            var 
                newlist = list.slice(),
                index   = list.length
            while( index ){
                var 
                    swap = ~~( Math.random() * index )
                    temp = null
                ;
                
                temp                = newlist[ --index ];
                newlist[ index ]    = newlist[ swap ];
                newlist[ swap ]     = temp;
            }
            return newlist;
        }

        /**
         * XList.__instancelike__ 判断某一对象是否能被“看作”为XList的实
         * 例（所有Array类实例都可被看作是 XList 的实例 )
         * @param { Object } obj
         * @return { Boolean }
         */
        _XList.__instancelike__ = function( obj ){
            return obj instanceof Array;
        };

        /**
         * is 用于判断指定对象与某一类的关系
         * @param { Function/Class } type 指定类型
         * @param { Object } obj 指定对象
         * @param { Object } args... 参数列表针对于实现了 __instancelike__
         * 接口的“类” 对于实例判断的附加判断元素
         * @return { Boolean } 如果指定对象是某一类的实例则返回"true" 否则
         * 返回 "false"
         */
        _is = function is( type, obj, args ){
            if( !type ){
                return false;
            }
            args = SLICE.call( arguments ).slice( 1 );

            if( typeof type.__instancelike__  === "function" ){
                return type.__instancelike__.apply( type, args );
            }

            if ( obj !== null && obj !== undefined && type === Object ){
                return true;
            }

            switch( typeof obj ){
                case "object":
                case "function":
                case "undefined":
                    return typeof type === "function" && obj instanceof type;
                default:
                    //for string, number and boolean
                    return obj.constructor === type;
            }

        };

    }();


    /*
     实现用于创建一高级函数（主要提供函数重载特性）
     重载函数是在同一作用范围内几个功能类似的同名函数，要求这些函数的签名必
     须是唯一的（由 型参数的类型、排列顺序、参数数量 定义），重载函数被调用
     时会根据传递的实际参数类型，排列顺序，数量 从重载列表中去匹配符合
     要求的函数签名并获得执行相应的处理程序。每一个重载函数都有一个的重载列
     表，重载列表记录着函数的签名信息和相应的处理程序。
     */
    void function __IMPLEMENT_XFUNCTION__(){
        
        var 
            ParamTypeModifier = null,
            METHODS           = null
        ;


        //参数类型修饰符通用接口
        ParamTypeModifier = {
            toString : function toString(){
                return this.__COX_SIGN__;
            },
            equals   : function equals( obj ){
                return obj === this;
            }
        };


        //参数参数类型修饰符

        /**
         * Nullable 允许传入参数为空值
         * @param { Type } type 类型
         */
        _Nullable = _KeyWord(
            "Nullable", _KeyWord.PARAM_TYPE_MODIFIER,
            ObjectFactory( function Nullable( type ){
                if( !_is( _Type, type ) ){
                    throw new TypeError( 
                        "Nullable操作符需要一个Function类型实例." 
                    );
                }
                this.type = type;
                this.__COX_SIGN__ = "Nullable( " + 
                    ( type.__COX_SIGN__ || type.name || type.toString() ) + 
                " )";
            }, ParamTypeModifier )
        );

        _Nullable.prototype.__instancelike__ = function( param ){
            return param === null 
                || param === undefined 
                || _is( this.type, param );
        };
    
        /**
         * Optional 用于标记函数参数列表中某一参数为可选参数
         * @param { Type } type 参数类型
         * @param { Object } value 默认值
         */
        _Optional = _KeyWord(
            "Optional", _KeyWord.PARAM_TYPE_MODIFIER,
            ObjectFactory( function Optional( type, value ){
                if( !_is( _Type, type ) ){
                    throw new TypeError( 
                        "Optional操作符需要一个Function类型实例." 
                    );
                }
                if( arguments.length === 1 ){
                    switch( type ){
                        case Number:
                            value = 0;
                            break;
                        case String:
                            value = "";
                            break;
                        case Boolean:
                            value = false;
                            break;
                        case Object:
                            value = {};
                            break;
                        case Array:
                            value = [];
                            break;
                        default:
                            value = null;
                    }
                }else{
                    if( !_is( type, value ) && !_is( _Null, value ) ){
                        throw new TypeError(
                            "Optional操作符中 value参数（如果给定)的值类型必须与type参数的类型匹配."
                        );
                    }
                }
                this.type  = type;
                this.value = value;

                this.__COX_SIGN__ = "Optional( " + (
                    ( type.name || type.__COX_SIGN__ || type.toString() ) +
                " )" );
            }, ParamTypeModifier )
        );

        /**
         * Params 可变参数集
         * @param { Type } type 类型
         */
        _Params = _KeyWord(
            "Params", _KeyWord.PARAM_TYPE_MODIFIER,
            ObjectFactory( function Params( type ){
                if( !_is( _Type, type ) ){
                    throw new TypeError( 
                        "Params操作符需要一个Function类型实例." 
                    );
                }
                this.type  = type;
                this.__COX_SIGN__ = "Params( " + 
                    ( type.__COX_SIGN__ || type.name || type.toString() ) + 
                " )";
            }, ParamTypeModifier )
        );

        _Params.prototype.__instancelike__ = function ( params ){
            
            if( !params || !( params instanceof Array ) ){
                return false;
            }

            for( var i = 0, l = ~~params.length; i < l ; i++ ){
                if( !_is( this.type, params[i] ) ){
                    return false;
                }
            }
            return true;
        };

        /**
         * ParamTypeTable 参数类型表
         * @param { Type } types [ Type, Type, ... ]
         * 参数类型表中的项允许是普通的“数据类型“(通常是Function类型实例)，
         * 在此之上还可以使用 Nullable 与 Params 参数类似修饰符 标记参数类型
         * 支持更多高级的特性，Params修饰符只允许使用在类型表中最后一项上
         * @property { Number } minParamCount 
         * @property { Number } maxParamCount
         * @property { Number } length
         * @private
         * @property { Array } __types
         */
        _ParamTypeTable = _KeyWord( 
            "ParamTypeTable", _KeyWord.SUBSIDIARY, 
            ObjectFactory( function(){
                var count = arguments.length;
                
                this.minParamCount = 0;
                this.maxParamCount = 0;
                this.optStartIndex = -1;
                this.optEndIndex   = 0;

                for( var i = 0, l = count - 1; i <= l; i++ ){
                    var arg = arguments[i];
                    //对于Params 参数类似修饰符只允许出现在参数类型表的最后
                    if( arg instanceof _Nullable
                     || ( arg instanceof _Params && i === l ) 
                     || _is( _Type, arg )
                    ){
                        this.minParamCount++;
                        this.maxParamCount++;
                        continue;
                    }else if( arg instanceof _Optional ){
                        this.maxParamCount++;
                        continue;                        
                    }

                    throw new SynataxError( "无效的参数类型列表定义" );
                }

                if( arguments[ count - 1 ] instanceof _Params ){
                    this.minParamCount--;
                    this.maxParamCount = Infinity;
                }

                this.length  = count;
                this.__types = SLICE.call( arguments );
                this.__COX_SIGN__ = _XList.map( arguments, function( type ){
                    return type.name || type.toString();
                } ).join(", ");
            } ) 
        );
        
        /**
         * @method parse 对指定参数列表与参数表进行匹配解析
         * @param { Array } params 参数列表
         * @return { Array } 返回匹配后或经过修改排列方式的参数列表
         */
        _ParamTypeTable.prototype.parse = function parse( params ){
            var 
                params = params.slice(),
                count  = params.length,
                types  = this.__types.slice(),
                type   = null,
                fixed  = []
            ;

            if( count < this.minParamCount || count > this.maxParamCount ){
                return null;
            }

            while( type = types.shift() ){
                if( type instanceof _Params ){
                    if( !_is( type, params ) ){
                        return null;
                    }
                    fixed.push( params );
                }else if( type instanceof _Optional ){
                    var 
                        ttt   = _ParamTypeTable.apply( null, types ),
                        args  = null,
                        param = null
                    ;
                    if( params.length && _is( type.type, params[0] ) ){
                        param = params[0];
                        args  = ttt.parse( params.slice(1) );
                    }

                    if( !args ){
                        param = type.value;
                        args  = ttt.parse( params );
                    }
                    if( args ){
                        fixed.push( param );
                        fixed.push.apply( fixed, args );
                    }else{
                        fixed = null;
                    }
                    break;
                }else{
                    if( !_is( type, params[0] ) ){
                        return null;
                    }
                    fixed.push( params.shift() );
                }
            }

            return fixed;
        };

        /**
         * @method equals 检测参数类型表是否与另一个参数类型表相同
         * @param { ParamTypeTable/Type } types [ParamTypeTable] or [ Type, Type, ... ]
         * @return { Boolean }
         */
        _ParamTypeTable.prototype.equals = function equals( ){
            var 
                types = arguments[0],
                count = arguments.length
            ;

            if( count === 1 && types instanceof _ParamTypeTable ){
                if( types === this ){
                    return true;
                }

                if( types.length !== this.length 
                 || types.minParamCount !== this.minParamCount
                 || types.maxParamCount !== this.maxParamCount
                ){
                    return false;
                }
                types = types.__types;
                count = types.length;
            }else{
                types = arguments;
                if( count !== this.length ){
                    return false;
                }
            }

            for( var i = 0; i < count; i++ ){
                var type = types[i];
                switch( type.constructor ){
                    case _Optional:
                    case _Nullable:
                    case _Params:
                        if( this.__types[i].constructor !== type.constructor 
                         || this.__types[i].type !== type.type
                        ){
                            return false;
                        }
                    break;
                    default:
                        if( type !== this.__types[i] ){
                            return false;
                        }
                    break;
                }
            }

            return true;
        };

        _ParamTypeTable.prototype.toString = function toString(){
            return this.__COX_SIGN__;
        };

        METHODS    = {
            /**
             * define 定义重载
             * @param { Type } types [ Type, Type, ... ]
             * @param { Function } handler [ ..., Function ]
             */
            define : function define(){
                var 
                    args    = SLICE.call( arguments ),
                    types   = _ParamTypeTable.apply( null, args.slice( 0, -1 ) ),
                    handler = args[ args.length - 1 ],
                    list    = this.__COX_XFUNCTION_OVERLOAD_LIST__,
                    count   = list.length,
                    index   = list.length
                ;
                if( typeof handler !== "function" ){
                    throw new TypeError( "需要为重载提供一个能被执行的处理程序" );
                }
                for( var i = 0; i < count; i++ ){
                    //会替换掉相同的参数类型表
                    if( list[i].equals( types ) ){
                        index = i;
                        break;
                    }
                }
                list[ index ]               = types;
                types.__COX_BUILD_HANDLER__ = handler;
                this.__COX_SIGN__           = [];
                for( 
                    var i = 0, l = list.length, n = this.__COX_XFUNCTION_NAME__; 
                    i < l; 
                    i++ 
                ){
                    this.__COX_SIGN__.push( n + "(" + list[i] + ")" );
                }
                this.__COX_SIGN__ = this.__COX_SIGN__.join("\n");
            },
            /**
             * defined 检测重载列表中是否已经有定义过指定的参数类型表（签名）
             * @param { Type } types [ Type, Type, Type, ... ]
             * @return { Boolean }
             */
            defined : function defined(){
                var 
                    list  = this.__COX_XFUNCTION_OVERLOAD_LIST__,
                    count = list.length,
                    types = SLICE.call( arguments )
                ;
                for( var i = 0; i < count; i++ ){
                    if( list[i].equals.apply( list[i], types ) ){
                        return true;
                    }
                }

                return false;
            },
            /**
             * clone 得到 高级函数的一份拷贝
             * @return { XFunction }
             */
            clone : function clone(){
                var func = _XFunction( EMPTY_FUNCTION );
                func.__COX_XFUNCTION_OVERLOAD_LIST__ = this.__COX_XFUNCTION_OVERLOAD_LIST__.slice();
                func.__COX_XFUNCTION_NAME__          = this.__COX_XFUNCTION_NAME__;
                func.__COX_SIGN__                    = this.__COX_SIGN__;
                return func;
            },

            toString : function toString(){
                return this.__COX_SIGN__;
            }
        };

        /**
         * XFunction 创建一个高级的函数
         * 支持定义参数列表类型
         * 支持函数重载
         * @param { Type } types [ Type, Type, ... ]
         * @param { Function } handler [ ..., function(){} ]
         * @return { Function }
         */
        _XFunction  = _KeyWord( 
            "XFunction", _KeyWord.DATATYPE, function XFunction(){
                var 
                    //入口函数 其作用是接受参数传入，然后在已经定义的重载列
                    //表中找到能处理这些参数的处理程序
                    //最后用这传递的参数去调用处理程序去处理
                    main = function(){
                        var 
                            args      = SLICE.call( arguments ),
                            list      = main.__COX_XFUNCTION_OVERLOAD_LIST__,
                            handler   = null,
                            dest_args = null
                        ;
                        //从重载列表中找到能处理传递参数的处理程序
                        for( var i = 0, l = list.length; i < l; i++  ){
                            var types = list[i];
                            if( dest_args = types.parse( args ) ){
                                handler = types.__COX_BUILD_HANDLER__;
                                break;
                            }
                        }

                        if( !handler ){
                            throw new Error( 
                                "未定义与当前传送参数相匹配的处理程序" 
                            );
                        }

                        return handler.apply( this, dest_args );
                    }
                ;
                main.__COX_XFUNCTION_OVERLOAD_LIST__ = [];
                main.__COX_XFUNCTION_NAME__          = 
                main.__COX_SIGN__                    = arguments[ arguments.length - 1 ].name
                                                    || "anonymous";
                //为创建的函数添加需要被继承的一些方法
                _XObject.mix( main, METHODS   , true );
                //定义一个重载
                main.define.apply( main, arguments );

                return main;
            }
        );
        
        /**
         * XFunction.bind 将一对象和一可选的参数列表与一指定函数捆绑，函数在
         * 运行时刻(被调用)时 会将其内部 this 指向捆绑对象，并带入默认参数列表
         * @param { Function } handler
         * @param { Object } thisp
         * @param { Optional ... } default_args 可先的默认参数列表
         * @return { Function } 
         * @example
         *  XFunction.bind( function(){  }, {} );
         *  XFunction.bind( function( A, B ){ }, {}, 1, 2 );
         */
        _XFunction.bind = function bind( handler, thisp, default_args ){
            default_args = SLICE.call( arguments ).slice( 2 );
            return function(){
                return handler.apply( 
                    thisp, 
                    default_args.concat.apply( default_args, arguments ) 
                );
            };
        };

        /**
         * XFunction.memoize 创建一个支持缓存计算结果的函数,只针对于计算过
         * 程复杂，计算量大的函数
         * @param { Function } handler
         * @return { Function }
         * @example
         *  var feibo = XFunction.memoize( function( n ){
         *      return n > 1 ? feibo( n - 1 ) + feibo( n - 2 ) : n;
         *  } );
         *  feibo( 100 );
         */
        _XFunction.memoize = function memoize( handler ){
            var memoize = {};
            return function(){
                var 
                    args = SLICE.call( arguments ),
                    //= = 知道嘛我写这东西 IE8- 都不在考虑范围 一直是, 
                    //不爽 过来B4我呀，你B4我呀
                    key  = JSON.stringify( args )   
                ;
                if( memoize.hasOwnProperty( key ) ){
                    return memoize[ key ];
                }else{
                    return memoize[ key ] = handler.apply( this, arguments );
                }
            };

        };
    }();


    /*
      面向对象工具
      面向对象是一种对现实世界理解和抽象的方法，通过面向对象的方式，将现世界
      的物抽象成对象，现实世界的关系抽象成类、继承，帮助人们实现对现实世界的
      抽像与数字建模。面向对象能有效提高编程的效率，面向对象是指一种程序设计
      范 型，同时也是一种程序开发的方法。面向对象编程技术提搞软件的重用性、
      灵活性和扩展性。
     */
    void function __IMPLEMENT_OOP__(){
        var 
            BaseClass = null,
            ClassMode = null
        ;

        
        _Extends  = _KeyWord( 
            "Extends", _KeyWord.SUBSIDIARY, 
            ObjectFactory( function Extends(){
                this.parents = _XList.unique( SLICE.call( arguments ) );
            } )
        );

        _Implements = _KeyWord(
            "Implements", _KeyWord.SUBSIDIARY, 
            ObjectFactory( function Implements(){
                var 
                    interfaces = _XList.unique( SLICE.call( arguments ) ),
                    count      = interfaces.length
                ;
                for( var i = 0; i < count; i++ ){
                    if( !( interfaces[i] instanceof _Interface ) ){
                        throw new TypeError( "无效的接口类型" );
                    }
                }
                this.interfaces = interfaces;
            } )
        );

        /**
         * Interface 接口定制工具
         * 接口里允许包含类/类实例方法（函数）的签名信息(由方法名称和函数参
         * 数类型组成), 还允许继承其他（或多个）的接口类
         * @param { String } name
         * @param { Extends } extend 接口需要继承的其他接口，允许指定多个
         * @param { Function } define 定义接口的处理程序
         * 处理器被调用时会有两个参数对象被传入，第一个参数对象接受类方法的
         * 定义，第二个参数对象接受类实例方法的定义
         */
        _Interface = _KeyWord(
            "Interface", _KeyWord.DATATYPE, ObjectFactory( function Interface( name, extend, define ){
                var 
                    cmethods  = {},
                    imethods  = {},
                    methods   = [ cmethods, imethods ]
                ;
                if( extend ){
                    for( var i = 0, l = extend.parents.length; i < l; i++ ){
                        if( !( extend.parents[i] instanceof _Interface ) ){
                            throw new TypeError(
                                "接口类只允许扩展由Interface操作符创建的接口类"
                            );
                        }

                    }

                    extend = extend.parents;
                }

                if( define && typeof define !== "function" ){
                    throw new TypeError(
                        "接口类只允许使用Function类型的实例作为接口类的类体（提供公共接口的定义）"
                    );
                }

                this.__COX_INTERFACE_EXTENDS__  = extend || null;
                this.__COX_INTERFACE_CMETHODS__ = cmethods;
                this.__COX_INTERFACE_IMETHODS__ = imethods;
                this.__COX_INTERFACE_NAME__     = name = name || "anonymous" ;
                this.__COX_SIGN__               = "[Interface " + name + "]";

                cmethods.prototype = {};

                define.call( cmethods, cmethods, imethods );
                delete cmethods.constructor;
                _XObject.mix( imethods, cmethods.prototype, true );
                delete cmethods.prototype;

                //检测接口的定义
                for( var i = 0, l = methods.length; i < l; i++ ){
                    var dest = methods[i];
                    _XObject.forEach( 
                        dest, true, function( method, key ){
                            //接口成员只允许是Function 或 ParamTypeTable类型实例(或集合)
                            if( method === Function ){
                                return;
                            }else if( method instanceof _ParamTypeTable ){
                                dest[ key ] = [ method ];
                                return;
                            }else if( method instanceof Array ){
                                for( var i = 0, l = method.length; i < l; i++ ){
                                    if( !( method instanceof _ParamTypeTable ) ){
                                        return;        
                                    }
                                }
                            }
                            throw new TypeError( "无效的接口定义" );
                        }
                    );
                }
            } )
        );
        
        /**
         * 
         * extended 检查接口类是否扩展了另一接口类（父接口类）
         * @param { _Interface } iface 接口类
         * @return { Boolean }
         */
        _Interface.prototype.extended  = function( iface ){
            var 
                parents = this.__COX_INTERFACE_EXTENDS__
            ;
            if( !parents || !( iface instanceof _Interface ) ){
                return false;
            }

            if( _XList.indexOf( parents, iface ) !== -1 ){
                return true;
            }

            for( var i = 0, l = parents.length; i < l ; i++ ){
                if( parents[i].extended( iface ) ){
                    ret = true;
                    return true;
                }
            }
            return false;
        };

        /**
         * @method implementIn 检查一个对象是否实现了接口类提供（描述）的所有接口（方法集）
         * 如果实现接口类的对象有未实现的接口或者实现与接口类描述的对应接口信息不匹配则会抛出异常。
         * @param { Object } obj 接口类的实现体
         * @return { Boolean }
         */
        _Interface.prototype.implementIn = function ( obj ){
            var 
                _this   = this,
                parents  = this.__COX_INTERFACE_EXTENDS__,
                ignores = this.__IGNORES__ instanceof Array ? this.__IGNORES__ : [],
                cls     = typeof obj === "function" ? obj : obj.constructor,
                objs    = [
                    {
                        methods : this.__COX_INTERFACE_CMETHODS__,
                        obj     : cls
                    },
                    {
                        methods : this.__COX_INTERFACE_IMETHODS__,
                        obj     : typeof obj === "function" ? obj.prototype : obj
                    }
                ]
            ;

            //确保多个相同的接口类的implementIn方法只被调用一次
            if( _XList.indexOf( ignores, this ) === -1 ){
                ignores.push( this );
            }else{
                return true;
            }


            if( parents ){
                for( var i = 0, l = parents.length; i < l; i++ ){
                    var parent = parents[i];
                    parent.__IGNORES__ = ignores;
                    parent.implementIn( obj );
                    delete parent.__IGNORES__;
                }
            }

            while( obj = objs.shift() ){
                _XObject.forEach( obj.methods, true, function( type, key ){
                    var method = obj.obj[key];

                    if( key in obj.obj ){

                        if( typeof obj.obj !== "function" 
                         && key === "constructor"
                         && cls.__COX_CLASS_CLASSINFO__
                        ){
                            method = cls.__COX_CLASS_CLASSINFO__.CONSTRUCTOR;
                        }

                        if( type === Function && typeof method !== "function" ){
                            throw new TypeError(
                                _this + "接口类中的`" + key + "`接口以非Function类型实例被实现"
                            );
                        }else if( type instanceof Array ){
                            for( var i = 0, l = type.length; i < l; i++ ){
                                if( typeof method !== "function"
                                 || typeof method.defined !== "function" 
                                 || !method.defined( type[i] ) 
                                ){
                                    throw new TypeError(
                                        _this + "接口类中的`" + key + "`接口未被正确实现"
                                    );        
                                }
                            }
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

        _Interface.prototype.__instancelike__ = function( obj ){
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

        _Interface.prototype.toString = function toString(){
            return this.__COX_SIGN__;
        };

        /**
         * ClassMode 类模式
         * @param { String } name
         */
        _ClassMode = _KeyWord(
            "ClassMode", _KeyWord.SUBSIDIARY, ObjectFactory( function ClassMode( name ){
                this.__COX_CLASS_MODE_NAME__ = name;
            } )
        );

        _ClassMode.prototype.toString = function toString(){
            return this.__COX_CLASS_MODE_NAME__;
        }    

        _ClassMode.prototype.newClass = EMPTY_FUNCTION;
        _ClassMode.prototype.prefect  = EMPTY_FUNCTION;
        
        _Abstract = _ClassMode( "Abstract" );

        _Abstract.newClass = function newClass(){   
            return function(){
                throw new SynataxError(
                    "抽象类不允许被实例化！"
                );
            };
        };

        _Abstract.implementIn = function implementIn( absclass, obj ){
            var 
                info    = absclass.__COX_CLASS_CLASSINFO__,
                _this   = absclass,
                cls     = ( typeof obj === "function" ? obj : obj.constructor ),
                objs    = [
                    {
                        methods : info.CLASS_METHODS,
                        obj     : cls
                    },
                    {
                        methods : info.INSTANCE_METHODS,
                        obj     : typeof obj === "function" ? obj.prototype : obj
                    }
                ]
            ;
            while( obj = objs.shift() ){
                _XObject.forEach( obj.methods, true, function( type, key ){
                    var method = obj.obj[key];
                    //console.log( key, "xxxx");
                    
                    if( key in obj.obj ){
                        if( typeof obj.obj !== "function" 
                         && key === "constructor"
                         && cls.__COX_CLASS_CLASSINFO__
                        ){
                            method = cls.__COX_CLASS_CLASSINFO__.CONSTRUCTOR;
                        }
                        if( type === Function && typeof method !== "function" ){
                            throw new TypeError(
                                _this + "抽象类中的`" + key + "`接口以非Function类型实例被实现"
                            );
                        }else if( type instanceof Array ){
                            for( var i = 0, l = type.length; i < l; i++ ){
                                if( typeof method !== "function"
                                 || typeof method.defined !== "function" 
                                 || !method.defined( type[i] ) 
                                ){
                                    throw new TypeError(
                                        _this + "抽象类中的`" + key + "`接口未被正确实现"
                                    );        
                                }
                            }
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

        _Abstract.perfect = function perfect( classinfo ){
            var 
                newclass    = classinfo.CLASS,
                proto       = newclass.prototype,
                constructor = proto.constructor,
                tostring    = null,
                cmethods    = {}, 
                imethods    = {},
                methods     = [
                    { source : newclass, dest : cmethods },
                    { source : proto, dest : imethods }
                ]
            ;

            delete cmethods.constructor;

            for( var i = 0, l = methods.length; i < l; i++ ){
                var 
                    source = methods[i].source,
                    dest   = methods[i].dest
                ;
                _XObject.forEach( source, true, function( method, key ){
                    if( method === Function ){
                        dest[ key ] = method;
                        delete source[ key ];
                    }else if( method instanceof _ParamTypeTable ){
                        dest[ key ] = [ method ];
                        delete source[ key ];
                    }else if( method instanceof Array ){
                        for( var i2 = 0, l2 = method.length; i2 < l2; i2++ ){
                            if( !( method[i2] instanceof _ParamTypeTable ) ){
                                return;
                            }
                        }
                        dest[ key ] = method;
                        delete source[ key ];
                    }
                } );
            }
            classinfo.CLASS_METHODS    = cmethods;
            classinfo.INSTANCE_METHODS = imethods;
            if( constructor !== newclass ){
                if( imethods.constructor !== constructor 
                 && !( constructor instanceof _ParamTypeTable )
                ){
                    if( typeof constructor === "function" ){
                        classinfo.CONSTRUCTOR = constructor;
                    }else{
                        throw new TypeError(
                            "无效的构造函数定义"
                        );
                    }
                }
            }

            tostring = newclass.toString;
            _XObject.mix( newclass, BaseClass, true );
            
            delete newclass.__COX_KEYWORD_NAME__;
            newclass.__COX_SIGN__ = "[Abstract Class " + classinfo.NAME + "]";
            newclass.__COX_CLASS_CLASSINFO__ = classinfo;
            if( tostring !== BaseClass.toString ){
                newclass.toString = tostring;
            }

            delete newclass.constructor;
            newclass.implementIn = function( obj ){
                return _Abstract.implementIn( newclass, obj );
            }
            newclass.prototype = proto;
        };

        _Single = _ClassMode( "Single" );

        _Single.newClass = function newClass( classinfo ){
            return function(){
                return _Single.getInstance.apply( classinfo.CLASS, arguments );
            };
        };

        _Single.getInstance = function getInstance(){
            var classinfo = this.__COX_CLASS_CLASSINFO__;
            //返回同一个实例对象
            if( classinfo.SINGLE_INSTANCE instanceof this ){
                return classinfo.SINGLE_INSTANCE;
            }
            //第一实例化
            classinfo.CONSTRUCTOR.apply(
                ( classinfo.SINGLE_INSTANCE = newObject( this.prototype ) ),
                arguments
            );
            return classinfo.SINGLE_INSTANCE;
        };

        _Finaly = _ClassMode( "Finaly" );

        _Finaly.newClass = function newClass( classinfo ){
            return function(){
                if( this.constructor !== classinfo.CLASS 
                 || !( this instanceof classinfo.CLASS )
                ){
                    throw new Error(
                        classinfo.__CLASS__ + "类不能在当前情况情况下进行实例化"
                    );
                }
                classinfo.CONSTRUCTOR.apply( this, arguments );
            };
        };

        _Entity = _ClassMode( "Entity" );

        _Entity.newClass = function newClass( classinfo ){
            return function(){
                classinfo.CONSTRUCTOR.apply( this, arguments );
            }
        }; 

        _Single.perfect = _Finaly.perfect = _Entity.perfect = function perfect( classinfo ){
            var 
                newclass    = classinfo.CLASS,
                proto       = newclass.prototype,               
                constructor = proto.constructor,
                _super      = classinfo.SUPER,
                sinfo       = _super && _super.__COX_CLASS_CLASSINFO__,
                tostring    = null
            ;
            tostring = newclass.toString;
            _XObject.mix( newclass, BaseClass, true );

            if( classinfo.MODE === _Single ){
                newclass.getInstance = _Single.getInstance;
            }

            if( tostring !== BaseClass.toString  ){   
                newclass.toString = tostring;
            }

            tostring = proto.toString;
            _XObject.mix( proto, BaseClass.prototype, true );
            
            delete newclass.__COX_KEYWORD_NAME__;

            if( classinfo.SUPER && newclass.implementIn === classinfo.SUPER.implementIn ){
                delete newclass.implementIn;
            }

            newclass.__COX_SIGN__            = "[" + (
                classinfo.MODE === _Entity ? "" : classinfo.MODE.__COX_CLASS_MODE_NAME__ + " "
            ) + "Class " + classinfo.NAME + "]";
            newclass.__COX_CLASS_CLASSINFO__ = classinfo;
            if( tostring !== BaseClass.prototype.toString ){
                proto.toString = tostring;
            }
            

            proto.constructor = constructor;

            if( constructor !== newclass ){
                if( constructor !== Function && typeof constructor === "function" ){
                    classinfo.CONSTRUCTOR = constructor;
                }else{
                    throw new TypeError(
                        "在类定义中为类实例提供的constructor成员只允许赋值为 Function类型实例"
                    );
                }
            }
            /*if( sinfo && sinfo.MODE === _Abstract ){
                _Abstract.implementIn( _super, newclass );
            }*/
            
            for( var i = 0, l = classinfo.IMPLEMENTS.length; i < l; i++ ){
                classinfo.IMPLEMENTS[i].implementIn( newclass );
            }

            newclass.prototype = proto;
        };

        /**
         * BaseClass 其类
         */
        BaseClass = _KeyWord(
            "BaseClass", _KeyWord.DATATYPE, ObjectFactory( 
                EMPTY_FUNCTION,
                _XObject.prototype 
            )
        );

        BaseClass.__COX_SIGN__ = "[Class BaseClass]";

        BaseClass.__COX_CLASS_CLASSINFO__ = {
            NAME            : "BaseClass",
            MODE            : _Entity,
            SUPER           : null,
            IMPLEMENTS      : null,
            CLASS           : BaseClass,
            CONSTRUCTOR     : BaseClass,
            SINGLE_INSTANCE : null
        };

        /**
         * @static method implemented 一个类是否实现了某一接口类
         * @param { _Interface } itfn 接口类
         * @return { Boolean }
         */
        BaseClass.implemented = function implemented( inf ){
            var 
                classinfo = this.__COX_CLASS_CLASSINFO__
            ;
            if( _XList.indexOf( classinfo.IMPLEMENTS, inf ) !== -1 ){
                return true;
            }
            for( var i = 0, l = classinfo.IMPLEMENTS.length; i < l; i++ ){
                if( classinfo.IMPLEMENTS[i].extended( inf ) ){
                    return true;
                }
            }                

            return false;
        };

        /**
         * @static method extended 一个类是否扩展了另一个类
         * @param { Class } cls
         * @return { Boolean }
         */
        BaseClass.extended = function extended( cls ){
            return this.prototype instanceof cls;
        };

        BaseClass.toString = function toString(){
            return this.__COX_SIGN__;
        };

        /**
         * @method Super 子类方法中访问父类实例属性或调用父类实例方法
         * @param { String } key 父类实例属性的标识符
         * @param { Object } args 新值或调用参数(参数列表就是 第二位到最后)
         * @return { Object } 返回父类实例的成员的数值或 调用父类实例方法成员时得到的返回值
         */
        BaseClass.prototype.Super = function ( key, args ){
            var 
                args   = SLICE.call( arguments, 1 ),
                info   = this.constructor.__COX_CLASS_CLASSINFO__,
                _super = null,
                sinfo  = null,
                value  = null,
                prop   = null
            ;

            if( !( typeof key === "string" || key instanceof String ) ){
                throw new TypeError( 
                    "类实例 Super( key, args )方法的 key参数项只接受 String类型实例" 
                );
            }

            key = key === "constructor" || !key ? "CONSTRUCTOR" : key;

            if ( !this.__COX_CSLEVEL__ ) {
                this.__COX_CSLEVEL__ = info.SUPER;
            }

            _super = this.__COX_CSLEVEL__;
            sinfo  = _super.__COX_CLASS_CLASSINFO__;
            
            if( _super ){
                if( key === "CONSTRUCTOR" && sinfo ){
                    prop  = sinfo[ key ];
                }else{
                    if( !( key in _super.prototype )  ){ 
                        throw new Error(
                            "在 " + _super + "类 中没有定义 `" + key + "`成员"
                        );
                    }
                    prop = _super.prototype[key];
                }

                if( typeof prop === "function" ){
                    this.__COX_CSLEVEL__ = sinfo && sinfo.SUPER || null;
                    value = prop.apply( this, args );
                }else{
                    if( obj && args.length ){
                        obj[key] = args[0];
                    }
                    value = obj[key];
                }
            }

            delete this.__COX_CSLEVEL__;
            return value;
        };


        /**
         * @method instanceOf 一个类实例是否是某一类型的实例
         * @param { Function/_Interface  } cls 类
         * @return { Boolean }
         */ 
        BaseClass.prototype.instanceOf = function( cls ){
            if( cls instanceof _Interface ){
                return this.constructor.implemented( cls );
            }else{
                return this instanceof cls;
            }
        };

        BaseClass.prototype.toString = function toString(){
            return this.__COX_SIGN__;
        };

        /**
         * Class 类定义工具
         * 类为创建的对象定义拥有哪些状态和操作这些状态的方法,类可以继承（扩
         * 展）其他类（父类），因此它得到父类的成员（状态和方法），
         * 接口类定义了需要被实现的方法，类如果定义了要实现的接口类，那么它
         * 必须将接口类中的方法全部实现
         * 类有不同的模式，每一种模式都有它所需要的特殊要求
         * Abstract 抽象类 以父类形式被使用，它抽象出众多类相同的特性，它可
         *          以定义抽象方法，让继承它的子类去实现，抽象类不允许被实例
         *          化
         * Single   单例模式，规定类只拥有唯一的一个实例化对象
         * Finaly   最终类，它规定类为最终类，不需要也不能被其他类扩展
         * Entity   普通类，没什么好说的
         * @param { String } classname 类名
         * @param { ClassMode } mode 类模式
         * @param { Extends } parent 指定需要被扩展的父类，类只允许扩展一
         * 个父类
         * @param { Implements } interface 指定需要被实现的接口类，允许实现
         * 多个接口类
         * @param { Function } define 类定义处理程序
         */
        _Class = _KeyWord(
            "Class", _KeyWord.DATATYPE, 
            function Class( classname, mode, parent, interfaces, define ){
                var 
                    newclass    = null,
                    constructor = null,
                    classname   = classname || define.name,
                    parent      = parent && parent.parents || [ BaseClass ],
                    superinfo   = null,
                    classinfo   = {
                        NAME            : classname,
                        MODE            : mode,
                        SUPER           : null,
                        IMPLEMENTS      : null,
                        CLASS           : null,
                        CONSTRUCTOR     : null,
                        SINGLE_INSTANCE : null
                    }
                ;
                //类的因不同模式有不同的要求，所以类交给模式创建
                newclass = classinfo.CLASS = mode.newClass( classinfo );

                if( parent.length > 1 ){
                    throw new SynataxError( "类不允许扩展多个父类" );
                }
                
                parent = parent[0] || BaseClass ;
                if( typeof parent !== "function" ){
                    throw new TypeError( "无效的扩展类" );
                }

                superinfo = parent.__COX_CLASS_CLASSINFO__;
                if( superinfo && superinfo.MODE === _Finaly ){
                    throw new Error( parent + "类不允许被扩展" );
                }

                //子类只有得到父类高级函数的克隆版本才能被正常使用
                if( superinfo && typeof superinfo.CONSTRUCTOR === "function" ){
                    constructor = superinfo.CONSTRUCTOR;
                    if( typeof constructor.clone === "function" ){
                        constructor = constructor.clone();
                    }
                }

                //复制父类的类成员到子类上
                _XObject.forEach( parent, true, function( item, key ){
                    if( item && typeof item.clone === "function" ){
                        newclass[key] = item.clone();
                    }else{
                        newclass[key] = item;
                    }
                } );

                //设置继承链
                newclass.prototype  = newObject( parent.prototype );
                //高级函数处理
                _XObject.forEach( parent.prototype, true, function( item, key ){
                    if( item && typeof item.clone === "function" ){
                        newclass.prototype[key] = item.clone(); 
                    }
                } );

                interfaces = interfaces && interfaces.interfaces || [];
                newclass.prototype.constructor = constructor;
                define.call( newclass, newclass, newclass.prototype );
                delete newclass.constructor;

                classinfo.IMPLEMENTS = _XList.xUnique( interfaces.concat( 
                    superinfo && superinfo.IMPLEMENTS || []
                ) );

                //抽象类也是需要被实现的的的的的的的的，内存空间呀呀呀呀呀
                if( superinfo.MODE === _Abstract ){
                    classinfo.IMPLEMENTS.push( parent );
                }

                classinfo.SUPER                  = parent;
                classinfo.CONSTRUCTOR            = constructor;
                //类定义由模式来进一步的完善和检查
                mode.perfect( classinfo );
                newclass.prototype.constructor   = newclass;
                newclass.prototype.__COX_SIGN__  = "[Object " + classname + "]";
                return newclass;
            }
        );

    }();

    void function __IMPLEMENT_TOOLS__(){
        var 
            DSTATE_UNFULFILLED = 0,
            DSTATE_FULFILLED   = 1,
            DSTATE_REJECTED    = -1,
            DSTATE_ERROR       = -2,
            IEvent             = null
        ;
        
        IEvent = _Interface( "IEvent", null, function( Static, Public ){
            
            Public.constructor = [
                _ParamTypeTable( String, _Optional( Object ) )
            ];

            Public.stopPropagation = Function;
        } );

        /**
         * EventListeners 事件监听器
         * 一个事件监听器关联一个事件，监听器组织着处理程序的注册和调用
         * @param { String } type 监听事件类型（标识)
         * @param { EventSource } target 事件源
         */
        _Class( "EvnetListeners", _Entity, null, null, function( Static, Public ){
            _EventListener = this;
            Public.constructor = function( type, target ){
                this._relate_event_type = type;
                this._target            = target;
                this._handlers          = [];
                this._processing        = [];
            };
            
            //类实例方法

            /**
             * @method notify 通知事件监听程序 关联事件被触发，并执行事件处理器
             * @param { Array } args 传递给事件处理器的参数列表
             * @param { Object } thisp 事件处理器内 this对象引用
             */
            Public.notify = function( args, thisp ){
                var handler = null;
                //很好很强大的一个方式
                this._processing = this._handlers.slice();
                while( handler = this._processing.shift() ){
                    handler.apply( thisp, args );
                }

            };
            
            /**
             * @method add 添加事件处理器
             * @param { Function } handler
             */
            Public.add = function( handler ){
                this._handlers.push( handler );
            };
            /**
             * @method remove 删除已注册（添加）的事件处理器
             * @param { Function } handler 
             */
            Public.remove = function( handler ){
                if( !handler ){
                    this._handlers.length   = 0;
                    this._processing.length = 0
                }else{
                    var 
                        handlers = this._handlers,
                        n        = 0
                    ;
                    for( var i = 0, l = handlers.length; i < l; i++ ){
                        if( handlers[i] !== handler ){
                            handlers[n++] = handlers[i];
                        }
                    }
                    handlers.length  = n;

                    if( this._processing.length ){
                        this._processing = handlers;
                    }
                }
            }

            Public.break = function(){
                this._processing.length = 0;
            };

        } );
                
        _Class( "Event", _Entity, null, _Implements( IEvent ), function( Static, Public ){
            _Event = this;
            Public.constructor = _XFunction( 
                String, _Optional( Object, {} ), function( name, options ){
                    _XObject.mix( this, options, true );
                    this.name     = name;
                    this.listener = new _EventListener( name, this );
                } 
            )

            Public.stopPropagation = function(){
                this.listener.break();
            };
        } );

        _Class( "EventSource", _Entity, null, null, function( Static, Public ){
            _EventSource = this;
            /**
             * constructor 构造器
             */
            Public.constructor = function(){
                this._events = {};
            };

            /**
             * @method dispatchEvent 为事件源分配事件
             * @param { Params( Event ) } newevents
             */
            Public.dispatchEvent = _XFunction( 
                _Params( _Event ), function( newevents ){
                    var 
                        events = this._events,
                        _this  = this
                    ;
                    for( var i = 0, l = newevents.length; i < l; i++ ){
                        var event = newevents[i];
                        events[ event.name ] = event;
                    }
                } 
            );

            /**
             * @method fireEvent 触发某一指定事件
             * @param { String } eventname
             * @param { Array } args 参数列表，（可选）
             * @param { Object } thisp 回调函数内部this指向对象（可选)
             */
            Public.fireEvent = _XFunction( 
                String, _Optional( Array, null ), _Optional( Object, null ),
                function( eventname, args, thisp ){
                    var event = this._events[ eventname ];
                    if( event instanceof _Event ){
                        event.listener.notify( args || [], thisp || this );
                    }    
                }
            );
            
            /**
             * @method addEventListener 为事件源中所有已分配的事件 添加事件监听处理器
             * @param { Function } handler
             */
            Public.addEventListener = _XFunction(
                Function, function( handler ){
                    _XObject.forEach( this._events, true, function( event, name ){
                        if( event instanceof _Event ){
                            event.listener.add( handler );
                        }
                    } );
                }
            );

            /**
             * @method addEventListener 为事件源中事件 添加事件监听处理程序
             * @param { String } eventname
             * @param { Function } handler
             */
            Public.addEventListener.define( 
                String, Function, function( eventname, handler ){
                    var event = this._events[ eventname ];
                    if( event instanceof _Event ){
                        event.listener.add( handler );
                    }
                } 
            );

            /**
             * @method addOnceEventListener 为事件源指定的事件 添加只执行一次的事件处理器
             * @param { String } eventname
             * @param { Function } handler
             */
            Public.addOnceEventListener = function( eventname, handler ){
                var _this = this;
                this.addEventListener( eventname, function(){
                    handler.apply( this, arguments );
                    _this._events[ eventname ].listener.remove( arguments.callee );
                } );
            };

            /**
             * @method removeEventListener 将一事件处理器从所有事件监听器中删除 或 删除所有事件监听器中的所有事件处理器
             * @param { String } eventname
             * @param { Function } handler
             */
            Public.removeEventListener = _XFunction(
                _Optional( String ), _Optional( Function ), function( eventname, handler ){
                    if( eventname == "" ){
                        _XObject.forEach( this._events, true, function( event ){
                            event instanceof _Event && event.listener.remove( handler );
                        } )
                    }else{
                        var event = this._events[ eventname ];
                        if( event instanceof _Event ){
                            event.listener.remove( handler );
                        }
                    }
                }
            );

            /**
             * @method getEvent 获取事件源中某一事件对象
             * @param { String } eventname
             * @return { Event }
             */
            Public.getEvent = function( eventname ){
                var event = this._events[ eventname ];
                return event instanceof _Event ? event : null;
            };

            Public.on   = Public.addEventListener;
            Public.once = Public.addOnceEventListener;
            Public.un   = Public.removeEventListener;
        } );

        /**
         * Deferred 延迟操作管理类
         */
        _Class( "Deferred", _Entity, _Extends( _EventSource ), null, function( Static, Public ){
            _Deferred = this;

            Static.DSTATE_UNFULFILLED = DSTATE_UNFULFILLED;
            Static.DSTATE_FULFILLED   = DSTATE_FULFILLED;
            Static.DSTATE_REJECTED    = DSTATE_REJECTED;
            Static.DSTATE_ERROR       = DSTATE_ERROR;

            Public.constructor = function(){
                var _this = this;
                this.Super( "constructor" );
                this._state  = DSTATE_UNFULFILLED;
                this._value  = null;
                this._error  = null;

                this.dispatchEvent( 
                    new _Event( "stateChange", { target : this } ),
                    new _Event( "resolved", { target : this } ),
                    new _Event( "rejected", { target : this } ),
                    new _Event( "done", { target : this } )
                );

                this.__COX_DEFERRED_ERROR__ = function( message ){
                    var error = new Error( message );
                    _this._state = DSTATE_ERROR;
                    _this._error = error;
                    _this.fireEvent( "stateChange", [ DSTATE_ERROR ] );
                    _this.fireEvent( "rejected", [ _this._value, error ] );
                    _this.fireEvent( "done", [ _this._value, error ] );
                    _this.getEvent( "resolved" ).stopPropagation();
                }
            };


            /**
             * @method then 等待延迟操作完成，并调用传入的回调函数
             * @param { Function } okcallback
             * @param { Function } errcallback 
             */
            Public.then = _XFunction( 
                Function, _Optional( Function ) , function( success, error ){
                    switch( this._state ){
                        case DSTATE_UNFULFILLED:
                            this.addOnceEventListener( "resolved", success );
                            error && this.addOnceEventListener( "rejected", error );
                        break;
                        case DSTATE_FULFILLED:
                            success.call( this, this._value, this.__COX_DEFERRED_ERROR__ );
                        break;
                        case DSTATE_ERROR:
                        case DSTATE_REJECTED:
                            error && error.call( this, this._value, this._error );
                        break;
                    }
                } 
            );

            /**
             * @method done 延迟操作完成时（不管是被接受还是被拒绝)
             * @param { Function } callback
             */
            Public.done = _XFunction(
                Function, function( callback ){
                    if( this._state === DSTATE_UNFULFILLED ){
                        this.addOnceEventListener( "done", callback );
                    }else{
                        callback.call( this, this._value, this._error );
                    }
                }
            );

            /**
             * @method resolved 延迟操作被接受（操作完成）
             * @param { Object } value
             */
            Public.resolved = function( value ){
                var _this = this;
                if( this._state !== DSTATE_UNFULFILLED ){
                    throw new Error( "非法操作" );
                }

                this._state = DSTATE_FULFILLED;
                this._value = value;

                this.fireEvent( "stateChange", [ DSTATE_FULFILLED ] );
                this.fireEvent( 
                    "resolved", 
                    [ 
                        value, 
                        this.__COX_DEFERRED_ERROR__,
                        function end(){
                            _this.getEvent( "resolved" ).stopPropagation()
                        }
                    ]
                );
                
                !this._error && this.fireEvent( "done", [ value ] );
            };

            /**
             * @method rejected 延迟操作被拒绝（操作失败）
             * @param { Object } value
             */
            Public.rejected = function( value ){
                if( this._state !== DSTATE_UNFULFILLED ){
                    throw new Error( "非法操作" );
                }

                this._state = DSTATE_REJECTED;
                this._value = value;

                this.fireEvent( "stateChange", [ DSTATE_REJECTED ] );
                this.fireEvent( "rejected", [ value ] );
                this.fireEvent( "done", [ value ] );
            };

            /**
             * @method getValue
             * @return { Object }
             */
            Public.getValue = function(){
                return this._value;
            };

            /**
             * @method isDone
             * @return { Boolean }
             */
            Public.isDone = function(){
                return this._state !== DSTATE_UNFULFILLED;
            };

            /**
             * @method isResolved 检测操作是否被接受
             * @return { Boolean }
             */
            Public.isResolved = function(){
                return this._state === DSTATE_FULFILLED;
            };

            /**
             * @method isRejected 检测操作是否被拒绝
             * @return { Boolean }
             */
            Public.isRejected = function(){
                return this._state === DSTATE_REJECTED;
            };

        } );

        /**
         * Class: DeferredList 延迟操作组管理类
         * @param { Params( Deferred ) } deferredlist
         */
        _Class( "DeferredList", _Entity, _Extends( _Deferred ) , null, function( Static, Public ){
            _DeferredList = this;
            function init( deferredlist ){
                var 
                    _this        = this,
                    deferredlist = deferredlist.slice()
                ;

                function deferred_done( ){
                    deferredlist.splice( _XList.indexOf( this ), 1 );
                    if( this.isResolved() ){
                        _this._resolved_list.push( this );
                    }else{
                        _this._rejected_list.push( this );
                    }

                    if( deferredlist.length === 0 ){
                        _this.getValue();
                        if( _this._rejected_list.length === 0 ){
                            _this._state = DSTATE_FULFILLED;
                            _this.fireEvent( "stateChange", [ DSTATE_FULFILLED ] );
                            _this.fireEvent( 
                                "resolved", 
                                [ 
                                    _this._value, 
                                    _this.__COX_DEFERRED_ERROR__,
                                    function end(){
                                        _this.getEvent( "resolved" ).stopPropagation();
                                    }
                                ] 
                            );
                            !_this._error && _this.fireEvent( "done", [ _this.value ] );
                        }else{
                            _this._state = DSTATE_REJECTED;
                            _this.fireEvent( "stateChange", [ DSTATE_REJECTED ] );
                            _this.fireEvent( "rejected", [ _this._value ] );
                            _this.fireEvent( "done", [ _this._value ] );
                        }
                    }
                }

                if( deferredlist.length === 0 ){
                    throw new Error(
                        "DeferredList类构造器参数列表中至少需要一个参数."
                    );                    
                }

                this.Super( "constructor" );
                this._deferred_list = deferredlist.slice();
                this._resolved_list = [];
                this._rejected_list = [];

                _XList.forEach( this._deferred_list, function( deferred, index ){
                    deferred.done( deferred_done );
                    //deferred.addEventListener( "stateChange", deferred_done );
                } );
            }

            Public.constructor = _XFunction( _Params( _Deferred ), init );
            Public.constructor.define( Array, init );

            /**
             * resolved 延迟操作被接受（操作完成）
             * @param { Object } value
             */
            Public.resolved = function( value ){
                var 
                    _this     = this,
                    deferreds = this._deferred_list
                ;
                if( this._state !== DSTATE_UNFULFILLED ){
                    throw new Error(
                        "DeferredList类实例的resolved方法，只能在DeferredList 类实例的状态在未完成时才能被调用."
                    );
                }
                for( var i = 0, l = deferreds.length; i < l; i++ ){
                    var deferred = deferreds[i];
                    if( !deferred.isDone() ){
                        deferred.resolved( value );
                    }
                }
            };

            /**
             * rejected 延迟操作被拒绝（操作失败）
             * @param { Object } value
             */
            Public.rejected = function( value ){
                var deferreds = this._deferred_list;
                if( this._state !== DSTATE_UNFULFILLED ){
                    throw new Error(
                        "DeferredList类实例的rejected方法，只能在DeferredList 类实例的状态在未完成时才能被调用."
                    );
                }
                for( var i = 0, l = deferreds.length; i < l; i++ ){
                    var deferred = deferreds[i];
                    if( !deferred.isDone() ){
                        deferred.rejected( value );
                    }
                }
            };

            /**
             * @method getValue 获取延迟操作列表的所有结果
             * @return { Array }
             */
            Public.getValue = function(){
                if( this.isDone() ){
                    return this._value = this._value 
                        || _XList.map( this._deferred_list, function( deferred, index ){
                            return deferred.getValue();
                        } );
                }
                return null;
            };

            /**
             * @method getDeferredList 返回包含的延迟操作列表
             * @return { Array }
             */
            Public.getDeferredList = function(){
                return this._deferred_list;
            };

        } );
    }();

    /*
     实现 异步模块定义(管理) 工具
     一个模块需要使用另一个外部模块时，首先需要将其加载到环境中，考虑到对环境网络
     资源的有效应用，所以只在需要时才会将依赖模块加载到环境中，被加载的模块
     可能还会引用其他的外部模块, 所以整个过程需要等到整个依赖链上的模块都被加载
     准备完毕是才能让需要使用它们的模块正常使用。
     */
    void function __IMPLEMENT_AMD__(){

        var 
            //const
            RE_URL_SIGN        = /(?:https?|file):\/{2,3}([^\?#]+).*$/i,
            RE_PROTOCOL_SIGN   = /^\w+:\/{2,3}/,
            RE_URL_ROOT        = /^(\w+:\/{2,3}[^\/]+)/,
            RE_URL_PARAMS      = /(?:\?([^#]*))?(#.*)?$/,
            RE_DIR_NAME        = /^(.*)\/.*$/,
            RE_MODULE_NAME     = /^[\w.]+$/,
            RE_PATH_SEP        = /\\{1,}/g,
            REL                = null,
            LOCA_URL           = null,
            LOCA_PROTOCOL      = null,
            LOCA_ROOT          = null,
            MODULE_FILE_EXT    = null,
            MODULE_ROOT        = null,
            Module             = null,
            ModuleCenter       = null,
            config             = {
                debug       : false,
                roots       : {}
            },
            UID  = function(){
                var uid = new Date().getTime();
                return function(){
                    return uid++;
                };
            }()
        ;

        //依赖于环境的常量值
        if( isBrowser ){
            REL             = GLOBAL.document.documentElement;
            LOCA_URL        = GLOBAL.location.href;
            LOCA_PROTOCOL   = LOCA_URL.match( RE_PROTOCOL_SIGN )[0];
            LOCA_ROOT       = LOCA_URL.match( RE_URL_ROOT )[1];
            MODULE_ROOT     = LOCA_URL.match( RE_DIR_NAME )[1];
            MODULE_FILE_EXT = ".js";
        }else if( isNode ){
            LOCA_PROTOCOL   = "";
            LOCA_ROOT       = dirname( require.main.filename );
            MODULE_ROOT     = LOCA_ROOT;
            MODULE_FILE_EXT = "";
        }else{
            throw new Error(
                "Cox 未在该环境中提供兼容支持"
            );
        }

        /**
         * realpath 计算一相对路径对应的绝对路径
         * @param { String } path 相对路径
         * @return { String }
         */
        function realpath( path ){
            var n = 0;

            path  = stdSep( path );
            path  = path.split( "/" );

            for( var i = 0, l = path.length; i < l; i++ ){
                var name = path[i];
                switch( name ){
                    case "":
                    case ".":
                    break;
                    case "..": n > 0 && n--; break;
                    default: path[n++] = name; break;
                }
            }

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
            path  = stdSep( path );
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
            path  = stdSep( path );
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

        /**
         * stdSep 将路径中的分隔符替换成标准的路径分隔符
         * @param { String } path
         * @return { String }
         */
        function stdSep( path ){
            RE_PATH_SEP.lastIndex = 0;
            return path.replace( RE_PATH_SEP, "/" );
        }

        config.roots[ "~/" ]    = MODULE_ROOT;
        config.roots[ "~/Cox" ] = ( isNode ? stdSep( __dirname ) : MODULE_ROOT ) + "/modules";

        /**
         * _require 创建一个针对指定模块的引用器
         * @param { Module } tmodule
         * @return { Object }
         */
        function _require( tmodule ){
            var 
                tdepend  = tmodule.depend,
                dmodules = tdepend && tdepend.modules || {},
                dir      = dirname( tmodule.url || "" ),
                cache    = {}
            ;

            return function require( uri ){
                var 
                    module = cache[ uri ],
                    define = null
                ;
                if( !( module instanceof Module ) ){
                    //只从依赖模块中查找匹配的模块
                    _XObject.forEach( dmodules, true, function( m, k ){
                        var url = m.url || m.id;
                        if( k === uri
                         || url.slice( 0 - uri.length ) === uri 
                         || url.slice( 0 - uri.length - 3 ) === uri + ".js"
                         || realpath( url ) === realpath( dir + "/" + uri )
                        ){ 
                            //缓存起
                            module = cache[ uri ] = m;
                            return false;
                        }
                    } );
                }

                if( !( module instanceof Module ) ){
                    throw new Error(
                        "请求的 " + uri + " 模块未被加载或未在 " + ( tmodule.uri || "当前执行"  ) + " 模块的依赖列表中声明."
                    );
                }

                if( !module.isResolved() && module.isRejected() ){
                    throw new Error(
                        uri + " 模块由于未被准备好或该模块是一个不可用模块，导致无法被正常使用."
                    );
                }
                if( !module.exports ){
                    module.exports = {};
                }

                if( typeof module.define !== "function" ){
                    return module.exports;
                }
                define = module.define;
                delete module.define;

                //调用模块的定义体
                define( 
                    _require( module ),
                    module.exports, 
                    module, 
                    module.url,
                    dirname( module.url )
                );

                return module.exports;
            };
        }

        //模块管理中心，完成模块的加载，依赖管理，缓存，等任务
        ModuleCenter = _Class( "ModuleCenter", _Single, _Extends( _EventSource ), null, function( Static, Public ){
            
            var 
                loaded_modules  = {},
                loading_modules = {},
                pending_modules = {},
                cache           = isNode ? require.cache : {},
                load            = null
            ;

            //模块加载器
            load = [
                function( module ){
                    var 
                        loader   = document.createElement( "script" ),
                        url      = module.url
                    ;

                    if( !url ){
                        return ;
                    }

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
                        if( loader.addEventListener 
                         || loader.readyState === "loaded" 
                         || loader.readyState === "complete" 
                        ){

                            delete loading_modules[ module.id ];
                            loaded_modules[ module.id ] = module;
                            
                            if( !module.loaded.isDone() ){
                                module.loaded.resolved();
                            }

                            if( module.isEmpty() ){
                                module.resolved();
                            }

                            if( loader.removeEventListener ){
                                loader.removeEventListener( "load", loaded );
                            }else{
                                loader.detachEvent( "onreadystatechange", loaded );
                            }
                        }
                    }

                    function loadfail(){
                        delete loading_modules[ module.id ];

                        if( loader.removeEventListener ){
                            loader.removeEventListener( "error", loadfail );
                        }

                        //console.warn( "load fail:", module.url );
                        module.loaded.rejected();
                        module.rejected();
                    }                
                },
                function( module ){
                    var exports = null;

                    try{
                        exports = require( module.url || module.id );
                        //console.log( module.id );
                        loaded_modules[ module.id ] = module;
                    }catch( e ){
                        module.loaded.rejected();
                        module.rejected();
                        throw e;
                    }finally{
                        delete loading_modules[ module.id ];
                    }

                    if( !module.loaded.isDone() ){
                        module.loaded.resolved();
                    }

                    if( module.isEmpty() ){
                        module.define = function( r, e, module ){
                            module.exports = exports;
                        }
                        module.resolved();
                    }
                }
            ][ ~~isNode ];

            Public.constructor = function(){
                this.Super( "constructor" );
                this.dispatchEvent(
                    new _Event( "loading" ),
                    new _Event( "loaded" ),
                    new _Event( "error" )
                );
            };

            /**
             * @method pending 将指定模块挂载到管理中心中，完成模块加载和依赖关联
             * @param { Module } module
             */
            Public.pending = function(){

                //关联依赖链
                function link( module, dmodule, pending ){
                    var 
                        dmodules = dmodule.depend && dmodule.depend.modules
                    ;
                    //将每一个依赖模块的依赖模块关联到指定模块上
                    dmodules && _XObject.forEach( dmodules, true, function( dm, id ){
                        id = dm.id;

                        if( id !== module.id
                         && !( pending.list[ id ] instanceof Module )
                        ){
                            pending.list[ id ] = dm;
                            pending.length++;
                            dm.loaded.then(
                                function(){
                                    pending.length--;
                                    link( module, dm, pending );
                                },
                                function( value ){
                                    module.rejected( value );
                                }
                            );
                        }
                    } );

                    //当所有依赖模块被准备完毕之时
                    if( pending.length === 0 && pending.wait === null ){
                        pending.wait = 1;

                        if( module.isMain() ){
                            //这样做目的只是为了缺位确保入口模块能在所有依赖模
                            //块完成之后才被调用，确保逻辑正确性
                            var modules = [];
                            module.depend && _XObject.forEach( module.depend.modules, true, function( m ){
                                if( m instanceof Module ){
                                    modules.push( m );
                                }
                            } );
                            //顺序
                            new _DeferredList( modules ).then(
                                function(){
                                    module.resolved();
                                },
                                function( value ){
                                    module.rejected( value );
                                }
                            );
                        }else{
                            module.resolved();
                        }
                    }
                }

                return function( module ){
                    var 
                        pending = {
                            module : module,
                            list   : {},
                            length : 0,
                            wait   : null
                        },
                        eloaded  = ModuleCenter.getEvent( "loaded" ),
                        eloading = ModuleCenter.getEvent( "loading" ),
                        eerror   = ModuleCenter.getEvent( "error" )
                    ;

                    pending_modules[ module.uid ] = pending;

                    //加载需要被加载的依赖模块
                    if( module.depend && module.depend.modules ){
                        _XObject.forEach( module.depend.modules, true, function( dmodule, id ){

                            if( ModuleCenter.exists( dmodule ) ){
                                module.depend.modules[ id ] = ModuleCenter.getModule( dmodule.id );
                                return ;
                            }

                            dmodule.__COX_MODULE_MAIN__   = module.__COX_MODULE_MAIN__ || module;
                            loading_modules[ dmodule.id ] = dmodule;
                            load( dmodule );

                            eloading.target = dmodule;
                            ModuleCenter.fireEvent( "loading", [ eloading ] );

                            dmodule.loaded.then(
                                function(){
                                    eloaded.target = dmodule;
                                    ModuleCenter.fireEvent( "loaded", [ eloaded ] );
                                },
                                function(){
                                    eerror.target = dmodule;
                                    ModuleCenter.fireEvent( "eerror", [ eerror ] );
                                }
                            );
                        } );
                    }

                    link( module, module, pending );
                };
            }();

            /**
             * @method exists 检测某一模块是否被包含在模块管理中心里
             * @param { Module } module
             * @return { Boolean }
             */
            Public.exists = function( module ){
                return this.loaded( module ) || this.loading( module );
            };

            /**
             * @method loaded 检查某一模块是否已经加载完成并包含在模块管理中心里
             * @param { Module } module
             * @return { Boolean }
             */
            Public.loaded = function( module ){
                return module && loaded_modules[ module.id ] instanceof Module;
            };

            Public.loading = function( module ){
                return module && loading_modules[ module.id ] instanceof Module;
            };

            /**
             * @method getModule 返回包含在模块管理中心中的某一模块
             * @param { String } id
             * @return { Module }
             */
            Public.getModule = function( id ){
                var module = null;
                module = loaded_modules[ id ];
                module = module instanceof Module ? module : loading_modules[ id ];
                return module instanceof Module ? module : null;
            };

            /**
             * findById 根据模块ID查询模块管理中心中的模块
             * @param { Object } modules 模块集
             * @param { String } id
             * @return { Module }
             */
            function findById( modules, id ){
                var module = modules[ id ];
                return module instanceof Module ? module : null;
            };

            /**
             * findByHandler 根据自定义条件查询模块管理中心中的模块
             * @param { Object } modules 模块集
             * @param { Function } handler
             * @return { Module }
             */
            function findByHandler( modules, handler ){
                var result = null;
                _XObject.forEach( modules, true, function( module, id ){
                    if( handler( module, id ) ){
                        result = module;
                        return false;
                    }
                } );
                return result;
            };

            /**
             * @method findInLoading 根据模块ID查询模块中心中正在加载的模块
             * @param { String } id
             * @return { Module }
             */ 
            Public.findInLoading = _XFunction( String, function( id ){
                return findById( loading_modules, id );
            } );

            /**
             * @method findInLoading 根据自定义条件查询模块中心中正在加载的模块
             * @param { Function } handler
             * @return { Module }
             */
            Public.findInLoading.define( Function, function( handler ){ 
                return findByHandler( loading_modules, handler );
            } );  

            /**
             * @method findInLoaded 根据模块ID查询模块中心中已经加载完成的模块
             * @param { String } id
             * @return { Module }
             */
            Public.findInLoaded = _XFunction( String, function( id ){
                return findById( loaded_modules, id );
            } );

            /**
             * @method findInLoaded 根据自定义条件查询模块中心中加载完成的模块
             * @param { Function } handler
             * @return { Module }
             */
            Public.findInLoaded.define( Function, function( handler ){
                return findByHandler( loaded_modules, handler );
            } );

            /**
             * @method findInCache 根据模块ID查询模块中心中已经加载完成的模块(对象Node.js环境)
             * @param { String } id
             * @return { Module }
             */
            Public.findInCache = _XFunction( String, function( id ){
                return findById( cache, id );
            } );

            /**
             * @method findInCache 根据自定义条件查询模块中心中已经加载完成的模块(对象Node.js环境)
             * @param { Function } handler
             * @return { Module }
             */
            Public.findInCache.define( Function, function( handler ){
                return findByHandler( cache, handler );
            } );

        } ).getInstance();

        /**
         * Module 模块信息类
         * @param { String } uri 模块路径
         * @param { String } root 模块目录
         * @param { Modules } depend 依赖模块
         * @param { Function } define 模块定义
         */
        _Class( "Module", _Finaly, _Extends( _Deferred ), null, function ( Static, Public ){
            Module = this;
            var moduleUriFormats = [
                {
                    //URL
                    pattern : /^\w+:\/{2,3}[\S]+$/,
                    resolve : function( url ){
                        return url;
                    }
                },
                {
                    //root
                    pattern : /^~\/.+$/,
                    resolve : function( uri ){
                        var root = "~/";
                        _XList.forEach( uri.slice( 2 ).split( "/" ), function( item, index ){
                            if( ( root + item ) in config.roots ){
                                root += item;
                                return false;
                            }
                        } );
                        return merge( config.roots[ root ], uri.slice( root.length ) );
                    }
                },
                {
                    //uri
                    pattern : /^(?:\.{1,2}?\/|\/).+$/,
                    resolve : function( uri, root ){
                        if( uri.charAt( 0 ) === "/" ){
                            root  = LOCA_ROOT;
                        }
                        return merge( root, uri );
                    }
                },
                {
                    //global
                    pattern : /^[\S]+$/,
                    resolve : function( uri, root ){
                        return "";
                    }
                },
                {
                    //ABSOLUTE PATH
                    pattern : /^[A-Za-z]\:.+$/,
                    resolve : function( path ){
                        return path;
                    }
                }
            ];

            function merge( root, uri ){
                var protocol = splitProtocol( root );
                root         = protocol[1];
                protocol     = protocol[0];
                return protocol + realpath( root + "/" + uri ).slice( 1 ) + MODULE_FILE_EXT;
            }

            if( isNode ){
                merge = function( root, uri ){
                    return realpath( root + "/" + uri ).slice( 1 );
                };  
            }

            /**
             * @static resolve 根据传入的路径信息 解析出完整的模块文件路径值
             * @parma { String } uri
             * @param { String } root
             * @return { String }
             */
            Static.resolve = function( uri, root ){
                var 
                    url  = "",
                    info = {}
                ;
                root = root || MODULE_ROOT;

                uri && _XList.forEach( moduleUriFormats, function( format, index ){
                    if( format.pattern.test( uri ) === true ){
                        url = format.resolve( uri, root );
                        return false;
                    }
                }, this );
                info.id  = url || uri;
                info.url = url;

                return info;
            };

            Public.constructor = function( uri, root, depend, define ){
                this.Super( "constructor" );
                
                this.setUri( uri, root );
                this.exports    = {};
                this.loaded     = new _Deferred();
                this.depend     = depend;
                this.define     = define;
                this.uid        = "MODULE#" + UID();

                this.__COX_MODULE_MAIN__ = null;
            };

            /**
             * @method setUri 修改模块的路径信息
             * @param { String } uri 
             * @param { String } root
             */
            Public.setUri = function( uri, root ){
                var url = "";
                uri     = _XString.trim( uri || "" );
                root    = _is( String, root ) ? root : config.roots[ "~/" ];
                _XObject.mix( this, Module.resolve( uri, root ), true );
            };

            /**
             * @method isMain 检查是否为入口模块
             * @return { Boolean }
             */
            Public.isMain = function(){
                return this === this.__COX_MODULE_MAIN__;
            };

            /**
             * @method isEmpty 
             * @return { Boolean }
             */
            Public.isEmpty = function(){
                return !this.depend && !this.define;
            };

        } );
        
        /**
         * Modules 依赖模块
         * @param { String [] } uris
         */
        _Modules = _KeyWord(
            "Modules", _KeyWord.SUBSIDIARY, ObjectFactory( function( uris ){
                this.setModules( uris );
            } )
        );

        _Modules.prototype.setModules = function( uris, root ){
            var 
                modules = {}
            ;

            this._uris     = uris;
            this._root     = root = root || MODULE_ROOT;
            _XList.forEach( uris, function( uri, key ){
                var minfo, id;

                if( modules[ uri ] instanceof Module ){
                    return;
                }
                minfo          = Module.resolve( uri, root );
                id             = minfo.id;
                modules[ uri ] = ModuleCenter.getModule( id ) || new Module( uri, root );
            } );
            this.modules = modules;
        };

        _Modules.prototype.setRoot = function( root ){
            this._root = root;
            this.setModules( this._uris, root );
        };

        _Modules.ModuleCenter = ModuleCenter;

        /**
         * Define 模块定义工具
         * @param { String } modulename 模块名
         * @param { Modules } depend 依赖模块
         * @param { Functio } define 模块定义
         */
        _Define = _KeyWord(
            "Define", _KeyWord.TOOL, function Define( modulename, depend, define ){
                var 
                    newmodule   = null,
                    modulename  = _XString.trim( modulename ),
                    cmodulename = new RegExp( "\/" + modulename + "(?:\.js|\.JS)?$" )
                ;

                if( !( _is( String, modulename ) ? modulename : "" ).length 
                 || !RE_MODULE_NAME.test( modulename )
                ){
                    throw new Error( "无效的模块标识符" );
                }

                if( !define ){
                    throw new Error( "需要一个Function类型实例来完成模块的定义" );
                }

                newmodule = ModuleCenter.findInLoading( modulename ) 
                         || ModuleCenter.findInLoading( function( module, id ){
                            return cmodulename.test( id );
                         } );

                if( !newmodule ){
                    //对象node.js平台
                    if( isNode ){
                        newmodule = ModuleCenter.findInCache( function( module, id ){
                            if( cmodulename.test( id ) && !module.loaded ){
                                newmodule = module;
                                return false;
                            }
                        } );

                        if( newmodule ){
                            var root = dirname( newmodule.filename );
                            if( depend ){
                                depend.setRoot( root );
                                _Use( depend, root, function( require, module ){
                                    define( require, module.exports, module );
                                    newmodule.exports = module.exports;
                                } );
                            }else{
                                var nmodule = new Module( modulename, root, depend, define );
                                nmodule.loaded.resolved();
                                nmodule.resolved();
                                nmodule.__COX_MODULE_MAIN__ = nmodule;
                                define(
                                    _require( nmodule ),
                                    nmodule.exports,
                                    nmodule
                                );
                                newmodule.exports = nmodule.exports;
                            }

                            return false;
                        }
                    }

                    newmodule = new Module( modulename, "" );
                }

                if( depend ){
                    depend.setRoot( dirname( newmodule.url ) );
                }

                newmodule.define = define;
                newmodule.depend = depend;
                newmodule.loaded.resolved();
                ModuleCenter.pending( newmodule );
            }
        );
        
        /**
         * Use 使用外部的模块
         * @param { Modules } modules 外部模块列表
         * @param { String } root 模块加载的目录
         * @param { Function } handler 处理程序
         */        
        _Use = _KeyWord(
            "Use", _KeyWord.TOOL, function( modules, root, handler ){
                var main = null;
                if( root ){

                    if( !RE_URL_SIGN.test( root ) ){
                        //URI
                        root = realpath( config.roots["~/"] + "/" + root ).substr(1);
                    }
                    //重置依赖模块中模块的目录
                    modules.setRoot( root );
                }

                main = new Module( "", "", modules );

                main.then( function(){
                    handler( _require( main ), main )
                } );
                main.__COX_MODULE_MAIN__ = main;
                main.loaded.resolved();
                //将模块挂到模块中心里，完成依赖模块的加载
                ModuleCenter.pending( main );
            }
        );
    }();

    GLOBAL.Cox            = Cox;
    GLOBAL.XObject        = Cox.XObject        = _XObject;
    GLOBAL.XString        = Cox.XString        = _XString;
    GLOBAL.XList          = Cox.XList          = _XList;
    //GLOBAL.PlainObject  = Cox.PlainObject    = _PlainObject;
    //GLOBAL.Null         = Cox.Null           = _Null; 
    GLOBAL.is             = Cox.is             = _is;
    GLOBAL.Nullable       = Cox.Nullable       = _Nullable;
    GLOBAL.Optional       = Cox.Optional       = _Optional;
    GLOBAL.Params         = Cox.Params         = _Params;
    GLOBAL.ParamTypeTable = Cox.ParamTypeTable = _ParamTypeTable;
    GLOBAL.Implements     = Cox.Implements     = _Implements;
    GLOBAL.Extends        = Cox.Extends        = _Extends;
    GLOBAL.Abstract       = Cox.Abstract       = _Abstract;
    GLOBAL.Single         = Cox.Single         = _Single;
    GLOBAL.Finaly         = Cox.Finlay         = _Finaly;
    GLOBAL.XFunction      = Cox.XFunction      = _XFunction;
    GLOBAL.Deferred       = Cox.Deferred       = _Deferred;
    GLOBAL.DeferredList   = Cox.DeferredList   = _DeferredList;

    GLOBAL.forEach = Cox.forEach = _XFunction(
        Array, Function, _Optional( Object ), _XList.forEach
    );

    GLOBAL.Iterator = Cox.Iterator = _Interface( "Iterator", null, function( Static, Public ){
        Public.hasNext = Function;
        Public.next    = Function;
        Public.reset   = Function;
    } );

    GLOBAL.forEach.define(
        Cox.Iterator, Function, _Optional( Object ) , function( iter, callback, thisp ){
            while( iter.hasNext() ){
                if( callback.call( thisp || null, iter.next(), iter ) === false ){
                    break;
                }
            }
        }
    );

    GLOBAL.forEach.define( 
        Object, _Optional( Boolean, true ), Function, _Optional( Object ), _XObject.forEach
    );

    GLOBAL.Class = Cox.Class = _XFunction(
        _Optional( String ), 
        _Optional( _ClassMode, _Entity ), 
        _Optional( _Extends ),
        _Optional( _Implements ),
        Function,
        _Class
    );

    GLOBAL.Interface = Cox.Interface = _XFunction(
        String, _Optional( _Extends ), Function, _Interface 
    );

    GLOBAL.Define = Cox.Define = _XFunction(
        String, _Optional( _Modules ), Function, _Define
    );

    GLOBAL.Modules = Cox.Modules = _XFunction(
        Params( String ), _Modules
    );

    GLOBAL.Modules.define(
        Array, _Modules
    );

    GLOBAL.Depend     = Cox.Modules;
    GLOBAL.Use        = _XFunction( _Modules, _Optional( String ), Function, _Use );
    Cox.Event         = _Event;
    Cox.EventListener = _EventListener;
    Cox.EventSource   = _EventSource;
    

}();

