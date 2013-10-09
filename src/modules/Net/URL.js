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
Define( "URL", Depend( "~/Cox/IO/Path", "~/Cox/Net/URI" ), function( require, exports, module ){
    var 
        RE_PROTOCOL   = /^\w+(?=:\/{2,3}.+$)/,
        RE_WIN_SEP    = /\\+/g,
        RE_URL        = /^\w+:\/{2,3}.*$/,
        RE_REMOTE_URL = /^(\w+):\/\/([^\/\:\s\?\#]+)(?:\:(\d+))?(.*)$/,
        RE_LOCAL_URL  = /^file:\/\/(.*)$/i,
        Path          = require( "Path" ),
        URI           = require( "URI" ),
        URL           = null
    ;

    URL = Class( "URL", Extends( URI ), function( Static, Public ){
        var 
            URL       = this,
            PROTOCOLS = {
                "file" : function( url ){
                    var match = url.match( RE_LOCAL_URL );
                    this.host = "";
                    this.port = "";
                    this.Super( "constructor", match[1] );
                },

                "http" : function( url ){
                    var match = url.match( RE_REMOTE_URL );
                    this.host = match[2];
                    this.port = match[3] || DEFAULT_PORTS[ match[1] ];
                    this.Super( "constructor", match[4] );
                }
            },
            DEFAULT_PORTS = {
                "http"  : 80,
                "https" : 443,
                "ftp"   : 21
            }
        ;

        PROTOCOLS[ "https" ] = PROTOCOLS[ "ftp" ] = PROTOCOLS[ "http" ];

        Static.__instancelike__ = function( url ){
            return RE_URL.test( url );
        };

        Public.constructor = XFunction(
            String, 
            function( url ){
                var match = url.match( RE_PROTOCOL );
                this.protocol = match[0].toLowerCase();
                try{
                    PROTOCOLS[ this.protocol ].call( this, url );
                }catch( e ){
                    throw new SyntaxError(
                        "URL协议头不被支持"
                    );
                }
            }
        );

        Public.constructor.define(
            String, String, Optional( Number, 80 ), Optional( String, "" ),
            function( protocol, host, port, uri ){
                this.protocol = protocol;
                this.host     = host;
                this.port     = port;
                this.Super( "constructor", uri );
            }
        );

        Public.constructor.define(
            URL, String,
            function( context, uri ){
                this.Super( 
                    "constructor",
                    "\/\\".indexOf( uri.charAt(0) ) > -1 ? uri : context.path + "/" + uri
                );
                this.protocol = context.protocol;
                this.host     = context.host;
                this.port     = context.port;
            }
        );

        Public.toString = function( uri ){
            var 
                protocol = this.protocol.toLowerCase(),
                port     = this.port
            ;

            forEach( DEFAULT_PORTS, function( dport, dprotocol ){
                if( dport == port && protocol === dprotocol ){
                    port = "";
                    return true;
                }
            } );
            
            RE_WIN_SEP.lastIndex = 0;
            return this.protocol + "://" + 
                   this.host + ( port ? ":" + port : "" )+
                   Path.normalize( 
                        "/" + ( uri || this.Super( "toString" ) )
                   ).replace( RE_WIN_SEP, "/" );
        };

    } );

    module.exports = URL;
} );
