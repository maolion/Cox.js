/**
 * ${project} < ${FILE} >
 *
 * @DATE    2012/12/2
 * @VERSION 0.1
 * @AUTHOR  maolion.j@gmail.com
 * 
 * ----------------------------------------------------------------------------
 *
 * ----------------------------------------------------------------------------
 */


 //实现 UTest 它被用于 单元测试
;void function __UTest__( global ){
    var EMPTY_FUNCTION = function(){},
        slice          = Array.prototype.slice,
        UTest          = {}, 
        pendingasserts = {};

    function assert( values, message ){
        var value, args, value_count, failed;
        
        if( !arguments.length ){
            return;
        }

        args        = slice.call( arguments );
        values      = args.slice( 0, args.length - 1 || 1 );
        value_count = values.length;
        message     = args[ value_count ] || "assert( " + values.join(", ") + " )";
        value       = args[0];
        failed      = !value;
        this.testresult.push( {
            failed    : failed,
            message   : message +  ( failed ? 
                ". at params[0] " : ""
            )
        } );
        if( failed ){
            return;
        }     
        for( var i = 1; i < value_count; i++ ){
            failed = value !== values[i];
            value  = values[i];

            this.testresult.push( {
                failed    : failed,
                message   : message +  ( failed ? 
                    ". at params[" + i + "] " : ""
                )
            } );

            if( failed ){
                break;
            }
        }
    };

    UTest.add = function( groupname, handler ){
        var group;
        groupname = groupname || "";

        if( pendingasserts.hasOwnProperty( groupname ) ){
            group = pendingasserts[ groupname ];
        }else{
            group = pendingasserts[ groupname ] = {
                handlers   : [],
                testresult : [],
                assert     : assert
            };
        }

        group.handlers.push( handler );
    };

    UTest.remove = function( groupname ){
        for( var i = 0, l = arguments.length; i < l; i++ ){
            groupname = arguments[i];
            if( pendingasserts.hasOwnProperty( groupname ) ){
                delete pendingasserts[ groupname ];
            }
        }
    };


    UTest.test = function( groupnames ){
        var args;
        
        if( arguments.length ){
            args       = slice.call( arguments );
            groupnames = {};
            for( var i = 0, l = args.length; i < l; i++ ){
                groupnames[ args[i] ] = 1;
            }
        }
        for( var groupname in pendingasserts ){
            if( pendingasserts.hasOwnProperty( groupname ) ){
                if( !groupnames || groupnames.hasOwnProperty( groupname ) ){
                    var group    = pendingasserts[ groupname ],
                        handler  = null,
                        result   = null,
                        errcount = 0;

                    console.group( "test:",  groupname );
                    while( handler = group.handlers.shift() ){
                        handler.call( group );
                    }
                    while( result = group.testresult.shift() ){
                        if( result.failed ){
                            errcount++;
                            console.error( 
                                "Assertion failed: ", 
                                result.message 
                            );
                            if( UTest.block ){
                                console.groupEnd();
                                return;     
                            }
                        }else if( !UTest.onlyfailed ){
                            console.log(
                                "Assertion ok: ",
                                result.message
                            );
                        }
                    }
                    if( errcount === 0 ){                    
                        console.info( "all pass." );
                    }
                    console.groupEnd();
                }
                delete pendingasserts[ groupname ];
            }
        }
    };

    //是否让输出信息只显示错误的
    UTest.onlyfailed = false;
    //测试中如果有不通过的测试是否阻止其后的其他测试。
    UTest.block      = true;
    global.UTest     = UTest;



    
    //测试输出信息全部使用环境提供的 console模块里的接口
    global.console   = console || {
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
    };

}( this );  

UTest.block = false;

UTest.add( "module1", function(){
    this.assert( 0, "A" );
    this.assert( 1, "B" );
} );
UTest.add( "module2", function(){
    this.assert( 1, "Ax" );
    this.assert( 0, "Bx" );
} );
UTest.add( "module3", function(){
    this.assert( 1, "Axx" );
    this.assert( 1, "Bxx" );
} );

//UTest.remove( "module1" ); //把module1的测试从测试列表中删除
//UTest.test( "module1", "module3" );//选择性的测试指定的模块
UTest.test();
