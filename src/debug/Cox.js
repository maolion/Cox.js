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
 * -   Date 2013/11/1
 * -   Version v1.1
 * -   Author maolion.j@gmail.com
 * -   website http://maolion.com
 *
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
        Cox                   = { VERSION : "1.1.0" },
        newObject             = null,
        gunit                 = null,
        //主要功能模块（对外接口）
        _UTest                = null,
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

    /*
    由于Cox.js(debug版，在非debug版的源码文件中 _RELIABLE_CONSOLE_ 代
    码块的代码将会被剔除)需要依赖 环境提供的 console"控制台"输出接口 输出代
    码调试测试信息。所以为了源代码功能块能在某些环境未提供console"控制台"输
    出接口的情况下正常运作，这里给予简单的容错处理。
    */
    void function _RELIABLE_CONSOLE_(){
        var 
            console = GLOBAL.console || {
                info  : EMPTY_FUNCTION,
                log   : EMPTY_FUNCTION,
                warn  : EMPTY_FUNCTION,
                error : EMPTY_FUNCTION
            }
        ;

        if( typeof console.group !== "function" ){
            console.group = function(){
                try{
                    console.log.apply( console, arguments );
                }catch( e ){
                    console.log( SLICE.call(arguments) );
                }
            };
            console.groupEnd = EMPTY_FUNCTION;
        }

        console._warn = function( message, errorType ){
            try{
                throw new ( errorType || Error )( message );
            }catch( e ){
                console.warn( e.stack || e.message || e );
            }
        };

        console._error = function( message, errorType ){
            try{
                throw new ( errorType || Error )( message );
            }catch( e ){
                console.error( e.stack || e.message || e );
            }
        };

        if( isNode ){
            console.error = console.log;
            console.warn  = console.log;
        }

        GLOBAL.console = console;
    }(); 

    /*
    实现 用于单元测试的类(使用 _UTest 标识, 只有在debug版的源码中有提供 )
    每一个 _UTest类实例对象 都被看作是一个要被测试的单元，一个测试单元操作
    的数据就是可执行的代码段（函数），代码段由使用者提供，它们的操作主要是
    确保某一些已被实现的功能模块能够按所需求的一样正确执行，每一个测试单元
    （即，_UTest类实例对象）都可以拥有子测试单元（这里，子测试单元被看作是
    包含它的测试单元中的代码段）。理论上 某一个测试单元的测试操作未完成时(
    严格意义上来说是，未得到的完整的测试结果的情况下)， 那 么下一个测试单元
    的测试操作必须等待前一测试单元的测试操作完成后在执行。
    */
    void function _IMPLEMENT_UTEST_(){

        var 
            test_queue     = [],
            busy           = false,
            unit_info      = null,
            result_info    = null
        ;

        //用于创建测试结果信息对象
        function TestResultInfo(){
            this.passCount         = 0;
            this.failCount         = 0;
            this.startTime         = new Date();
        }

        //用于创建测试单元相关信息对象
        function TestUnitInfo( unit, test_args ){
            test_args              = test_args || [];
            this.unit              = unit || null;
            this.test_all_always   = !!test_args[0];
            this.only_fail_message = !!test_args[1];
        }

        /**
         * assert 保证某一结果的正确性
         * @param { Boolean } result 
         * @param { String } message 对测试结果的描述（或被称为标签）
         */
        function assert( result, message ){
            message = message || ( "" + result );
            if( result ){
                result_info.passCount++;
                if( !unit_info.only_fail_message ){
                    console.log( "[√] " + message );                    
                }
            }else if( unit_info.test_all_always ){
                result_info.failCount++;
                console._error( "Assertion failed: " + message );
            }else{
                test_queue.length       = 0;
                busy                    = false;
                unit_info.unit._testing = false;
                unit_info               = null;
                throw new Error( "Assertion failed: " + message );
            }
        }

        /**
         * defferred 阻塞测试队列（或，通知下一测试单元需要等待当前测试单元测试完
         * 成后在执行测试操作)
         */
        function deferred(){
            busy = true;
            //console.log( "等待测试结果..." );
        }

        /**
         * 执行下一测试单元的测试操作。
         */
        function next(){
            var 
                unit      = test_queue.shift() || [],
                test_args = unit[1] || [],
                unit      = unit[0]
            ;
            
            busy = false;
            if( unit_info && unit_info.unit ){
                unit_info.unit._testing = false;
            }

            if( !unit ){
                return;
            }else if( unit === console.groupEnd ){
                unit_info = null;
                console.groupEnd();

                //如果测试队列中已经没有其他任务测试单元的情况，将输出相关的测试
                //结果信息
                if( test_queue.length === 0 ){
                    var
                        pass_count = result_info.passCount,
                        fail_count = result_info.failCount,
                        message    = "",
                        output     = "log"
                    ;


                    if( pass_count + fail_count ){
                        if( fail_count === 0 ){
                            message = "All passed.";
                        }else{
                            output  = "warn";
                            message = fail_count + " faileds.";
                        }

                    }

                    console[ output ]( 
                        message,
                        "Finished in " + ( ( new Date - result_info.startTime ) / 1000 ) + "s."
                    );

                    result_info = null;
                }
                
                next();
                return;
            }
            if( !result_info ){
                result_info = new TestResultInfo;
                console.log( result_info );
            }

            unit.test.apply( unit, test_args );
            return unit;
        };

        /**
         * _UTest 类用于创建测试单元
         * 
         * @constructor UTest
         * @param { String } label 测试单元标识符（标签）
         * @param { Function } code 代码段
         *
         * @property { String } label 测试单元标识符（标签）
         * @property { Function } code 代码端
         * @property { Boolean } disabled 禁止测试单元中的添加，删除和测试操作
         * @example
         *  new _UTest();
         *  new _UTest( "Hello" );
         *  new _UTest( "HelloWorld", function( assert, deferred, next ){
         *      ....
         *  } );
         */
        _UTest = function UTest( label, code ){
            if( code ){
                this.label = label || "";
                this.code  = code;
            }else{
                if( typeof label === "function"  ){
                    this.label = "";
                    this.code  = label;
                }else{
                    this.label = label;
                    this.code  = EMPTY_FUNCTION;
                }
            }

            this.disabled  = false;
            //使用有序列表做为子测试单元的存储器的目的是保证测试结果的输出顺序
            this._subunits = []; 
            this._testing  = false;
        };

        /**
         * @method append 为测试单元添加一个或多个子测试单元
         * @param { UTest [] } units 
         * @example
         *  var tests = new _UTest();
         *  tests.append( 
         *      new _UTest( "test1", function( assert ){ assert( 1, "test1" ); } )[,
         *      new _UTest( "test2", function( assert ){ assert( 2, "test2" ); } ),
         *      ...]
         *  );
         */
        _UTest.prototype.append = function( units ){
            var units = SLICE.call( arguments );

            if( this.disabled ){
                console._warn( 
                    "无法对一个失效(disabled属性为true)的测试单元进行修改操作" 
                );
                return null;
            }

            for( var i = 0, l = units.length; i < l; i++  ){
                var unit = units[ i ];
                if( !( unit instanceof _UTest ) ){
                    throw new TypeError( "测试单元类型错误" );
                }

                if( unit === this ){
                    continue;
                }

                this._subunits.push( unit );
            }

        };


        /**
         * @method remove 从测试单元中删除一个或多个子测试单元
         * @param { String [] } labels 用于匹配要删除测试单元的标签
         * @return { UTest [] } 返回被删除子测试单元清单
         * @example
         *  var tests = new _UTest();
         *  tests.append( 
         *      new _UTest( "test1", function( assert ){ assert( 1, "test1" ); } ),
         *      new _UTest( "test2", function( assert ){ assert( 2, "test2" ); } )
         *  ); 
         *  tests.remove( "test1"[, "test2", ... ] );
         */
        _UTest.prototype.remove = function( labels ){
            var 
                labels = arguments,
                units  = this._subunits,
                dels   = []
            ;

            if( this.disabled ){
                console._warn( 
                    "无法对一个失效(disabled属性为true)的测试单元进行修改操作" 
                );
                return null;
            }

            for( var i = 0, l = labels.length, l2 = units.length - 1; i < l; i++ ){
                var label = labels[ i ];
                for( var i2 = l2; i2 >= 0; i-- ){
                    var unit = units[ i2 ];
                    if( unit.label !== label ){
                        continue;
                    }
                    if( unit._testing ){
                        console._warn(
                            "子测试单元由于状态处在测试中，所以无法将其删除。"
                        );
                        continue;
                    }

                    dels.push( unit );
                    units.splice( i2, 1 );
                }
            }

            return dels;
        };

        /**
         * @method subUnit 根据给定的标签从子测试单元列表中查找匹配的测试单元
         * 项，并将其返回
         * @param { String } label 用于匹配子测试单元的标签
         * @return { UTest }
         * @example
         *  var tests = new _UTest();
         *  tests.append( 
         *      new _UTest( "test1", function( assert ){ assert( 1, "test1" ); } ),
         *      new _UTest( "test2", function( assert ){ assert( 2, "test2" ); } )
         *  );
         *  var test1 = tests.subUnit( "test1" );
         */
        _UTest.prototype.subUnit = function( label ){
            var 
                unit  = null,
                units = this._subunits
            ;

            for( var i = 0, l = units.length; i < l; i++  ){
                unit = units[ i ];
                if( unit.label === label ){
                    break;
                }   
                unit = null;
            }
            
            return unit;
        };

        /**
         * @method test 为测试单元执行测试操作
         * 它同时会间接的执行其所有子测试单元的测试操作
         * @param  { Boolean } test_all_alaways 存在有失败的测试结果的情况下，是
         * 是否继续执行余下的测试操作
         * @param { Boolean } only_fail_message 是否只输出失败的测试结果信息。
         * @example
         *  var tests = new _UTest();
         *  var test1 = new _UTest( "test1", function( assert ){ assert( 1, "test1" ); } );
         *  tests.append( 
         *      test1,
         *      new _UTest( "test2", function( assert ){ assert( 2, "test2" ); } )
         *  );
         *  tests.test( );
         *  tests.test( true );
         *  tests.test( true, true );
         *  test1.test();
         *  tests.subUnit( "test2" ).test( true );
         */
        _UTest.prototype.test = function( test_all_always, only_fail_message ){
            if( this.disabled ){
                console._warn( 
                    "无法对一个失效(disabled属性为true)的测试单元进行测试操作" 
                );
                return;
            }else if( this._testing ){
                return;
            }

            if( busy ){
                //每一个测试单元的测试操作都需要等待前一测试单元的测试操作执行
                //完成时才会被执行
                test_queue.push( [ this, arguments ] );                
            }else{

                var units = this._subunits;


                if( !result_info ){
                    result_info = new TestResultInfo;
                }
                unit_info = new TestUnitInfo( this, arguments );

                console.group( "test " + ( this.label || "unknow" ) + " unit." );

                test_queue.unshift( [ console.groupEnd ] );
                //如果存在子测试单元，那么子测试单元将取代下一测试单元的位置。
                for( var i = units.length - 1; i >= 0; i-- ){
                    test_queue.unshift( [ units[ i ], arguments ] );
                }

                this._testing = true;

                this.code( assert, deferred, next );

                if( !busy ){
                    next();
                }

            }
        };
    }(); 


    gunit = new _UTest( "Global" );
    
    //创建一个新对象，并将指定对象作用于新对象原型链上   
    newObject = Object.create || (function(){
        function co_bridge(){};
        return function newObject( proto ){
            co_bridge.prototype = proto;
            return new co_bridge;
        }
    }());

    //为newObject功能模块添加单元测试
    gunit.append( new _UTest( "newObject", function( assert ){
        var 
            proto = null,
            obj   = null
        ;

        proto = {
            p1 : "Hello",
            p2 : "World"
        };

        obj    = newObject( proto );
        obj.m1 = function(){
            return this.p1 + "," + this.p2;
        };

        assert( obj.m1() === "Hello,World", "检测对象原型链" );

    } ) );
    //gunit.subUnit( "newObject" ).test();
    
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

    //为ObjectFactory功能模块添加单元测试
    gunit.append( new _UTest( "ObjectFactory", function( assert ){
        var 
            A   = null,
            obj = null,
            f   = null
        ;
        f = function( a, b ){
            this.p1 = 1 + ~~a;
            this.p2 = -1 + ~~b;
        };
        A = ObjectFactory( f );

        A.prototype.m1 = function(){
            return this.p1 + this.p2;
        };

        obj = A();
        
        assert( obj instanceof A , "检测对象的构造器" );
        assert( obj.p1 === 1 , "检测对象成员" );
        assert( obj.m1() === 0, "检测对象原型链" );
        assert( A.toString() === f.toString(), "检测是否能正确执行-1" );
        assert( A(1).m1() + A( 1, 2 ).m1() === 4, "检测是否能正确执行-2" );
        A = ObjectFactory( function(){ this.p2 = 1 }, obj );

        assert( A().p1 === 1, "继承特性执行状态测试" );
        assert( A().m1() === 2, "继承特性执行状态测试" );
        A.prototype.p2++;
        assert( obj.p2 === -1, "继承特性执行状态测试" );
        assert( A().constructor === A, "检测是否能正确执行-3" );
    } ) );
    //gunit.subUnit( "ObjectFactory" ).test(false);

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

        gunit.append( new _UTest( "KeyWord", function( assert ){
            var 
                temp  = {
                    groups   : groups,
                    keywords : keywords
                },
                keyword1 = null,
                keyword2 = null
            ;

            //防止扰乱原有数据s
            groups = {
                Tool              : {},
                DataType          : {},
                ParamTypeModifier : {},
                Subsidiary        : {}
            };

            keywords = {};

            keyword1 = _KeyWord( "sun", null, function( a, b ){
                return a + b;
            } );

            assert( typeof keyword1 === "function", "检测调用 _KeyWord 的执行结果" );
            assert( _KeyWord.Tool( "A", function(){} ), "检测快捷接口 _KeyWord.Tool" );
            assert( _KeyWord.DataType( "B", function(){} ), "检测快捷接口 _KeyWord.DataType" );
            assert( _KeyWord.ParamTypeModifier( "C", function(){} ), "检测快捷接口 _KeyWord.ParamTypeModifier" );
            assert( _KeyWord.Subsidiary( "D", function(){} ), "检测快捷接口 _KeyWord.Subsidiary" );
            assert( _KeyWord.__instancelike__( keyword1 ), "检测关键字是否被成功标记" );
            assert( keyword1( 1, 2 ) === 3, "检测关键字是否能被正确使用" );
            assert(
                _KeyWord.__instancelike__( keyword1, _KeyWord.TOOL ),
                "检测关键字是否被分配到默认分组"
            );
            assert(
                _KeyWord.__instancelike__(
                    _KeyWord( "X", _KeyWord.SUBSIDIARY, EMPTY_FUNCTION ), 
                    _KeyWord.SUBSIDIARY
                ),
                "为关键字进行指定分组"
            );
            keyword2 = _KeyWord( "sun", null, function( a, b ){
                return keyword1( a, b );
            } );
            assert(
                _KeyWord.__instancelike__( keyword1, "Tool" ) && _KeyWord.__instancelike__( keyword2, "Tool" ),
                "检测是否能为同一个关键字添加多个处理程序" 
            );

            groups   = temp.groups;
            keywords = temp.keywords;
        } ) );
    
    }();
    //gunit.subUnit( "KeyWord" ).test();

    /*
     * 提供了一套常用的基础工具组件
     */
    void function __IMPLEMENT_UTIL__(){
        var 
            util_unit             = new _UTest( "Util" ),
            CANNOT_ENUM_PROPERTYS = !(GLOBAL.ActiveXObject && GLOBAL.document && ~~GLOBAL.document.documentMode <= 8) && [] || [
                "constructor",
                "toString",
                "valueOf",
                "toLocaleString",
                "prototype",
                "isPrototypeOf",
                "propertyIsEnumerable",
                "hasOwnProperty",
                "length",
                "unique"
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

        util_unit.append(
            new _UTest( "PlainObject", function( assert ){
                var n = 0;
                function X(){};
                assert( _PlainObject, "PlainObject ok." );
                n = ~~_PlainObject.__instancelike__( {} );
                n += ~~!_PlainObject.__instancelike__( new X );
                assert( n === 2, "检测 PlainObject.__instancelike__ 是否能被正确执行" );
            } )
        );

        _Type = _KeyWord( "Type", _KeyWord.DATATYPE, function Type(){
            return Function.apply( null, arguments );
        } );

        _Type.__instancelike__ = function( type ){
            return !!type  && ( 
                typeof type === "function" || 
                typeof type.__instancelike__ === "function" 
            );
        }

        util_unit.append(
            new _UTest( "Type", function( assert ){
                assert( _Type() instanceof Function, "测试是否能正确执行-1" );
                assert( _Type( 'a', 'return a' )(0) === 0, "测试是否能正确执行-2" );
                var oType = {
                    __instancelike__ : function(){
                        return true;
                    }
                }
                assert( _Type.__instancelike__( String ) === true, "_Type.__instancelike__( String ) === true" );
                assert( _Type.__instancelike__( oType ) === true, "_Type.__instancelike__( oType ) === true" );
                assert( _Type.__instancelike__( {} ) === false, "_Type.__instancelike__( {} ) === false" );
                assert( _Type.__instancelike__( null ) === false, "_Type.__instancelike__( null ) === false" );
            } )
        );

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

        util_unit.append(
            new _UTest( "NullObject", function( assert ){
                var n = 0;
                function X(){};
                assert( _Null, "NullObject ok." );
                n = ~~_Null.__instancelike__( null );
                n += ~~_Null.__instancelike__( undefined );
                n += ~~!_Null.__instancelike__( false );
                assert( n === 3, "检测 Null.__instancelike__ 是否能被正确执行" );
            } )
        );
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
        _XObject.forEach = [
            function (obj, onlyself, callback, thisp)
            {
                onlyself = !!onlyself;
                for( var key in obj ){
                    if( onlyself && !obj.hasOwnProperty( key ) ){
                        continue;
                    }
                    if( callback.call( thisp, obj[ key ], key, obj ) === false ){
                        break;
                    }
                }
            },
            function (obj, onlyself, callback, thisp)
            {
                var props = {};
                onlyself = !!onlyself;
                for( var key in obj ){
                    if( onlyself && !obj.hasOwnProperty( key ) ){
                        continue;
                    }
                    props["__"+key] = obj;
                    if( callback.call( thisp, obj[ key ], key, obj ) === false ){
                        break;
                    }
                }
                //for...in 在IE8- 的环境中无法枚举出已被标记为 dontEnum 的成员
                //dontEnum，即 obj.propertyIsEnumerable( key ) === false
                for ( var i = CANNOT_ENUM_PROPERTYS.length - 1, key; i >= 0; i-- ) {
                    key = CANNOT_ENUM_PROPERTYS[ i ];
                    if ( obj.hasOwnProperty(key)
                      && props["__"+key] !== obj
                      && callback.call(thisp, obj[key], key, obj) === false
                    ) {
                        break;
                    }
                }                
            }
        ][CANNOT_ENUM_PROPERTYS.length ? 1 : 0];


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

        /*
        /**
         * XObject.__instancelike__ 判断某一对象是否能被“看作”为XObject的实
         * 例（除null和undefined外所有类实例都可被看作是 XObject 的实例 )
         * @param { Object } obj
         * @return { Boolean }
        * /
        _XObject.__instancelike__ = function( obj ){
            if( obj === null || obj === undefined ){
                return false;
            }
            if( obj instanceof _XObject ){

            }
            return noextend ? obj.constructor === Object  : true;
        };
        */

        //_XObject.prototype

        //为 XObject及其提供的方法 添加单元测试
        util_unit.append( 
            new _UTest( "XObject", function( assert ){
                assert( new _XObject instanceof Object, "new _XObject instanceof Object" );
                assert( 
                    _KeyWord.__instancelike__( _XObject, _KeyWord.DATATYPE ),
                    "检测XObject是否为关键字"
                );

                /*assert( _XObject.__instancelike__( {} ) === true , "_XObject.__instancelike__( {} ) === true" );
                assert( _XObject.__instancelike__( [] ) === true , "_XObject.__instancelike__( [] ) === true" );
                assert( _XObject.__instancelike__( "X" ) === true , '_XObject.__instancelike__( "X" ) === true' );
                assert( _XObject.__instancelike__( 1 ) === true , '_XObject.__instancelike__( 1 ) === true' );
                assert( _XObject.__instancelike__( false ) === true , '_XObject.__instancelike__( false ) === true' );
                assert( _XObject.__instancelike__( null ) === false , '_XObject.__instancelike__( null ) === false' );
                assert( _XObject.__instancelike__( undefined ) === false , '_XObject.__instancelike__( undefined ) === false' );
                */
            } ) 
        );

        util_unit.subUnit( "XObject" ).append( 
            new _UTest( "forEach", function( assert ){
                var 
                    obj  = null,
                    test = ""
                ;

                obj = {
                    constructor          : function() { return "0"; },
                    toString             : function() { return "1"; },
                    valueOf              : function() { return "2"; },
                    toLocaleString       : function() { return "3"; },
                    prototype            : function() { return "4"; },
                    isPrototypeOf        : function() { return "5"; },
                    propertyIsEnumerable : function() { return "6"; },
                    hasOwnProperty       : function() { return "7"; },
                    length               : function() { return "8"; },
                    unique               : function() { return "9" }
                };

                //console.log(GLOBAL.document.documentMode);
                //console.log( (GLOBAL.ActiveXObject && GLOBAL.document && ~~GLOBAL.document.documentMode <= 8) );
                _XObject.forEach( obj, true, function( v, k ){
                    test += v();
                } );

                assert( test.split("").sort().join("") === "0123456789", "检测是否能枚举遍历对象成员列表" );
                obj = {
                    a : 10,
                    b : 20
                };
                test = 0;
                _XObject.forEach( obj, true, function( v, k ){
                    test += v;
                } );
                assert( test === 30, "检测是否能枚举遍历对象成员列表" );
                /*
                obj = function(){
                    this.toString = 222;
                }
                obj.prototype.valueOf = 111;

                test = 0;
                _XObject.forEach( new obj, false, function( v, key ){
                    console.log(":::", key);
                    test += v;
                } );
                console.log( test );
                assert( test === 333, "检测是否能枚举对象原型链中的成员列表" );*/
            } ) 
        );

        util_unit.subUnit( "XObject" ).append(
            new _UTest( "mix", function( assert ){
                var 
                    obj1 = null,
                    obj2 = null,
                    obj3 = null
                ;

                obj1 = {};
                obj2 = {
                    p1 : 1,
                    p2 : 2
                };

                obj3 = {
                    p1 : 0
                };

                _XObject.mix( obj1, obj2 );
                assert( "p1" in obj1 && "p2" in obj1, "目标对象被混合另一对象成员拷贝" );

                _XObject.mix( obj1, obj3 );
                assert( obj1.p1 === 1, "目标对象成员不会被另一对象同一成员覆盖" );

                _XObject.mix( obj1, obj3, true );
                assert( obj1.p1 === 0, "目标对象成员会被另一对象同一成员覆盖" );

                function A1(){
                };
                A1.prototype.p3 = 1;

                _XObject.mix( obj1, new A1, false, false );
                assert( !( "p3" in obj1 ), "无法将对象原型链上的成员混合到目标对象上" );

                _XObject.mix( obj1, new A1, false, true );
                A1.prototype.p4 = 1;
                _XObject.mix( obj1, new A1, false );
                assert( "p3" in obj1 && "p4" in obj1, "将对象原型链上的成员混合到目标对象上" );
            } )
        );

        util_unit.subUnit( "XObject" ).append(
            new _UTest( "keys", function( assert ){
                var obj = null;

                obj = {
                    p1 : 1,
                    p2 : 2,
                    p3 : 3
                };
                assert(
                    _XObject.keys( obj ).join("").replace( /\d/g, "" ) === "ppp",
                    "检测枚举所得的对象键名列表是否正确"
                );

                obj = function(){
                    this.p1 = 1;
                };
                obj.prototype.p2 = 2;
                assert(
                    _XObject.keys( new obj ).join("").replace( /\d/g, "" ) === "p",
                    "检测枚举所得的对象成员键名列表是否不包含对象原型链对象中的成员键名"
                );
            } )
        );
        //util_unit.sub( "XObject" ).test();


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

        //为 XString 及其提供的方法 添加单元测试
        util_unit.append(
            new _UTest( "XString", function( assert ){
                assert( new _XString instanceof String, "new _XString instanceof String" );
                assert(
                    _KeyWord.__instancelike__( _XString, _KeyWord.DATATYPE ),
                    "检测XString是否为关键字"
                );
                assert( _XString.__instancelike__( new String( "A" ) ) === true, '_XString.__instancelike__( new String( "A" ) ) === true' );
                assert( _XString.__instancelike__( "A" ) === true, '_XString.__instancelike__( "A" ) === true' );
                assert( _XString.__instancelike__(0 ) === false, '_XString.__instancelike__( 0 ) === false' );
                                
                                
            } )
        );

        util_unit.subUnit( "XString" ).append(
            new _UTest( "trim", function( assert ){
                assert( _XString.trim( "abc" ) === "abc", 'XString.trim( "abc" ) === "abc"'  );
                assert( _XString.trim( "  abc" ) === "abc", 'XString.trim( "  abc" ) === "abc"'  );
                assert( _XString.trim( "abc  " ) === "abc", 'XString.trim( "abc  " ) === "abc"'  );
                assert( _XString.trim( "  abc  " ) === "abc", 'XString.trim( "  abc  " ) === "abc"'  );
                assert( _XString.trim( "a b c" ) === "a b c", 'XString.trim( "a b c" ) === "a b c"'  );
                assert( _XString.trim( "  a b c  " ) === "a b c", 'XString.trim( "  a b c  " ) === "a b c"'  );
                assert( _XString.trim( "    " ) === "", 'XString.trim( "    " ) === ""'  );
                assert( _XString.leftTrim( "abc" ) === "abc", 'XString.leftTrim( "abc" ) === "abc"'  );
                assert( _XString.leftTrim( "  abc" ) === "abc", 'XString.leftTrim( "  abc" ) === "abc"'  );
                assert( _XString.rightTrim( "abc" ) === "abc", 'XString.rightTrim( "abc" ) === "abc"'  );
                assert( _XString.rightTrim( " abc  " ) === " abc", 'XString.rightTrim( "abc  " ) === "abc"'  );
                  
            } )
        );

        util_unit.subUnit( "XString" ).append(
            new _UTest( "format", function( assert ){
                assert( _XString.format( "Hello" ) === "Hello", '_XString.format( "Hello" ) === "Hello"' );
                assert( _XString.format( "Hello", "xxx", "xxxxx" ) === "Hello", '_XString.format( "Hello", "xxx", "xxxxx" ) === "Hello"' );
                assert( _XString.format( "{0}", "Hello" ) === "Hello", '_XString.format( "{0}", "Hello" ) === "Hello"' );
                assert( _XString.format( "Hello, {0}", "World" ) === "Hello, World", '_XString.format( "Hello, {0}", "World" ) === "Hello, World"' );
                assert( _XString.format( "{0}, {1}", "Hello", "World" ) === "Hello, World", '_XString.format( "{0}, {1}", "Hello", "World" ) === "Hello, World"' );
                assert( _XString.format( "{1}, {0}", "World", "Hello" ) === "Hello, World", '_XString.format( "{1}, {0}", "World", "Hello" ) === "Hello, World"' );
                assert( _XString.format( "{0}{0}", "!" ) === "!!", '_XString.format( "{0}{0}", "!" ) === "!!"' );
            } )
        );

        util_unit.subUnit( "XString" ).append(
            new _UTest( "quote", function( assert ){
                assert( _XString.quote( "abc" ) === '"abc"', "检测quote是否能正常工作-1" );
                assert( _XString.quote( "abc" ) === '"abc"', "检测quote是否能正常工作-2" );
                assert( _XString.quote( "a\nbc" ) === '"a\\nbc"', "检测quote是否能正常工作-3" );
                 
            } )
        );

        util_unit.subUnit( "XString" ).append(
            new _UTest( "startsWith", function( assert ){
                var ostr = "_XString.startsWith = function( str, search, pos ){";
                assert( _XString.startsWith( ostr, "String" ) === false, "检测startsWith接口是否能正常工作-1" );                     
                assert( _XString.startsWith( ostr, "_XString" ) === true, "检测startsWith接口是否能正常工作-2" );
                assert( _XString.startsWith( ostr, "String", 2 ) === true, "检测startsWith接口定位搜索-3" );                     
                assert( _XString.startsWith( ostr, "String", 1 ) === false, "检测startsWith接口定位搜索-4" );                     
            } )
        );

        util_unit.subUnit( "XString" ).append(
            new _UTest( "endsWith", function( assert ){
                var ostr = "_XString.endsWith";
                assert( _XString.endsWith( ostr, "Wit" ) === false, "检测endsWith接口是否能正常工作-1" );                     
                assert( _XString.endsWith( ostr, "endsWith" ) === true, "检测endsWith接口是否能正常工作-2" );
                assert( _XString.endsWith( ostr, "ends", ostr.length - 4 ) === true, "检测endsWith接口定位搜索-3" );                     
                assert( _XString.endsWith( ostr, "ends", ostr.length - 3 ) === false, "检测endsWith接口定位搜索-4" );                     
                
            } )
        );

        //util_unit.subUnit( "XString" ).test();

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
        _XList.reduce = function reduce( list, callback, value, obj ){
            var 
                i = 0,
                l = list.length 
            ;
            if( arguments.length < 3 ){
                if( l === 0 ){
                    return false;
                }
                value = list[ i++ ];
            }

            for( ; i < l; i++ ){
                value = callback.call( obj, value, list[i], i, list );
            }
            return value;
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
         *  XList.shuffle( [ 1, 2, 3, 4, 5, 6, 7 ] );
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

        //为 XList 及其提供的方法 添加单元测试
        util_unit.append(
            new _UTest( "XList", function( assert ){
                assert( new _XList instanceof Array, "new _XList instanceof Array" );
                assert( _KeyWord.__instancelike__( _XList, _KeyWord.DATATYPE ), "检测XString是否为关键字" );
                assert( _XList.__instancelike__( new Array( 1, 2, 3 ) ) === true, '_XList.__instancelike__( new Array( 1, 2, 3 ) ) === true' );
                assert( _XList.__instancelike__( [ 1, 2, 3 ] ) === true, '_XList.__instancelike__( [ 1, 2, 3 ] ) === true' );
                assert( _XList.__instancelike__( {} ) === false, '_XList.__instancelike__( {} ) === false' );
                     
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "forEach", function( assert ){
                var 
                    list = [ 1, 2, 3 ],
                    t1   = null,
                    t2   = null,
                    t3   = null
                ;
                t1 = 0;
                t2 = "";
                _XList.forEach( list, function( value, key, list ){
                    t1 += value;
                    t2 += "" + key;
                    t3 = list;
                } );
                _XList.forEach( list, function( value, key, list ){
                    t3 = this;
                }, t3 );
                assert( t1 === 6 && t2 === "012" && t3 == list, "检测forEach是否能正确执行" );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "indexOf", function( assert ){
                var 
                    list = [ 1, 2, 3, 4, 5 ]
                ;
                assert( _XList.indexOf( list, 1 ) === 0, "_XList.indexOf( [" + list + "], 1 ) === 0" );
                assert( _XList.indexOf( list, 0 ) === -1, "_XList.indexOf( [" + list + "], 0 ) === -1" );
                assert( _XList.indexOf( list, 5 ) === 4, "_XList.indexOf( [" + list + "], 5 ) === 4" );
            } )
        );
        util_unit.subUnit( "XList" ).append(
            new _UTest( "lastIndexOf", function( assert ){
                var 
                    list = [ 1, 2, 3, 4, 5, 1, 2, 4, 5 ]
                ;
                assert( _XList.lastIndexOf( list, 1 ) === 5, "检测lastIndexOf是否正确执行-1" );
                assert( _XList.lastIndexOf( list, 0 ) === -1, "检测lastIndexOf是否正确执行-2" );
                assert( _XList.lastIndexOf( list, 5 ) === 8, "检测lastIndexOf是否正确执行-3" );
            } )
        );
        util_unit.subUnit( "XList" ).append(
            new _UTest( "unique", function( assert ){
                var 
                    o1   = {},
                    o2   = o1,
                    o3   = {},
                    a1   = [],
                    a2   = [],
                    a3   = [ a1, a2 ],
                    list = [ o1, o2, o3, a1, a2, a3, o1, o2, a3 ]

                ;
                list = _XList.unique( list );
                assert( list.length === 5, "检测XList.unique是否能正确执行" );
                assert( _XList.unique( [ 1, 2, 3, 4, 1, 2, 3, 2 ] ).toString() === "1,2,3,4", '_XList.unique( [ 1, 2, 3, 4, 1, 2, 3, 2 ] ).toString() === "1,2,3,4"' );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "xUnique", function( assert ){
                assert( _XList.xUnique( [ 1, 2, 1, 2, 3, 2, 1, 3, 1 ] ).toString() === "1,2,3", '_XList.xUnique( [ 1, 2, 1, 2, 3, 2, 1, 3, 1 ] ).toString() === "1,2,3"' );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "map", function( assert ){
                var 
                    list = [ 1, 2, 3 ],
                    t1   = null,
                    t2   = null,
                    t3   = null
                ;
                t1 = 0;
                t2 = "";
                t1  = _XList.map( list, function( value, key, list ){
                    t2 += "" + key;
                    t3 = list;
                    return value - 1;
                } ).join("");
                
                _XList.map( list, function( value, key, list ){
                    t3 = this;
                    return value;
                }, t3 );

                assert( t1 === "012" && t2 === "012" && t3 == list, "检测map是否能正确执行" );
            } ) 
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "filter", function( assert ){
                var 
                    list = [ 1, 2, 3 ],
                    t1   = null,
                    t2   = null,
                    t3   = null
                ;
                t1 = 0;
                t2 = "";
                t1  = _XList.filter( list, function( value, key, list ){
                    t2 += "" + key;
                    t3 = list;
                    return value % 2;
                } ).join("");
                
                _XList.filter( list, function( value, key, list ){
                    t3 = this;
                }, t3 );

                assert( t1 === "13" && t2 === "012" && t3 == list, "检测filter是否能正确执行" );
            } )
        ); 

        util_unit.subUnit( "XList" ).append(
            new _UTest( "reduce", function( assert ){
                var 
                    list = [ 1, 2, 3 ],
                    t1   = null,
                    t2   = null,
                    t3   = null
                ;
                t1 = 0;
                t2 = "";
                t1  = _XList.reduce( list, function( sum, value, key, list ){
                    t2 += "" + key;
                    t3 = list;
                    return sum + value;
                } );
                
                t1 += _XList.reduce( list, function( sum, value, key, list ){
                    t2 += "" + key;
                    t3 = list;
                    return sum - value;
                }, 10, t3 );
                assert( t1 === 10 && t2 === "12012" && t3 == list, "检测reduce是否能正确执行" );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "some", function( assert ){
                assert( _XList.some( [ 0, 0, 0 ], function( value ){ return !!value } ) === false, "检测some是否能正确执行-1" );
                assert( _XList.some( [ 0, 1, 0 ], function( value ){ return !!value } ) === true, "检测some是否能正确执行-2" );
                assert( _XList.some( [ 0, 1, 0 ], function( value ){ return value === this.a }, { a : 1 } ) === true, "检测some是否能正确执行-3" );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "every", function( assert ){
                assert( _XList.every( [ 0, 0, 0 ], function( value ){ return !!value } ) === false, "检测every是否能正确执行-1" );
                assert( _XList.every( [ 0, 1, 0 ], function( value ){ return !!value } ) === false, "检测every是否能正确执行-2" );
                assert( _XList.every( [ 1, 1, 1 ], function( value ){ return !!value } ) === true, "检测every是否能正确执行-3" );
                assert( _XList.every( [ 1, 1, 1 ], function( value ){ return value === this.a }, { a : 1 } ) === true, "检测every是否能正确执行-4" );
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "remove", function( assert ){
                assert( _XList.remove( [ 1, 1, 0, 0, 0, 1, 0 ], 0 ).join("") === "111", "检测remove是否能正确执行-1" );
                assert( _XList.remove( [ 0, 0, 0, 0 ], 0 ).join("") === "", "检测remove是否能正确执行-2" );
                assert( _XList.remove( [ 0, 0, 0, 0 ], 1 ).join("") === "0000", "检测remove是否能正确执行-3" );
                
            } )
        );

        util_unit.subUnit( "XList" ).append(
            new _UTest( "shuffle", function( assert ){
                assert( _XList.shuffle( [ 1, 2, 3, 4, 5, 6, 7 ] ) );
                var list = _XList.shuffle( [ 1, 2, 3, 4, 5, 6, 7 ] );
                var sum  = 0;
                for( var i = 1; i <= 7; i++ ){
                    _XList.remove( list, i );
                    sum += list.length;
                }
                
                assert( 
                    sum === _XList.reduce( [ 1, 2, 3, 4, 5, 6 ], function( a, b ){
                        return a + b
                    } ), 
                    "检测shuffle是否正确执行"
                )
            } )
        );

        //util_unit.subUnit( "XList" ).test();

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

        util_unit.append(
            new _UTest( "is", function( assert ){
                assert( _is( null ) === false, "_is( null ) === false" );
                assert( _is( Object, null ) === false, "_is( Object, null ) === false" );
                assert( _is( Object, {} ) === true, "_is( Object, {} ) === true" );
                assert( _is( String, "a" ) === true, '_is( String, "a" ) === true' );
                assert( _is( String, new String ) === true, '_is( String, new String ) === true' );
                function XString(){
                    return String.apply( null, arguments );
                };

                XString.__instancelike__ = function( obj ){
                    return typeof obj === "string" || obj instanceof String;
                };                                   

                assert( _is( XString, "xstring" ) === true, '_is( XString, "xstring" ) === true' );

                function XObject(){

                }

                XObject.__instancelike__ = function( obj, type ){
                    return obj !== null && obj !== undefined && ( type ? obj instanceof type : true )
                };
                assert( _is( XObject, null ) === false, "_is( XObject, null ) === false" );
                assert( _is( XObject, [] ) === true, "_is( XObject, [] ) === true" );
                assert( _is( XObject, [], Array ) === true, "_is( XObject, [], Array ) === true" );
            } )
        );

        //util_unit.test(); 
        gunit.append( util_unit );

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
            XFunction_unit    = new _UTest( "XFunction" ),
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

        XFunction_unit.append(
            new _UTest( "Nullable", function( assert ){
                assert( _is( _KeyWord, _Nullable, _KeyWord.PARAM_TYPE_MODIFIER ), "检测是否为关键字" );
                assert( _Nullable( String ), "检测是否能正确执行-1" );
                assert( _Nullable( String ) instanceof _Nullable, "检测是否能正确执行-2" );
                assert( _is( _Nullable, _Nullable( String ) ) , "检测是否能正确执行-3" );
                assert( _is( _Nullable( String ), null )  === true, "检测是否能正确执行-4" );
                assert( _is( _Nullable( String ), undefined ) === true, "检测是否能正确执行-5" );
                assert( _is( _Nullable( String ), 0 ) === false, "检测是否能正确执行-6" );
                assert( _is( _Nullable( String ), false ) === false, "检测是否能正确执行-7" );
                assert( _is( _Nullable( String ), "" ) === true, "检测是否能正确执行-8" );
                assert( _is( _Nullable( String ), "Hello" ) === true, "检测是否能正确执行-9" );
                assert( _is( _Nullable( String ), {} ) === false, "检测是否能正确执行-10" );
                console.log( _Nullable( String ).toString() );
            } )
        );
    
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
        
        XFunction_unit.append(
            new _UTest( "Optional", function( assert ){
                assert( _is( _KeyWord, _Optional, _Optional.PARAM_TYPE_MODIFIER ), "检测是否为关键字" );
                assert(  _Optional( String ), "检测是否能正确执行-1" );
                assert(  _Optional( String ) instanceof _Optional, "检测是否能正确执行-2" );
                assert(  _is( _Optional, _Optional( String ) ), "检测是否能正确执行-3" );
                assert(  _Optional( String ).type === String, "检测是否能正确执行-4" );
                assert(  _Optional( String ).value === "", "检测是否能正确执行-5" );
                assert(  _Optional( Object ).value , "检测是否能正确执行-6" );
                assert(  typeof _Optional( Number ).value  === "number", "检测是否能正确执行-7" );
                assert(  _Optional( Object, null ).value === null, "检测是否能正确执行-8" );
            } )
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

        XFunction_unit.append(
            new _UTest( "Params", function( assert ){
                assert( _is( _KeyWord, _Params, _KeyWord.PARAM_TYPE_MODIFIER ), "检测是否为关键字" );
                assert( _Params( String ), "检测是否能正确执行-1" );
                assert( _Params( String ) instanceof _Params, "检测是否能正确执行-2" );
                assert( _is( _Params, _Params( String ) ) , "检测是否能正确执行-3" );
                assert( _is( _Params( String ), [] )  === true, "检测是否能正确执行-4" );
                assert( _is( _Params( String ), [ "A", "B", "C" ] ) === true, "检测是否能正确执行-5" );
                assert( _is( _Params( String ), null ) === false, "检测是否能正确执行-6" );
                assert( _is( _Params( String ), "a" ) === false, "检测是否能正确执行-7" );
                console.log( _Params( String ).toString() );
            } )
        );

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

        XFunction_unit.append(
            new _UTest( "ParamTypeTable", function( assert ){
                var 
                    t1 = _ParamTypeTable(),
                    t2 = _ParamTypeTable( String, Number, Boolean ),
                    t3 = _ParamTypeTable( _Nullable( String ), Number, _Params( Boolean ) )
                ;
                assert( _is( _KeyWord, _ParamTypeTable, _KeyWord.SUBSIDIARY ), "检测是否为关键字" );
                assert( t1, "检测是否能正确执行-1" );
                assert( t1 instanceof _ParamTypeTable, "检测是否能正确执行-2" );
                assert( t1.minParamCount === 0, "检测是否能正确执行-3" );
                assert( t1.maxParamCount === 0, "检测是否能正确执行-4" );
                assert( t1.parse( [] ) instanceof Array, "检测是否能正确执行-5" );
                assert( t1.parse( [] ).length === 0, "检测是否能正确执行-6" );
                assert( t2, "检测是否能正确执行-7" );
                assert( t2.minParamCount === 3, "检测是否能正确执行-8" );
                assert( t2.maxParamCount === 3, "检测是否能正确执行-9" );
                assert( t2.parse( [] ) === null, "检测是否能正确执行-10" );
                assert( t2.parse( [] ) === null, "检测是否能正确执行-11" );
                assert( t2.parse( [ "", 0, true ] ), "检测是否能正确执行-12" );
                assert( t2.parse( [ "x", 0, true ] ).join( "" ) === "x0true", "检测是否能正确执行-13" );
                assert( t2.parse( [ null, 0, true ] ) === null, "检测是否能正确执行-013" );
                assert( t3.minParamCount === 2, "检测是否能正确执行-14" );
                assert( t3.maxParamCount === Infinity, "检测是否能正确执行-15" );
                assert( t3.parse( [ null, 0 ] ).length === 3, "检测是否能正确执行-16" );
                assert( t3.parse( [ null, 0, true ] ).length === 3, "检测是否能正确执行-17" );
                assert( t3.parse( [ "13", 0, true, false, false, true ] ).length === 3, "检测是否能正确执行-18" );
                assert( t3.parse( [ "13", 0, true, false, false, true ] ).join("") === "130true,false,false,true", "检测是否能正确执行-19" );
                assert( t3.parse( [ "13", 0, true, false, 0, true ] ) === null, "检测是否能正确执行-20" );
                assert( t3.equals( _Nullable( String ), Number, _Params( Boolean ) ) === true, "检测是否能正确执行-21" );
                assert( t3.equals( _ParamTypeTable( _Nullable( String ), Number, _Params( Boolean ) ) ) === true, "检测是否能正确执行-22" );
                assert( t3.equals( t3 ) === true, "检测是否能正确执行-23" );
                assert( t3.equals( t2 ) === false, "检测是否能正确执行-24" );
                console.log( t3.toString() );
                
                t1 = _ParamTypeTable( 
                    _Optional( String ), 
                    _Optional( Number ), 
                    Number, 
                    _Optional( Boolean ), 
                    String, 
                    _Optional( String ), 
                    String, 
                    _Params( Number ) 
                );
                assert( t1.parse( [ "A", 1, "B", "C", 1, 2, 3 ] ), "检测是否能正确执行-25" );
                assert( t1.parse( [ "A", 1, "B", 1, 2, 3 ] ) === null, "检测是否能正确执行-26" );
                console.log( t1.toString() );
            } )
        );
        
        //XFunction_unit.subUnit( "ParamTypeTable" ).test();

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
                                                    || "";
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
                    key  = args.toString();
                ;
                if( memoize.hasOwnProperty( key ) ){
                    return memoize[ key ];
                }else{
                    return memoize[ key ] = handler.apply( this, arguments );
                }
            };

        };

        XFunction_unit.append(
            new _UTest( "XFunction", function( assert ){
                var 
                    v  = 0,
                    f1 = _XFunction( function f1(){ v = 1 } ),
                    f2 = null
                ;
                assert( _is( _KeyWord, _XFunction, _KeyWord.DATATYPE ), "检测是否为关键字" );
                assert( _XFunction, "检测是否能正确执行-2" );
                assert( typeof f1 === "function", "检测是否能正确执行-3" );
                assert( (f1(), v) === 1, "检测是否能正确执行-4" );
                f1.define( Number, function(n){ v = n; } );
                assert( (f1(2), v) === 2, "检测是否能正确执行-5" );
                f1.define( Number, Number, function(n1, n2){ v = n1 * n2; } );
                assert( (f1(1,1), v) === 1, "检测是否能正确执行-6" );
                f1.define( _Params( Number ), function(ns){
                    v = _XList.reduce( ns, function( a, b ){
                        return a + b;
                    } );
                } );
                assert( (f1(1,1,1,5), v) === 8, "检测是否能正确执行-7" );
                assert( (f1(2,2), v) === 4, "检测是否能正确执行-8" );
                f2 = f1.clone();
                f2.define( Number, Number, function( n1, n2 ){ return v = Math.pow( n1, n2 ) } );
                assert( (f1(2,2), v) === 4, "检测是否能正确执行-9" );
                assert( (f2(), v) === 1, "检测是否能正确执行-10" );
                assert( (f2(2), v) === 2, "检测是否能正确执行-11" );
                assert( (f2(2,3), v) === 8, "检测是否能正确执行-12" );
                assert( f2(1,0) === 1, "检测是否能正确执行-13" );
                assert( f2.defined( Number, Number ) === true, "检测是否能正确执行-14" );
                assert( f2.defined( ) === true, "检测是否能正确执行-15" );
                assert( f2.defined( _ParamTypeTable() ) === true, "检测是否能正确执行-015" );
                assert( f2.defined( _ParamTypeTable( Number ) ) === true, "检测是否能正确执行-16" );
                assert( f2.defined( _ParamTypeTable( String ) ) === false, "检测是否能正确执行-17" );
                assert( f2.defined( Number, String ) === false, "检测是否能正确执行-18" );
                
                console.log( f1 );
                console.log( f2 );
                //assert( f1, "检测是否能正确执行-3" )
            } )
        );
        
        //XFunction_unit.subUnit( "XFunction" ).test();

        XFunction_unit.subUnit( "XFunction" ).append(
            new _UTest( "bind", function( assert ){
                var 
                    obj = {},
                    t1  = null,
                    t2  = null,
                    f1  = null
                ;
                f1 = _XFunction.bind( function(){
                    t1 = this;
                }, obj );
                f1();
                f1 = _XFunction.bind( function( A, B, c ){
                    t2 = A + B + c;
                    t1 = this;
                }, t1, 1, 2 );
                f1( 3 );
                assert( t1 === obj && t2 === 6, "检测bind是否能正确执行" );
            } )
        );

        XFunction_unit.subUnit( "XFunction" ).append(
            new _UTest( "memoize", function( assert ){
                var 
                    t1 = null,
                    f1 = null
                ;
                t1 = 0;
                f1 = _XFunction.memoize( function( n ){
                    t1 += n;
                } );

                f1( 1 );
                f1( 1 );
                f1( 1 );
                f1( 2 );
                f1( 2 );

                assert( t1 === 3, "检测memoize是否能被正确执行" );
            } )
        );

        gunit.append( XFunction_unit );
        //XFunction_unit.subUnit( "XFunction" ).test();
        //XFunction_unit.test();

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
            oop_unit  = new _UTest( "Oop" ),
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

        oop_unit.append(
            new _UTest( "Modiffier", function( assert ){
                assert( _is( _KeyWord, _Extends, _KeyWord.SUBSIDIARY ), "检测Extends是否为关键字" );
                assert( _is( _KeyWord, _Implements, _KeyWord.SUBSIDIARY ), "检测Implements是否为关键字" );
                assert( _Extends(), "检测是否能正确执行-1" );
                assert( _Extends(), "检测是否能正确执行-2" );
        
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
         //InterfaceImplement
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
                                    if (!( method[i] instanceof _ParamTypeTable )) {
                                        throw new TypeError( "无效的接口定义" );
                                    }
                                }
                                return;
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
        //InterfaceUnit
        oop_unit.append(
            new _UTest( "Interface", function( assert ){
                var 
                    A1 = _Interface( "A1", null, function( Static, Public ){

                    } ),

                    A2 = _Interface( "A2", null, function( Static, Public ){
                        Static.m1 = Function;
                        Public.m1 = _ParamTypeTable();
                        Public.m2 = [
                            _ParamTypeTable( ),
                            _ParamTypeTable( String ),
                            _ParamTypeTable( String, Boolean, String )
                        ];
                    } ),

                    A3 = _Interface( "A3", _Extends( A2 ), function( Static, Public ){
                        Static.m1 = _ParamTypeTable( Boolean );
                        Public.m2 = _ParamTypeTable( Boolean, String );
                    } ),
                    A4 = null,
                    v  = null
                ;
                assert( _is( _KeyWord, _Interface, _KeyWord.DATATYPE ), "检测是否为关键字" );
                assert( _Interface, "检测是否能正确执行-1" );
                assert( A1 instanceof _Interface, "检测是否能正确执行-2" );
                assert( A2 instanceof _Interface, "检测是否能正确执行-3" );
                assert( A2.__COX_INTERFACE_IMETHODS__.m1 instanceof Array, "检测是不能正确执行-4" );
                assert( A3 instanceof _Interface, "检测是否能正确执行-5" );
                
                try{
                    A4 = _Interface( "A4", null, function( Static, Public ){
                        Static.m1 = function(){}
                        Public.m1 = String;
                    } );
                }catch( e ){
                    v = Error;
                }

                assert( v === Error, "检测是否能正确执行-4" );
                
                try{
                    A4 = _Interface( "A4", _Extends( A1, A2, A3, Function ), function( Static, Public ){

                    } );
                }catch( e ){
                    v = TypeError;
                }
                
                assert( v === TypeError, "检测是否正确执行-5" );

                A4 = _Interface( "A4", _Extends( A1, A3 ), function( Static, Public ){
                    Static.m2 = _ParamTypeTable( Boolean );
                } );

                assert( A3.extended( A2 ), "检测是否能正确执行-6" );
                assert( !A3.extended( A1 ), "检测是否能正确执行-7" );
                assert( A4.extended( A1 ), "检测是否能正确执行-8" );
                assert( A4.extended( A3 ), "检测是否能正确执行-9" );
                assert( A4.extended( A2 ), "检测是否能正确执行-10" );
                assert( A1.implementIn( {} ), "检测是否能正确执行-11" );
                function T1(){

                }
                T1.m1 = _XFunction( Boolean, function(b){} );
                T1.m2 = _XFunction( Boolean, function(b){} );
                T1.prototype.m1 = _XFunction( function(){} );
                T1.prototype.m2 = _XFunction( function(){} );
                T1.prototype.m2.define( String, function( s ){} );
                T1.prototype.m2.define( Boolean, String, function( b, s ){} );
                T1.prototype.m2.define( String, Boolean, String, function( s1, b, s2 ){} );
                v = null;
                try{
                    A2.implementIn( {} )
                }catch( e ){
                    v = Error;
                }
                assert( v === Error, "检测是否能正确执行-12" );
                assert( A2.implementIn( T1 ), "检测是否能正确执行-13" );
                assert( A3.implementIn( new T1 ), "检测是否能正确执行-14" );
                assert( A4.implementIn( new T1 ), "检测是否能正确执行-15" );
                assert( _is( A4, new T1 ), "检测是否能正确执行-16" );
            } )
        );
        
        //oop_unit.subUnit( "Interface" ).test();

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
            newclass.prototype = proto;
            newclass.implementIn = function( obj ){
                return _Abstract.implementIn( newclass, obj );
            }
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
            
            newclass.prototype = proto;

            for( var i = 0, l = classinfo.IMPLEMENTS.length; i < l; i++ ){
                classinfo.IMPLEMENTS[i].implementIn( newclass );
            }

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
                constructor = function ()
                {
                    this.Super.apply(this, ["constructor"].concat(SLICE.call(arguments)));
                }
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
                    constructor = superinfo.CONSTRUCTOR.clone ? superinfo.CONSTRUCTOR.clone() : constructor;
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


        oop_unit.append(
            new _UTest( "Class.Entity", function( assert ){
                var 
                    C1 = _Class( "C1", _Entity, null, null, function C1( Static, Public ){
                        //..
                    } ),
                    C2 = _Class( "C2", _Entity, null, null, function C2( Static, Public ){
                        Static.P1 = 0;
                        Static.toString = function toString(){
                            return "C2";
                        };
                        Static.extended = function(){};
                        Public.constructor = _XFunction( function(){
                            Static.P1++;
                        } );
                        Public.toString = function toString(){
                            return "C2 Object[" + Static.P1 + "]";
                        };
                        Public.Super = function(){};
                    } )
                ;
                assert( C1, "检测是否能正确执行-1" );
                assert( C1 instanceof Function, "检测是否能正确执行-2" );
                assert( new C1 instanceof C1, "检测是否能正确执行-3" );
                assert( C2, "检测是否能正确执行-4" );
                assert( C2.P1 === 0, "检测是否能正确执行-5" );
                assert( new C2, "检测是否能正确执行-6" );
                assert( C2.P1 === 1, "检测是否能正确执行-7" );
                assert( new C2().toString !== BaseClass.prototype.toString, "检测是否能正确执行-8" );
                assert( C2.toString() === "C2", "检测是否能正确执行-9" );
                assert( C2.extended === BaseClass.extended, "检测是否能正确执行-10" );
                assert( C1.extended === BaseClass.extended, "检测是否能正确执行-11" );
                assert( new C2().Super === BaseClass.prototype.Super, "检测是否能正确执行-12" );
                assert( new C2 instanceof BaseClass, "检测是否能正确执行-13" );
                assert( new C2 instanceof _XObject, "检测是否能正确执行-14" );
                console.log( C1 );        
                console.log( new C1().toString() );
                console.log( C2 );
                console.log( new C2().toString() );
            } )
        );
        //oop_unit.subUnit( "Class.Entity" ).test();
        
        oop_unit.append(
            new _UTest( "Class.Abstract", function( assert ){
                var 
                    C1 = _Class( "C1", _Abstract, null, null, function C1( Static, Public ){
                        Static.m1 = Function;
                        Static.P1 = 0;
                        Public.constructor = _ParamTypeTable();
                    } ),
                    t  = null
                ;

                assert( C1, "检测是否能正确执行-1" );
                assert( C1 instanceof Function, "检测是否能正确执行-2" );
                try{
                    t = new C1();
                }catch( e ){
                    t = Error;
                }
                assert( t === Error, "检测是否能正确执行-3" );
                assert( !( "m1" in C1 ), "检测是否能正确执行-4" );
                assert( C1.P1 === 0, "检测是否能正确执行-5" );
                assert( C1.prototype.constructor === C1, "检测是否能正确执行-6" );
                console.log( C1 );
            } )
        );
        //oop_unit.subUnit( "Class.Abstract" ).test();
        
        oop_unit.append(
            new _UTest( "Class.Single", function( assert ){
                var 
                    C1 = _Class( "C1", _Single, null, null, function C1( Static, Public ){
                    } ),
                    C2 = _Class( "C2", _Single, null, null, function C2( Static, Public ){
                        Static.count = 0;
                        Public.constructor = function(){
                            Static.count++;
                        }
                    } ),
                    t  = null
                ;
                assert( C1, "检测是否能正确执行-1" );
                assert( t = new C1, "检测是否能正确执行-2" );
                assert( t === new C1, "检测是否能正确执行-3" );
                new C2;
                new C2;
                assert( new C2 instanceof C2, "检测是否能正确执行-4" );
                assert( C2.count === 1, "检测是否能正确执行-5" );
                console.log( C2 );
                console.log( new C2().toString() );
            } )
        );
        //oop_unit.subUnit( "Class.Single" ).test();

        oop_unit.append(
            new _UTest( "Class.Finaly", function( assert ){
                var 
                    C1 = _Class( "C1", _Finaly, null, null, function C1( Static, Public ){
                        
                    } ),
                    C2 = null,
                    t = null
                ;
                assert( C1, "检测是否能正确执行-1" );
                assert( C1 instanceof Function, "检测是否能正确执行-2" );
                assert( new C1 instanceof C1, "检测是否能正确执行-3" );
                assert( new C1 instanceof BaseClass, "检测是否能正确执行-4" );
                assert( new C1 instanceof _XObject, "检测是否能正确执行-5" );
                try{
                    C2 = _Class( "C2", _Entity, _Extends( C1 ), null, function C2( Static, Public ){

                    } );
                }catch( e ){
                    t = Error;
                }
                assert( t === Error, "检测是否能正确执行-6" );
            } )
        );
        //oop_unit.subUnit( "Class.Finaly" ).test();

        oop_unit.append(
            new _UTest( "Class.Extends", function( assert ){
                var 
                    t  = null,
                    C1 = _Class( "C1", _Entity, null, null, function C1( Static, Public ){
                        Static.p1 = -1;
                        Static.m1 = function(){
                            //- - 哎......
                            this.p1--;
                        };
                        Public.constructor = _XFunction( function(){
                            t = "C1";
                        } );
                    } ),
                    C2 = _Class( "C2", _Entity, _Extends( C1 ), null, function C2( Static, Public ){
                        
                        Public.constructor.define( function(){
                            this.Super( "constructor" );
                            t += "->C2";
                        } );

                        Public.m1 = function(){
                            this.Super( "m1" );
                        };
                    } ),
                    a = null
                ;
                assert( C1 instanceof Function, "检测是否能正确执行-1" );
                assert( C2 instanceof Function, "检测是否能正确执行-2" );
                assert( C1.extended( _XObject ), "检测是否能正确执行-3" );
                assert( C1.extended( BaseClass ), "检测是否能正确执行-4" );
                assert( C1.extended( C2 ) === false, "检测是否能正确执行-5" );
                assert( C2.extended( _XObject ), "检测是否能正确执行-6" );
                assert( C2.extended( BaseClass ), "检测是否能正确执行-7" );
                assert( C2.extended( C1 ), "检测是否能正确执行-8" );
                a = new C2();
                assert( a instanceof C2, "检测是否能正确执行-9" );
                assert( a instanceof C1, "检测是否能正确执行-10" );
                assert( a instanceof BaseClass, "检测是否能正确执行-11" );
                assert( a instanceof _XObject, "检测是否能正确执行-12" );
                assert( t === "C1->C2", "检测是否能正确执行-13" );
                C2.m1();
                assert( C2.p1 === -2, "检测是否能正确执行-14" );
                assert( C1.p1 === -1, "检测是否能正确执行-15" );
                try{
                    a.m1();
                }catch(e){
                    t = Error;
                }
                assert( t === Error, "检测是否能正确执行-16" );
                assert( a.instanceOf( C1 ), "检测是否能正确执行-17" );
                assert( a.instanceOf( C2 ), "检测是否能正确执行-18" );
                assert( a.instanceOf( BaseClass ), "检测是否能正确执行-19" );
                assert( a.instanceOf( Function ) === false, "检测是否能正确执行-20" );
            } )
        );

        //oop_unit.subUnit( "Class.Extends" ).test();

        oop_unit.append(
            new _UTest( "Class.Implements", function ( assert ){

                var 
                    IA1 = _Interface( "IA1", null, function IA1( Static, Public ){

                    } ),
                    IA2 = _Interface( "IA2", null, function IA2( Static, Public ){
                        Static.m1 = Function;
                        Public.constructor = _ParamTypeTable( Boolean );
                    } ),
                    IA3 = _Interface( "IA3", _Extends( IA1, IA2 ), function IA3( Static, Public ){
                        Public.constructor = [
                            _ParamTypeTable( String, Boolean ),
                            _ParamTypeTable( String, String, Boolean )
                        ];
                    } ),
                    IA4 = _Interface( "IA4", null, function IA4( Static, Public ){
                        Static.m1 = Function;
                        Public.constructor = _ParamTypeTable( Boolean );
                    } ),
                    C1 = _Class( "C1", _Entity, null, _Implements( IA1, IA3 ), function C1( Static, Public ){
                        Static.m1 = function(){};

                        Public.constructor = _XFunction( Boolean, function(){
                            //...
                        } );
                        Public.constructor.define( String, Boolean, function(){
                            //...
                        } );
                        Public.constructor.define( String, String, Boolean, function(){
                            //...
                        } );
                    } ),
                    t = null
                ;

                assert( C1 instanceof Function, "检测是否能正确执行-1" );
                assert( new C1( true ) instanceof C1, "检测是否能正确执行-2" );
                assert( new C1( "A", true ) instanceof C1, "检测是否能正确执行-3" );
                assert( new C1( "A", "B", true ) instanceof C1, "检测是否能正确执行-5" );
                try{
                    new C1();
                }catch( e ){
                    t = Error;
                }
                assert( t === Error, "检测是否能正确执行-6" );
                assert( C1.implemented( IA1 ), "检测是否能正确执行-7" );
                assert( C1.implemented( IA2 ), "检测是否能正确执行-8" );
                assert( C1.implemented( IA3 ), "检测是否能正确执行-9" );
                assert( IA1.implementIn( C1 ) , "检测是否能正确执行-10" );
                assert( IA2.implementIn( C1 ) , "检测是否能正确执行-11" );
                assert( IA3.implementIn( C1 ) , "检测是否能正确执行-12" );

                assert( C1.implemented( IA4 ) === false , "检测是否能正确执行-13" );
                assert( IA4.implementIn( C1 ) , "检测是否能正确执行-14" );
                assert( new C1( true ).instanceOf( IA1 ), "检测是否能正确执行-15" );
                assert( new C1( true ).instanceOf( IA2 ), "检测是否能正确执行-16" );
                assert( new C1( true ).instanceOf( IA3 ), "检测是否能正确执行-17" );
                assert( new C1( true ).instanceOf( IA4 ) === false, "检测是否能正确执行-17" );
            } )
        );
        //oop_unit.subUnit( "Class.Implements" ).test();

        oop_unit.append(
            new _UTest( "Class.multiple", function( assert ){
                var
                    I1 = _Interface( "I1", null, function I1( Static, Public ){
                        Public.m1 = _ParamTypeTable( String );
                    } ),
                    I2 = _Interface( "I2", null, function I2( Static, Public ){
                        Public.constructor = _ParamTypeTable();
                        Public.m1 = _ParamTypeTable( Boolean, String );
                    } ),
                    AC1 = _Class( "AC1", _Abstract, null, _Implements( I2 ), function AC1( Static, Public ){
                        Public.constructor = _ParamTypeTable( String );
                        Public.m1 = _XFunction( String, function( v ){
                            return v;
                        } );
                    } ),
                    AC2 = _Class( "AC2", _Abstract, _Extends( AC1 ), null, function AC2( Static, Public ){
                        Public.constructor = _ParamTypeTable( String, Static );
                    } ),
                    C1 = _Class( "C1", _Entity, _Extends( AC2 ), _Implements( I1, I2 ), function C1( Staitc, Public ){
                        Public.constructor = _XFunction( function(){} );
                        Public.constructor.define( String, function(){} );
                        Public.constructor.define( String, AC2, function(){} );
                        Public.m1.define( Boolean, String, function(){} );
                    } ),
                    C2 = null,
                    t  = null
                ;

                assert( C1 instanceof Function, "检测是否正确执行-1" );
                assert( C1.implemented( I1 ), "检测是否能正确执行-2" );
                assert( C1.implemented( I2 ), "检测是否能正确执行-3" );
                assert( C1.implemented( AC1 ), "检测是否能正确执行-4" );
                assert( C1.implemented( AC2 ), "检测是否能正确执行-5" );
                assert( C1.extended( AC1 ), "检测是否能正确执行-6" );
                assert( C1.extended( AC2 ), "检测是否能正确执行-7" );
                assert( new C1 instanceof C1, "检测是否能正确执行-8" );
                assert( new C1( "A" ) instanceof C1, "检测是否能正确执行-9" );
                assert( new C1( "A", new C1 ) instanceof AC1, "检测是否能正确执行-10" );
                assert( new C1().m1( "A" ) === "A", "检测是否能正确执行-11" );
                assert( new C1().m1( true, "A" ) === undefined, "检测是否能正确执行-12" );
                try{
                    C2 = _Class( "C2", _Entity, _Extends( C1 ), null, function C2( Staitc, Public ){
                        Public.constructor = function(){}
                    } )
                }catch( e ){
                    t = Error;
                }

                assert( t === Error, "检测是否能正确执行-13" );
            } )
        );
        //oop_unit.subUnit( "Class.multiple" ).test();
        gunit.append( oop_unit );
        //oop_unit.test();
    }();

    
    void function __IMPLEMENT_TOOLS__(){
        var 
            tools_unit         = new _UTest( "Tools" ),
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
            Public.cancle = function(){
                this._processing.length = 0;
            };

        } );
        
        tools_unit.append(
            new _UTest( "EventListener", function( assert ){
                var 
                    e1 = new _EventListener( "e1", {} ),
                    t = 0
                ;

                e1.add( function(){
                    t = 1;
                } );
                e1.add( function(){
                    t += 1;
                } );
                e1.add( function( v ){
                    t -= v
                } );
                function f1(){
                    t = 1000000;
                }
                e1.add( f1 );
                e1.remove( f1 );
                assert( e1 instanceof _EventListener, "检测是否能正确执行-1" );
                e1.notify( [1], null );
                assert( t === 1, "检测是否能正确执行-2" );
                e1.notify( [2], null );
                assert( t === 0, "检测是否能正确执行-3" );
                e1.remove();
                e1.notify( [10000], null );
                assert( t === 0, "检测是否能正确执行-4" );
            } )
        );
        
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
                this.listener.cancle();
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
        
        tools_unit.append(
            new _UTest( "EventSource", function( assert ){
                var 
                    obj = new _EventSource(),
                    t   = 0
                ;

                obj.dispatchEvent(
                    new _Event( "e1" ),
                    new _Event( "e2" ),
                    new _Event( "e3" )
                );
                obj.addEventListener( "e1", function(){
                    t = 0;
                } );
                obj.value = 0;
                obj.on( "e1", function(){
                    t++;
                } );
                obj.on( "e2", function(v){
                    t+=v;
                } );
                function f1(){
                    t = this.value;
                }
                obj.on( "e3", f1 );

                obj.fireEvent( "e1" );
                assert( obj instanceof _EventSource, "检测是否能正确执行-1" );
                assert( t === 1, "检测是否能正确执行-2" );
                obj.fireEvent( "e2", [1] );
                assert( t === 2, "检测是否能正确执行-3" );
                obj.fireEvent( "e3" );
                assert( t === 0, "检测是否能正确执行-4" );
                obj.fireEvent( "e3", [] );
                assert( t === 0, "检测是否能正确执行-5" );
                obj.fireEvent( "e3", [], {value:10} );
                assert( t === 10, "检测是否能正确执行-6" );
                obj.fireEvent( "e3", {value:10} );
                assert( t === 10, "检测是否能正确执行-7" );
                obj.removeEventListener( "e3", f1 );
                obj.fireEvent( "e3" );
                assert( t === 10, "检测是否能正确执行-8" );
                obj.un( "e1" );
                obj.fireEvent( "e1" );
                assert( t === 10, "检测是否能正确执行-9" );
                obj.addOnceEventListener( "e1", function(){
                    t += 10;
                } );
                obj.fireEvent( "e1" );
                assert( t === 20, "检测是否能正确执行-10" );
                obj.fireEvent( "e1" );
                assert( t === 20, "检测是否能正确执行-11" );
                obj.un( "e1" );
                t = 0;
                obj.on( "e1", function(){
                    t = 1;
                } );
                obj.on( "e1", function(){
                    t += 1;
                } );
                function f2(){
                    t = 10000;
                }
                obj.on( "e1", function(){
                    t += 1;
                    obj.un( "e1", f2 );
                } );
                obj.on( "e1", f2 );

                obj.on( "e1", function(){
                    t += 1;
                    obj.getEvent("e1").stopPropagation();
                } );
                obj.on( "e1", function(){
                    t = -1;
                } );
                obj.on( "e1", function(){
                    t = -1;
                } );
                obj.fireEvent( "e1" );
                assert( t === 4, "检测是否能正确执行-12" );
            } )
        );

        //tools_unit.subUnit( "EventSource" ).test();

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
                    _this.fireEvent( "done", [ false, _this._value, error ] );
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
             * @param { Params(Function) } callbacks
             *  回调函数中参数说明
             *  @param {Boolean} 异步判断执行成功状态
             *  @param {Object} 数据
             *  @param {Function} 结束按钮
             *  @param {Boolean} 错误标记
             */
            Public.done = _XFunction(
                _Params(Function), function(callbacks)
                {
                    var 
                        _this = this,
                        event = this.getEvent("done"),
                        stop  = false
                    ;

                    if (this._state === DSTATE_UNFULFILLED) {
                        this.addOnceEventListener("done", callback);
                    } else {
                        callback(this._state === DSTATE_FULFILLED , this._value, this._error);
                    }
                    function callback(state, value, error)
                    {
                        _XList.forEach(callbacks, function(callback)
                        {
                            callback.call(_this, state, value, end, error);
                            return !stop;
                        });
                    }
                    function end()
                    {
                        stop = true;
                        event.stopPropagation();
                    };
                }
            );


            /**
             * @method resolved 延迟操作被接受（操作完成）
             * @param { Object } value
             */
            Public.resolved = function( value ){
                var 
                    _this = this,
                    event = this.getEvent("resolved")
                ;
                if( this._state !== DSTATE_UNFULFILLED ){
                    throw new Error( "非法操作:" );
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
                            event.stopPropagation();
                        }
                    ]
                );
                
                !this._error && this.fireEvent( "done", [ true, value ] );
            };

            /**
             * @method rejected 延迟操作被拒绝（操作失败）
             * @param { Object } value
             */
            Public.rejected = function( value ){
                if( this._state !== DSTATE_UNFULFILLED ){
                    if( value instanceof Error ){
                        throw value;
                    }else{
                        throw new Error( "非法操作" );
                    }
                }

                this._state = DSTATE_REJECTED;
                this._value = value;

                this.fireEvent( "stateChange", [ DSTATE_REJECTED ] );
                this.fireEvent( "rejected", [ value ] );
                this.fireEvent( "done", [ false, value ] );
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
        
        tools_unit.append(
            new _UTest( "Deferred", function( assert ){
                var 
                    d1 = new _Deferred(),
                    t  = [],
                    t2 = null
                ;
                assert( d1 instanceof _Deferred, "检测是否能正确执行-1" );
                assert( d1 instanceof _EventSource, "检测是否能正确执行-2" );
                d1.then( function( v ){
                    t.push( 1 );
                } );
                
                d1.then( function( v ){
                    t.push( 2 );
                } );
                d1.done( function( v ){
                    t.push( 3 );
                } );
                d1.resolved( 10 );
                d1.then( function( v ){
                    t.push( 4 );
                } );
                d1.done( function( v ){
                    t.push( 5 );
                } );
                assert( t.join("") === "12345", "检测是否能正确执行-3" );

                t.length = 0;
                d1 = new _Deferred();
                d1.then( function( v ){
                    t.push( 1 );
                } );
                d1.then( function( v, error, end ){
                    t.push( 2 );
                    end();
                } );
                d1.then( function( v ){
                    t.push( 3 );
                } );

                d1.then( function( v ){
                    t.push( 4 );
                } );
                d1.done( function( v ){
                    t.push( 5 );
                } );
                d1.resolved( 10 );
                assert( t.join("") === "125", "检测是否能正确执行-4" );
                assert( d1.isDone() === true, "检测是否能正确执行-5" );
                assert( d1.getValue() === 10, "检测是否能正确执行-6" );
                assert( d1.isResolved() === true, "检测是否能正确执行-7" );
                assert( d1.isRejected() === false, "检测是否能正确执行-8" );

                d1 = new _Deferred();
                t = 5;
                d1.then(
                    function(){}, function(){ t--; }
                );
                d1.then(
                    function(){}, function(){ t-= 2; }
                );
                d1.then(
                    function(){}, function(){ t-= 2; }
                );
                d1.done( function( v ){
                    t++;
                } );

                d1.rejected( 1 );
                assert( t === 1, "检测是否能正确执行-9" );

                d1 = new _Deferred();
                t  = 0;
                t2 = 0;
                d1.done(
                    function()
                    {
                        t2++;
                    },
                    function()
                    {
                        t2++;
                    }
                );
                
                d1.then(
                    function( v, error, end ){
                        error( "error" );
                    }
                );
                d1.then(
                    function( v, error, end ){
                        t = 10;
                    },
                    function( v, error ){
                        if( error ){
                            t += 5;
                        }
                    }
                );
                d1.then(
                    function(){
                        t += 5;
                    },
                    function( v ){
                        t -= v;
                    }
                );
                d1.done( function( o, v ){
                    t += v;
                } );
                d1.done(
                    function(a, b, e)
                    {
                        t2++;
                        e();
                    },
                    function()
                    {
                        t2++;
                    }
                );
                d1.resolved( 10 );
                assert( t === 5, "检测是否能正确执行-10" );
                assert(t2 === 3, "检测是否能正确执行-11");
            } )
        );
        //tools_unit.subUnit( "Deferred" ).test();

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
                        if( _this._rejected_list.length === 0 ){
                            _this._state = DSTATE_FULFILLED;
                            _this.getValue();
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
                            !_this._error && _this.fireEvent( "done", [ true, _this._value ] );
                        }else{
                            _this._state = DSTATE_REJECTED;
                            _this.getValue();
                            _this.fireEvent( "stateChange", [ DSTATE_REJECTED ] );
                            _this.fireEvent( "rejected", [ _this._value ] );
                            _this.fireEvent( "done", [ false, _this._value ] );
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
        
        tools_unit.append(
            new _UTest( "DeferredList", function( assert ){
                var 
                    d1 = new _Deferred(),
                    d2 = new _Deferred(),
                    d3 = new _Deferred(),
                    ds = new _DeferredList( d1, d2, d3 ),
                    t  = 0
                ;

                d1.then( function(){ t++; }, function(){ t-- } );
                d2.then( function(){ t+=2; }, function(){ t-=2 } );
                d3.then( function(){ t+=3; }, function(){ t-=3 } );
                ds.done( function(){
                    t += 10;
                } );
                ds.resolved(10);
                assert( t === 16, "检测是否能正确执行-1" );
                assert( ds.getValue().join("") === "101010", "检测是否能正确执行-2" );
                
                d1 = new _Deferred();
                d2 = new _Deferred();
                d3 = new _Deferred();
                t  = 0;
                d1.then( function(){ t++; }, function(){ t-- } );
                d2.then( function(){ t+=2; }, function(){ t-=2 } );
                d3.then( function(){ t+=3; }, function(){ t-=3 } );
                ds.done( function(){
                    t += 10;
                } );
                ds = new _DeferredList( d1, d2, d3 );
                ds.rejected( 10 );
                assert( t === 4, "检测是否能正确执行-3" );

                d1 = new _Deferred();
                d2 = new _Deferred();
                d3 = new _Deferred();
                t  = 0;
                d1.then( function(){ t++; }, function(){ t-- } );
                d2.then( function( v, error ){ error("err") }, function(){ t-=2 } );
                d3.then( function(){ t+=3; }, function(){ t-=3 } );
                ds.done( function(){
                    t += 10;
                } );
                ds = new _DeferredList( d1, d2, d3 );
                ds.resolved( 10 );
                assert( t === 12, "检测是否能正确执行-4" );
                d1 = new _Deferred();
                d2 = new _Deferred();
                d3 = new _Deferred();
                t  = 0;
                d1.then( function( v ){ t += v; }, function(){ } );
                d2.then( function( v ){ t += v; }, function(){ } );
                d3.then( function( v ){ t += v; }, function(){ } );
                ds = new _DeferredList( d1, d2, d3 );
                ds.then( function(){
                    t++;
                } );
                ds.then( function( v, error, end ){
                    end();
                } );
                ds.then( function( v ){
                    t = 0;
                } );
                ds.done( function(){
                    t++;
                } );
                d1.resolved( 1 );
                d2.resolved( 2 );
                d3.resolved( 3 );
                assert( t === 8, "检测是否能正确执行-5" );
                d1 = new _Deferred();
                d2 = new _Deferred();
                d3 = new _Deferred();
                t  = 0;
                d1.then( function( v ){ t += v; }, function(){ } );
                d2.then( function( v ){ t += v; }, function(){ } );
                d3.then( function( v ){ t += v; }, function(){ } );
                ds = new _DeferredList( d1, d2, d3 );
                ds.then( 
                    function(){t++;},
                    function(){t--;}
                );
                ds.then( function( v, error, end ){
                    end();
                } );
                ds.then( 
                    function(){ t = 0; },
                    function(){ t-- }
                );
                ds.done( function(){
                    t++;
                } );
                d1.resolved( 1 );
                d2.rejected( 2 );
                d3.resolved( 3 );
                assert( t === 3, "检测是否能正确执行-6" );
                d1 = new _Deferred();
                d2 = new _Deferred();
                d3 = new _Deferred();
                t  = 0;
                d1.then( function( v ){ t += v; }, function(){ } );
                d2.then( function( v ){ t += v; }, function(){ } );
                d3.then( function( v ){ t += v; }, function(){ } );
                ds = new _DeferredList( d1, d2, d3 );
                ds.then( 
                    function(){ t++; },
                    function(){ t--; }
                );
                ds.then( function( v, error, end ){
                    error("error")
                } );
                ds.then( 
                    function(){ t = 0; },
                    function(){ t-- }
                );
                ds.done( 
                    function(s, v, e)
                    {
                        t++;
                        e();
                    }, 
                    function()
                    {
                        t++;
                    }
                );
                d1.resolved( 1 );
                d2.resolved( 2 );
                d3.resolved( 3 );
                assert( t === 6, "检测是否能正确执行-6" );
            } )
        );

        //tools_unit.subUnit( "DeferredList" ).test();

        gunit.append( tools_unit );
        //tools_unit.test();
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
            RE_ROOT_PATH_SEP   = /\s*;\s*/,
            RE_KV_SEP          = /\s*=\s*/,
            REL                = null,
            LOCA_URL           = null,
            LOCA_PROTOCOL      = null,
            LOCA_ROOT          = null,
            MODULE_FILE_EXT    = null,
            MODULE_ROOT        = null,
            //state
            //local
            Module             = null,
            ModuleCenter       = null,
            config             = {
                debug       : false,
                roots       : {}
            },
            amd_unit = null,
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
            root  = path.charAt(0) === "/" ? "/" : "";
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
            return root + path.join("/");
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
        config.roots[ "~/" ] = MODULE_ROOT;
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
                module.__define = define;
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
                function(){
                    //浏览器
                    var 
                        DOC       = document,
                        docReady  = new _Deferred()
                    ;
                    
                    function load( module ){
                        var 
                            loader   = document.createElement( "script" ),
                            url      = module.url
                        ;

                        if( !url ){
                            return ;
                        }

                        if( loader.addEventListener ){
                            loader.addEventListener( "load", loaded, false );
                            loader.addEventListener( "error", loadfail, false );
                        }else{
                            loader.attachEvent( "onreadystatechange", loaded );
                        }

                        loader.setAttribute( "type"   , "text/javascript" );
                        loader.setAttribute( "charset", "utf-8"  );
                        loader.setAttribute( "async"  , "true" );
                        loader.setAttribute( "defer"  , "true" );
                        loader.setAttribute( "src"    , url );

                        REL.firstChild.insertBefore( loader, null );

                        function loaded(){ 
                            if( loader.addEventListener 
                             || loader.readyState === "loaded" 
                             || loader.readyState === "complete" 
                            ){
                                delete loading_modules[ module.id ];
                                loaded_modules[ module.id ] = module;
                                if( !module.loaded.isDone() ){
                                    //console.log( module );
                                    module.loaded.resolved();
                                    module.resolved();
                                }

                                if( loader.removeEventListener ){
                                    loader.removeEventListener( "load", loaded, false );
                                    loader.removeEventListener( "error", loaded, false );
                                }else{
                                    loader.detachEvent( "onreadystatechange", loaded );
                                }
                            }
                        }

                        function loadfail(){
                            delete loading_modules[ module.id ];

                            if( loader.removeEventListener ){
                                loader.removeEventListener( "load", loaded, false );
                                loader.removeEventListener( "error", loadfail, false );
                            }else{
                                loader.detachEvent( "onreadystatechange", loaded );
                                loader.detachEvent( "error", loadfail );
                            }

                            module.loaded.rejected();
                        }                
                    }

                    //安全起见，让所有需要加载的模块在等到浏览器文档加载完毕时在加载
                    if( DOC.addEventListener ){
                        DOC.addEventListener( "DOMContentLoaded", function(){
                            DOC.removeEventListener( "DOMContentLoaded", arguments.callee, false );
                            docReady.resolved();
                        }, false );
                    }else{
                        DOC.attachEvent( "onreadystatechange", function(){
                            if( /^c/.test( DOC.readyState ) ){
                                DOC.detachEvent( "onreadystatechange", arguments.callee );
                                docReady.resolved();
                            }
                        } );
                    }

                    return function( module ){
                        docReady.then( function(){
                            load( module );
                        } );
                    };
                }(),
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
                        dmodules = dmodule.depend && dmodule.depend.modules,
                        pmodules = []
                    ;
                    //将每一个依赖模块的依赖模块关联到指定模块上
                    dmodules && _XObject.forEach( dmodules, true, function( dm, id ){
                        dm             = ModuleCenter.getModule( dm.id ) || dm;
                        dmodules[ id ] = dm;
                        id             = dm.id;
                        if( id !== module.id
                         && !( pending.list[ id ] instanceof Module )
                        ){
                            pending.list[ id ] = dm;
                            pending.length++;
                            pmodules.push( dm );
                        }
                    } );

                    pmodules.length && _XList.forEach( pmodules, function( pm ){
                        pm.loaded.then(
                            function(){
                                pending.length--;
                                link( module, pm, pending );
                            },
                            function( value ){
                                module.rejected( value );
                            }
                        );
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

                    module.done( function(){
                        delete pending_modules[ module.uid ];
                    } );

                    //加载需要被加载的依赖模块
                    if( module.depend && module.depend.modules ){
                        _XObject.forEach( module.depend.modules, true, function( dmodule, id ){

                            if( ModuleCenter.exists( dmodule ) ){
                                module.depend.modules[ id ] = dmodule =  ModuleCenter.getModule( dmodule.id );
                            }else{
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
                            }
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

        _Modules.getRoot = function( alias ){
            return config.roots[ "~/" + ( alias || "" ) ] || null;
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
                            return cmodulename.test( stdSep( id ) ) && !module.loaded;
                        } );

                        if( newmodule ){
                            var root = dirname( newmodule.filename );
                            if( depend ){
                                //depend.setRoot( root );
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
                return main;
            }
        );

        if (isBrowser) {
            var scripts     = GLOBAL.document.getElementsByTagName("SCRIPT");
            _XList.forEach(scripts, function(item)
            {
                var paths = item.getAttribute("cox-path");
                if (paths !== null) {
                    var item = null; 
                    paths = _XString.trim(paths).split(RE_ROOT_PATH_SEP);
                    while (item = paths.shift()) {
                        kv = item.split(RE_KV_SEP);
                        if (kv.length === 1) {
                            _Modules.addRoot("", kv[0]);
                        } else {
                            _Modules.addRoot(kv[0], kv[1]);
                        }
                    }
                    return false;
                }
            });
        }

        amd_unit = new _UTest(
            "AMD", function( assert, deferred, next ){
                var t = 0;
                deferred();
                _Use( _Modules( [ "./A", "./B" ] ), "", function( require ){
                    assert( require( "A" ), "检测是否能正确执行-1" );
                    assert( require( "A" ).name === "A", "检测是否能正确执行-2" );
                    assert( require( "B" ), "检测是否能正确执行-3" );
                    assert( require( "B" ).name === "B", "检测是否能正确执行-4" );
                    next();
                } );
            }
        );
        gunit.append( amd_unit );
        //amd_unit.test();
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
    GLOBAL.Finaly         = Cox.Finaly         = _Finaly;
    GLOBAL.XFunction      = Cox.XFunction      = _XFunction;
    GLOBAL.UTest          = Cox.UTest          = _UTest;
    GLOBAL.Deferred       = Cox.Deferred       = _Deferred;
    GLOBAL.DeferredList   = Cox.DeferredList   = _DeferredList;
    
    GLOBAL.forEach = Cox.forEach = _XFunction(
        Array, Function, _Optional( Object ), _XList.forEach
    );

    GLOBAL.Iterator = Cox.Iterator = _Interface( "Iterator", null, function( Static, Public ){
        Public.hasNext  = Function;
        Public.next     = Function;
        Public.reset    = Function;
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

    GLOBAL.Use = Cox.Use = _XFunction( _Modules, _Optional( String ), Function, _Use );
    GLOBAL.Use.define(Array, Function, function(moduleIds, callback)
    {
        return _Use(_Modules(moduleIds), "", callback);
    });
    GLOBAL.Use.define(String, Function, function(moduleId, callback){
        return _Use(_Modules([moduleId]), "", callback);
    });

    GLOBAL.Depend     = Cox.Modules;

    Cox.Event         = _Event;
    Cox.EventListener = _EventListener;
    Cox.EventSource   = _EventSource;
    Cox.PlainObject   = _PlainObject;    
    Cox.ownDocument   = GLOBAL.document;
    Cox.ownWindow     = GLOBAL;
    _XObject.mix( GLOBAL.Modules, _Modules, true ); 
    
    typeof exports !== "undefined" && ( module.exports = Cox );

    //gunit.test( true );
}();

/*
Modules.route({
    "~" : "abc",
    "~/Cox" : "/js/libs/Cox/modules/",
    "jQuery" : function(){
        return typeof jQuery !== "undefined" ? jQuery : "~/Cox/Extends/jQuery";
    }
});*/
