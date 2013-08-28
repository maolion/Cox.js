/**
 * #${project}
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
 * ####Cox.js 框架基础模块
 * 
 * 基础模块主要实现的功能模块
 * -   函数重载
 * -   实现面向对象设计的一套工具
 * -   模块管理
 * -   一些实用的工具(函数)集
 * -   单元测试工具(只存在在debug版本里)
 * -   ...
 * ----------------------------------------------------------------------------
 *
 * -   Date ${MDATE}
 * -   Version ${version} 
 * -   Author ${author}
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
            Cox                   = { VERSION : "1.0.0" },
            newObject             = null,
            gunit                 = null,
            //主要功能模块（对外接口）
            _UTest                = null,
            _KeyWord              = null,
            _XObject              = null,
            _XFunction            = null,
            _XString              = null,
            _XList                = null,
            _XNumber              = null,
            _PlainObject          = null,
            _Null                 = null,
            _Type                 = null,
            _Util                 = null,
            _is                   = null,
            _Limit                = null,
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
            };

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
            _XObject = _KeyWord( "XObject", _KeyWord.DATATYPE, function XObject(){
                //...
            } );

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
                        test = null
                    ;

                    obj = { toString : "123" };

                    _XObject.forEach( obj, true, function( v ){
                        test = v;
                    } );
                    assert( test === "123", "检测是否能枚举遍历对象成员列表" );

                    obj = function(){
                        this.toString = 222;
                    }
                    obj.prototype.valueOf = 111;

                    test = 0;
                    _XObject.forEach( new obj, false, function( v, key ){
                        test += v;
                    } );
                    assert( test === 333, "检测是否能枚举对象原型链中的成员列表" );
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

                if ( obj && type === Object ){
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
                ParamTypeModifier = null
            ;


            //参数类型修饰符通用接口
            ParamTypeModifier = {
                toString : function toString(){
                    return this.__COX_MODIFIER_SIGN__;
                },
                equals   : function equals( obj ){
                    return obj === this;
                }
            };


            //参数参数类型修饰符

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

                    this.__COX_MODIFIER_SIGN__ = "Optional " + (
                        ( type.name || type.__COX_SIGN__ || type.toString() )
                    );
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
             * @param { Type } type 类弄
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
                }, ParamTypeModifier )
            );

            XFunction_unit.append(
                new _UTest( "Params", function( assert ){
                    assert( _is( _KeyWord, _Params, _Optional.PARAM_TYPE_MODIFIER ), "检测是否为关键字" );
                    assert( _Params( String ), "检测是否能正确执行-1" );
                    assert( _Params( String ) instanceof _Params, "检测是否能正确执行-2" );
                    assert( _is( _Params, _Params( String ) ) , "检测是否能正确执行-3" );
                } )
            );

            _ParamTypeTable = _KeyWord( 
                "ParamTypeTable", _KeyWord.SUBSIDIARY, 
                ObjectFactory( function(){
                    var 
                        types        = SLICE.call( arguments ),
                        types_length = types.length,
                        opt_indexs   = [],
                        gen_indexs   = []
                    ;   
                    
                    this.types              = [];
                    this.typesIndexs        = null;
                    this.minParamCount      = 0;
                    this.maxParamCount      = 0;
                    this.optionalParamCount = 0;
                    this.generalParamCount  = 0;

                    for( var i = 0; i < types_length; i++ ){
                        var type = types[ i ];

                        if( !_is( _Type, type ) 
                         && !( type instanceof _Optional || type instanceof _Params ) 
                        ){
                            throw new TypeError(
                                "参数列表中存在无效的参数类型定义"
                            );
                        }
                        
                        //参数类型被确定
                        this.types.push( type );

                        switch( type.constructor ){
                            case _Params:
                                //Params修饰符只被允许出现在参数类型列表中的最后位置
                                if( types_length - i !== 1 ){
                                    throw new Error(
                                        "Params操作符被不正确使用"
                                    );
                                }
                                //可变参数属于一个不受限制个数的同类型元素项的序列
                                this.maxParamCount =  Infinity;
                            continue;
                            case _Optional:
                                opt_indexs.push( [ i - this.optionalParamCount, i ] );
                                this.optionalParamCount++;
                            break;
                            default: 
                                //统计最小需要的实参数量
                                this.minParamCount++; 
                                this.generalParamCount++;
                                gen_indexs.push( [ i - this.optionalParamCount, i ] );
                            break;
                        }

                        this.maxParamCount++;
                    }
                    this.typesIndexs = gen_indexs.concat( opt_indexs );
                    //普通参数类型拥有优先级然后是可先参数最后是可变参数
                } ) 
            );
            
            
            _ParamTypeTable.prototype.parse = function parse( params ){
                var 
                    selected        = { length : 0 },
                    params          = SLICE.call( params ),
                    param_count     = params.length,
                    current_arg     = null,
                    indexs          = null,
                    types           = this.types,
                    types_indexs    = this.typesIndexs.slice(),
                    min_param_count = this.minParamCount,
                    max_param_count = this.maxParamCount
                ;

                //检测参数数量是否能达到要求
                if( param_count < min_param_count
                 || param_count > max_param_count 
                ){
                    return null;
                }

                //空参数类型列表
                if( types.length === 0 ){
                    return [];
                }
                while( indexs = types_indexs.shift() ){
                    var 
                        s_index = indexs[0],
                        e_index = indexs[1],
                        type    = types[ indexs[1] ],
                        otype   = type instanceof _Optional ? type.type : type,
                        finded  = false
                    ;

                    for( var i = e_index; i >= s_index; i-- ){
                        var value = params[ i ];

                        if( !( i in params ) 
                         || value === selected 
                         || !_is( otype, value )
                        ){
                            continue;
                        }

                        selected[ e_index ] = value;
                        params[ i ]         = selected;
                        finded              = true;
                        selected.length++;
                        break;
                    }
                    if( !finded ){
                        if( type instanceof _Optional ){
                            selected[ e_index ] = type.value;
                            selected.length++;
                            continue;
                        }
                        //未找到与形参匹配的实参
                        return null;
                    }
                }
                return SLICE.call( selected );
            };


            XFunction_unit.append(
                new _UTest( "ParamTypeTable", function( assert ){
                    var 
                        a = _ParamTypeTable(
                            String, 
                            _Optional( String ), 
                            _Optional( String ),
                            Number,
                            _Optional( Number ),
                            _Optional( Number ),
                            _Optional( String ),
                            String,
                            _Params( Boolean )
                        ),
                        b = _ParamTypeTable(),
                        c = _ParamTypeTable( String, String, Number ),
                        e = _ParamTypeTable(
                            String, 
                            _Optional( String ), 
                            _Optional( String ),
                            Number,
                            _Optional( Number ),
                            _Optional( Number ),
                            String
                        )
                    ;
                    assert( a instanceof _ParamTypeTable, "检测是否能被正确执行-1" );
                    assert( a.types.length === 9, "检测是否能被正确执行-2" );
                    assert( a.generalParamCount === 3, "检测是否能被正确执行-3" );
                    assert( a.optionalParamCount === 5, "检测是否能被正确执行-4" );
                    assert( a.minParamCount === 3, "检测是否能被正确执行-5" );
                    assert( a.maxParamCount === Infinity, "检测是否能被正确执行-6" );
                    assert( a.typesIndexs[0].join("") === "00", "检测是否能被正确执行-7" );
                    assert( a.typesIndexs[1].join("") === "13", "检测是否能被正确执行-8" );
                    assert( a.typesIndexs[2].join("") === "27", "检测是否能被正确执行-9" );
                    assert( a.typesIndexs[3].join("") === "11", "检测是否能被正确执行-10" );
                    assert( a.typesIndexs[4].join("") === "12", "检测是否能被正确执行-11" );
                    assert( a.typesIndexs[5].join("") === "24", "检测是否能被正确执行-12" );
                    assert( a.typesIndexs[6].join("") === "25", "检测是否能被正确执行-13" );
                    assert( a.typesIndexs[7].join("") === "26", "检测是否能被正确执行-14" );
                    assert( a.typesIndexs.length === 8, "检测是否能被正确执行-15" );
                    assert( b instanceof _ParamTypeTable, "检测是否能被正确执行-16" );
                    assert( b.types.length === 0, "检测是否能被正确执行-17" );
                    assert( b.types.length === 0, "检测是否能被正确执行-18" );
                    assert( b.generalParamCount === 0, "检测是否能被正确执行-19" );
                    assert( b.optionalParamCount === 0, "检测是否能被正确执行-20" );
                    assert( b.minParamCount === 0, "检测是否能被正确执行-21" );
                    assert( b.maxParamCount === 0, "检测是否能被正确执行-22" );
                    assert( c.maxParamCount === 3, "检测是否能被正确执行-23" );
                    //assert(  )
                    console.dir( e );
                    console.dir( e.parse([ "a", 2, 3, 1, "b" ]) );
                } )
            );

            _XFunction  = _KeyWord( 
                "XFunction", _KeyWord.DATATYPE, function XFunction( args, handler ){
                    //在这里。创建出一个高级的函数（支持重载的函数）
                    
                }
            );

            gunit.append( XFunction_unit );
            
            XFunction_unit.test();

        }();


        //gunit.test( true );

}();

/*
_KeyWord.TOOL                 = "Tool";
_KeyWord.DATATYPE             = "DataType";
_KeyWord.PARAM_TYPE_MODIFIER  = "ParamTypeModifier";
_KeyWord.SUBSIDIARY           = "Subsidiary";

*/
/*
//GOOD IDEA
//一个参数类型表
Types[ String, Optional String = "", Optional Number = 0, String, Number, Optional Boolean = false, Boolean ];

//全部可能的匹配
//传入实参表                           //修整实参表
[ "A", "B", 1, "C", 1, true, true ] -> [ "A", "B", 1, "C", 1, true, true ]; //最大实参数
[ "A", "B", 1, "C", 1, true ]       -> [ "A", "B", 1, "C", 1, false, true ];
[ "A", "B", "C", 1, true ]          -> [ "A", "B", 0, "C", 1, false, true ];
[ "A", "C", 1, true ]               -> [ "A", "", 0, "C", 1, false, true ]; //最小实参数

[ "A", "B", "C", 1, true, true ]    -> [ "A", "B", 0, "C", 1, true, true ];
[ "A", "C", 1, true, true ]         -> [ "A", "", 0, "C", 1, true, true ];
[ "A", "C", 1, true, true ]         -> [ "A", "", 0, "C", 1, true, true ];

[ "A", 1, "C", 1, true ]            -> [ "A", "", 1, "C", 1, false, true ];

//筛选
SELECTED = {};
params   = [ "A", "B", 1, "C", 1, true, true ];
types    = [ String, Optional String = "", Optional Number = 0, String, Number, Optional Boolean = false, Boolean ];
TPOS     = [];
MUSTS    = [];
OPTS     = [];
//索引分析
TPOS[0]  = LIMIT(= INDEX(=0) - OPTLEN(=0), INDEX(=0) ) = [ 0, 0 ]; //must
TPOS[1]  = LIMIT(= INDEX(=1) - OPTLEN(=0), INDEX(=1) ) = [ 1, 1 ]; //optional
TPOS[2]  = LIMIT(= INDEX(=2) - OPTLEN(=1), INDEX(=2) ) = [ 1, 2 ]; //optional
TPOS[3]  = LIMIT(= INDEX(=3) - OPTLEN(=2), INDEX(=3) ) = [ 1, 3 ]; //must
TPOS[4]  = LIMIT(= INDEX(=4) - OPTLEN(=2), INDEX(=5) ) = [ 2, 4 ]; //must
TPOS[5]  = LIMIT(= INDEX(=5) - OPTLEN(=2), INDEX(=4) ) = [ 3, 5 ]; //Optional
TPOS[6]  = LIMIT(= INDEX(=6) - OPTLEN(=3), INDEX(=6) ) = [ 3, 6 ]; //must

MUSTS = [ TPOS[0], TPOS[3], TPOS[4], TPOS[6] ];
OPTS  = [ TPOS[1], TPOS[2], TPOS[5] ];

//先处理必选项
while( pos = MUSTS.shift() ){
    finded = false;
    for( s = pos[0], e = pos[1], e >= s; e-- ){
        index = e;
        item  = params[ index ];
        //pos[1] 的值是形参在形参表中的实际索引
        if( !( index in params ) || item === SELECTED || !( item instanceof types[ pos[1] ] ) );
            continue;
        }
        SELECTED[ pos[1] ] = item;
        params[ index ]    = SELECTED;
        finded             = true;
        break;
    }

    if( !finded ){
        throw Error;
    }    
}
//必选项处理完成后实参表将会是这样
[ SELECTED, "B", 1, SELECTED, SELECTED, true, SELECTED ]

//处理可选项

while( pos = OPTS.shift() ){
    finded = false;
    for( s = pos[0], e = pos[1], e >= s; e-- ){
        index = e;
        item  = params[ index ];
        //pos[1] 的值是形参在形参表中的实际索引
        if( !( index in params ) || item === SELECTED || !( item instanceof types[ pos[1] ] ) );
            continue;
        }
        SELECTED[ pos[1] ] = item;
        params[ index ]    = SELECTED;
        finded             = true; 
        break;
    }

    if( !finded ){
        SELECTED[ pos[1] ] = default; //如果未找到就将关联项置为可选参数设置的默认值
    }    
}

//可选项处理完成后实参表将会是这样
[ SELECTED, SELECTED, SELECTED, SELECTED, SELECTED, SELECTED, SELECTED ]
  

为每一类型匹配所有可能的匹配。

*/

[
    String, 
    Optional( String ), 
    Optional( String ), 
    String, 
    String,
    Optional( String ), 
    Optional( String ),
    String
];

"A", "B", "C", "D"

0: "A"
1: "B", "C", "D"
2: "C", "D",  null
3: "D", null, null, null, null

