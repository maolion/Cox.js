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


Define( "Ajax", Depend( "~/Cox/Env", "~/Cox/Net/URL" ), function( require, exports, module ){
    var
        EMPTY_FUNCTION = function(){},
        Env            = require( "Env" ),
        XHR            = Env.XMLHttpRequest,
        XHR2           = Env.XMLHttpRequest2,
        FormData       = Env.global.FormData,
        URL            = require( "URL" ),
        Ajax           = null
    ;

    /**
     * Ajax
     * 向服务器发送异步或同步请求
     */
     
    Ajax = Class( "Ajax", Extends( Deferred ), function( Static, Public ){

        var 
            RES_TYPE_TEXT   = Static.TEXT   = "text",
            RES_TYPE_BUFF   = Static.BUFFER = "arraybuffer",
            RES_TYPE_BLOB   = Static.BLOB   = "blob",
            RES_TYPE_XML    = Static.XML    = "document",
            RES_TYPE_JSON   = Static.JSON   = "json",
            STATUS_HANDLERS = {
                200 : function( xhr, ajax ){
                    console.dir( xhr );
                }
            },
            response_cache = {}
        ;

        STATUS_HANDLERS[ 304 ] = STATUS_HANDLERS[ 200 ];

        Static.createXHR = function(){
            return new XHR;
        };

        Static.get = Overload(
            String, Optional( Boolean, true ), Optional( String, RES_TYPE_TEXT ), Optional( Object, {} ), Optional( Function ),
            function( url, async, data, callback ){

            }
        );

        Static.post = Overload(
            String, Optional( Boolean, true ), Optional( String, RES_TYPE_TEXT ), Optional( Object, {} ), Optional( Function ),
            function( url, async, data, callback ){

            }
        );  

        function setRequestHeader( xhr, config ){
            if( config.hidetype ){
                xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
            }

            if( config.method === "POST" && !( FormData && config.data instanceof FormData ) ){
                xhr.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded" );
            }

            xhr.setRequestHeader( "Content-Type", "charset=" + config.charset );
        };

        Public.constructor = function( config ){
            var
                _this = this,
                xhr   = new XHR
            ;

            this.Super( "constructor" );
            this.dispatchEvent( "opened", "loading", "done", "abort", "timeout" );
            this.xhr    = xhr;
            this.config = {
                url      : "",
                data     : null,
                method   : "GET",
                charset  : "utf-8",
                type     : RES_TYPE_TEXT,
                timeout  : 30000,
                async    : true,
                hidetype : false,   
                cache    : true,
                user     : null,
                password : null
            };

            this.reset( config );
            this.config.timeout = Math.abs( this.config.timeout );
            this._timeout_timer = null;

            xhr.onreadystatechange = function(){
                switch( xhr.readyState ){
                    case XHR.OPENED: 
                        _this.fireEvent( "opened", [ xhr ], _this ); 
                    break;
                    case XHR.LOADING:
                        _this.fireEvent( "loading", [ xhr ], _this );
                    break;
                    case XHR.DONE:
                        clearTimeout( _this._timeout_timer );
                        _this.fireEvent( "done", [ xhr ], _this );
                        STATUS_HANDLERS[ xhr.status ].call( _this, xhr, _this );
                    break;
                }
            };

        };

        Public.reset = function( config ){
            config      = config ? Cox.Util.mix( this.config, config, true ) : this.config;
            config.url  = Cox.__Util.String.trim( config.url );

            if( !config.url ){
                throw new Error(
                    "Ajax类实例的配置缺少正确的url属性值."
                );
            }

            config.method = config.method.toUpperCase();
            this.abort();
            this.xhr.open( 
               config.method, config.url, config.async,
               config.user, config.password
            );

            XHR2 && ( this.xhr.responseType = config.type );
        };

        Public.send = function( data ){
            var 
                _this = this,
                config = this.config,
                data = config.data = ( data || config.data )
            ;

            setRequestHeader( this.xhr, config );

            if( config.timeout ){
                this._timeout_timer = setTimeout( 
                    function(){
                        _this.fireEvent( "timeout", [], _this );
                        _this.abort();
                    },
                    config.timeout 
                );
            }

            this.xhr.send( data );
        };

        Public.abort = function(){
            try{
                clearTimeout( this._timeout_timer );
                this._timeout_timer = null;
                xhr.abort();
                this.fireEvent( "abort", [], _this );
            }catch( e ){

            }
        };

    } );

    module.exports = Ajax;
} );