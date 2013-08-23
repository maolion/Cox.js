/**
 * ${project} < ${FILE} >
 *
 * @DATE    ${DATE}
 * @VERSION ${version}
 * @AUTHOR  ${author}
 * 
 * ----------------------------------------------------------------------------
 * Cox.Logger类 提供 日志输出操作
 * 依赖：Cox.Events模块
 * ----------------------------------------------------------------------------
 */

require( "../Cox.js" );

Define( "Logger", function( require, exports, module ){
    var 
        SLICE        = Array.prototype.slice,
        RE_LINE_END  = /\n\r|\r\n|\r|\n/g,
        IWriteStream = null,
        Logger       = null
    ;
    
    IWriteStream = Interface( "IWriteStream", function( Static, Public ){
        Public.write       = Function;
        Public.end         = Function;
    } );

    Logger = Class( "Logger", Extends( Events.EventSource ), function( Static, Public ){
        
        var 
            STDOUT = process.stdout
        ;
        
        Public.constructor = function( ostream ){
            this.Super( "constructor" );
            this._left_whitespace  = "";
            this.dispatchEvent( "writeBefore", "writeAfter", "outputStreamChange" );
            this.setOStream( ostream || STDOUT );
        };

        Public.group = function( ){
            RE_LINE_END.lastIndex = 0;
            this.log.apply( this, arguments );
            this._left_whitespace += "    ";
        };

        Public.groupEnd = function(){
            this._left_whitespace = this._left_whitespace.slice( 0, -4 );
        };

        Public.info = function( message, chartset ){
            RE_LINE_END.lastIndex = 0;            
            message  = this.prefix() + this._left_whitespace + message.replace( RE_LINE_END, "\n" + this._left_whitespace ) + "\n";
            chartset = chartset || this.chartset;
            this.fireEvent( "writeBefore", [ message, chartset ], this );
            forEach( this._outStream, function( ostream ){
                ostream.write( message, chartset );
            } );
            this.fireEvent( "writeAfter", [ message, chartset ], this );
        };

        Public.log = function( message ){
            this.info( SLICE.call( arguments ).join( " " ) );
        };

        Public.warn = Overload(
            Optional( String ), String, function( head, message ){
                this.info( head + "WARNING: " + message );
            } 
        );

        Public.err = Overload(
            Optional( String ), String, function( head, message ){
                this.info( head + "  ERROR: " + message );
            }
        );

        Public.err.define(
            Optional( String ), String, Error, function( head, message, err ){
                this.group( head + "  ERROR: " + message );
                this.info( err.stack );
                this.groupEnd();
            }
        );

        Public.prefix = function(){
            return "";
        };

        Public.setOStream = Overload(   
            Params( IWriteStream ), function( ostreams ){
                forEach( this._outStream, function( ostream ){
                    try{
                        ostream.end();
                    }catch( e ){
                        //...
                    }
                } );
                this._outStream = Cox.__Util.List.unique( ostreams );
                this.fireEvent( "outputStreamChange", [ ostreams ], this );
            }
        );

        Public.getOStream = function(){
            return this._outStream;
        };

        Public.chartset = "utf8";
    } );
    
    UTest.add( "Logger", function test_Logger( ){
        var 
            _this     = this,
            logger    = null,
            testvalue = "",
            ostream   = {
                write : function( data ){
                    testvalue += data
                },
                end   : function(){
                    testvalue += "^end";
                }
            }
        ;
        //console.log( Cox.Util.is( ostream, IWriteStream ) );
        logger = new Logger( ostream );
        this.assert( logger, "instance Logger" );
        logger.log( "x" );
        logger.log( "A", "B" );
        logger.group( "----" );
        logger.log( "C" );
        logger.warn( "X ", "D" );
        logger.err( "X ", "E" );
        logger.groupEnd();
        logger.setOStream( ostream );
        
        this.assert(
            testvalue === 
            "x\n" +
            "A B\n" +
            "----\n" +
            "    C\n" +
            "    X WARNING: D\n" +
            "    X   ERROR: E\n" +
            "^end",
            "output stream"
        );

    } );
    //UTest.test( "Logger" );

    module.exports = Logger;
    module.exports.IWriteStream = IWriteStream;
} );


