/**
 * ${project} < ${FILE} >
 *
 * @DATE    ${DATE}
 * @VERSION ${version}
 * @AUTHOR  ${author}
 * 
 * ----------------------------------------------------------------------------
 *
 * ----------------------------------------------------------------------------
 */

             /**
             * XFunction 提供一些用于扩展普通函数使用的一些静态方法集，通过 
             * XFunction构造出的函数与普通函数无任何差别
             */
            _XFunction = _KeyWord( "XFunction", _KeyWord.DATATYPE, function XFunction(){
                return Function.apply( null, arguments );
            } );

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
                        key  = JSON.stringify( args )
                    ;
                    if( memoize.hasOwnProperty( key ) ){
                        return memoize[ key ];
                    }else{
                        return memoize[ key ] = handler.apply( this, arguments );
                    }
                };

            };

            /**
             * XFunction.__instancelike__ 判断某一对象是否能被“看作”为XFunction
             * 的实例（所有Function类实例都可被看作是 XFunction 的实例 )
             * @param { Object } obj
             * @return { Boolean }
             */
            _XFunction.__instancelike__ = function( obj ){
                return obj instanceof Function;
            };

            //为 XFunction及其提供的方法 添加单元测试
            util_unit.append(
                new _UTest( "XFunction", function( assert ){
                    assert( new _XFunction() instanceof Function, "new _XFunction() instanceof Function"  );
                    assert( 
                        _KeyWord.__instancelike__( _XFunction, _KeyWord.DATATYPE ),
                        "检测XFunction是否为关键字"
                    );

                    assert( _XFunction.__instancelike__( function(){} ) === true, "_XFunction.__instancelike__( function(){} ) === true" );
                    assert( _XFunction.__instancelike__( Function( "x" ) ) === true, "_XFunction.__instancelike__( Function( 'x' ) ) === true" );
                    assert( _XFunction.__instancelike__( new Function ) === true, "_XFunction.__instancelike__( new Function ) === true" );
                    assert( _XFunction.__instancelike__( {} ) === false, "_XFunction.__instancelike__( {} ) === false" );
                } )
            );

            util_unit.subUnit( "XFunction" ).append(
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

            util_unit.subUnit( "XFunction" ).append(
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

            //util_unit.subUnit( "XFunction" ).test();