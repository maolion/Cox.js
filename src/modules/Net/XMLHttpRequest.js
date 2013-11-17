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

Define( "XMLHttpRequest", Depend( "~/Cox/Env", "~/Cox/Net/URL", "~/Cox/Net/URI" ), function( require, exports, module ){
    var
        EMPTY_FUNCTION = function(){},
        Env            = require( "Env" ),
        URL            = require( "URL" ),
        URI            = require( "URI" ),
        XHR            = Env.XMLHttpRequest,
        XHR2           = Env.XMLHttpRequest2,
        FormData       = Env.global.FormData,
        XMLHttpRequest = null
    ;
    
    XMLHttpRequest = Class( "XMLHttpRequest", Extends( Cox.EventSource ), function( Static, Public ){

        var 
            RE_METHOD_VALUE = /^get|post$/,
            //响应数据类型
            RES_TYPE_TEXT   = Static.TEXT   = "",
            RES_TYPE_BUFF   = Static.BUFFER = "arraybuffer",
            RES_TYPE_BLOB   = Static.BLOB   = "blob",
            RES_TYPE_DOC    = Static.DOC    = "document",
            RES_TYPE_JSON   = Static.JSON   = "json",
            RES_TYPE_XML    = Static.XML    = "xml",
            //状态
            STATE_UNSET     = Static.UNSET   = 0,
            STATE_OPENED    = Static.OPENED  = 1,
            STATE_LOADING   = Static.LOADING = 3,
            STATE_DONE      = Static.DONE    = 4,
            STATE_HEADERS_RECEIVED = Static.HEADERS_RECEIVED = 2,
            //请求信息方式
            METHOD_GET      = Static.GET     = "get",
            METHOD_POST     = Static.POST    = "post",
            //请求信息模式
            MODE_ASYNC      = Static.ASYNC   = true,
            MODE_SYNC       = Static.SYNC    = false,
            //默认值
            DEFAULT_TYPE    = RES_TYPE_TEXT,
            DEFAULT_METHOD  = METHOD_GET,
            DEFAULT_MODE    = MODE_ASYNC,
            DEFAULT_TIMEOUT = 30000,
            DEFAULT_CHARSET = "utf-8",
            stateHandlers   = {},
            dataParses      = {}
        ;

        Static.originalXHR = function(){
            return XHR; 
        };

        stateHandlers[ STATE_UNSET ]            = 
        stateHandlers[ STATE_HEADERS_RECEIVED ] = 
        stateHandlers[ STATE_LOADING ]          = [ 
            function( xhr, gallery, oevent ){
                var event = xhr.getEvent( "loading" );
                event.originalXHR   = gallery;
                event.originalEvent = oevent;
                xhr.fireEvent( "loading", [ event, gallery.readyState ] )
            } 
        ];

        stateHandlers[ STATE_OPENED ] = [
            function( xhr, gallery, oevent ){
                var 
                    timeout = ~~xhr.timeout,
                    event   = xhr.getEvent( "timeout" )
                ;
                event.originalXHR   = gallery;
                event.originalEvent = oevent;
                if( timeout > 0 ){
                    xhr._timeout_timer = setTimeout( function(){
                        xhr.abort();
                        xhr.fireEvent( "timeout", [ event ] );
                    }, timeout );
                }
            },
            stateHandlers[ STATE_LOADING ][0]
        ];

        stateHandlers[ STATE_DONE ] = [
            function ( xhr, gallery, oevent ){
                if( xhr._timeout_timer ){
                    clearTimeout( xhr._timeout_timer );
                }
                xhr.status          = gallery.status;
                xhr.statusText      = gallery.statusText;
            },
            function( xhr, gallery, oevent ){
                var 
                    status = gallery.status,
                    event  = null,
                    error  = null
                ;
                if( status >= 400 ){
                    error = new Error( status + " " + xhr.statusText );
                }else if( status !== 200 || status !== 304 ){
                    var 
                        data  = null,
                        type  = xhr.responseType,
                        parse = dataParses[type]
                    ;
                    event               = xhr.getEvent( "load" );
                    event.originalXHR   = gallery;
                    event.originalEvent = oevent;

                    try {
                        data = xhr.response     = gallery.response;
                        data = xhr.responseText = gallery.responseText;
                        if (type === RES_TYPE_XML)
                            data = xhr.responseXML  = gallery.responseXML;
                        data || (data = xhr.responseText);
                    } catch(e) {
                    }
                    try {
                        data = parse instanceof Function ? parse(data) : data;
                    } catch(e) {
                        error = e;
                    }
                    xhr.fireEvent( "load", [ event, data ] );
                }

                if( error ){
                    event               = xhr.getEvent( "error" );
                    event.originalXHR   = gallery;
                    event.originalEvent = oevent;
                    xhr.fireEvent( "error", [ event, error ] );
                }   
            },
            function( xhr, gallery, oevent ){
                var event = xhr.getEvent( "done" );
                event.originalXHR   = gallery;
                event.originalEvent = oevent;
                //xhr.abort();
                xhr.fireEvent( "done", [ oevent ] );
            }
        ];

        dataParses[ RES_TYPE_JSON ] = function( data ){
            if( !is( String, data ) ){
                return data;
            } 
            return ( new Function( "return " + data + ";" ) )();
        };

        //default value
        Public.method          = DEFAULT_METHOD;
        Public.mode            = DEFAULT_MODE;
        Public.withCredentials = false;
        Public.responseType    = DEFAULT_TYPE;
        Public.readyState      = 0;
        Public.response        = "";
        Public.responseText    = "";
        Public.responseXML     = null;
        Public.responseType    = DEFAULT_TYPE;
        Public.status          = 0;
        Public.statusText      = "";
        Public.timeout         = DEFAULT_TIMEOUT;
        Public.hidetype        = true;
        Public.charset         = DEFAULT_CHARSET;


        Public.constructor = function(){
            var
                _this          = this,
                gallery        = new XHR,
                progress_event = null,
                state_event    = null
            ;

            this.Super( "constructor" );
            
            this.dispatchEvent(
                new Cox.Event( "loading", { target : this } ),
                new Cox.Event( "load", { target : this } ),
                new Cox.Event( "done", { target : this } ),
                new Cox.Event( "error", { target : this } ),
                new Cox.Event( "timeout", { target : this } ),
                new Cox.Event( "abort", { target : this } ),
                state_event    = new Cox.Event( "readystatechange", { target : this } ),
                progress_event = new Cox.Event( "progress", { target : this } )
            );

            this.gallery        = gallery;
            this.auth           = {};
            this.upload         = gallery.upload;
            this._timeout_timer = null;

            if( this.upload ){
                function uploadProgressHandler( oevent ){
                    progress_event.total            = oevent.total;
                    progress_event.loaded           = oevent.loaded;
                    progress_event.lengthComputable = oevent.lengthComputable;
                    progress_event.originalEvent    = oevent;
                    progress_event.originalTarget   = oevent.target;
                    _this.fireEvent( 
                        "progress", 
                        [ progress_event, oevent.lengthComputable, oevent.loaded, oevent.total ] 
                    );
                };
                gallery.addEventListener( "progress", uploadProgressHandler );
                this.upload.addEventListener( "progress", uploadProgressHandler );
            }

            gallery.addEventListener( "readystatechange", function( oevent ){
                var handlers = stateHandlers[ gallery.readyState ];
                _this.readyState = gallery.readyState;
                
                for(
                    var i = 0, l = handlers.length;
                    i < l;
                    i++
                ){
                    handlers[i]( _this, gallery, oevent );
                }

                state_event.originalEvent = oevent;
                state_event.originalXHR   = gallery;
                _this.fireEvent( "readystatechange", [ state_event ] );
            } );

        };         

        Public.send = function( data ){
            var gallery = this.gallery;
            if( this.hidetype ){
                gallery.setRequestHeader( "X-Requested-With", "Cox-XMLHttpRequest" );
            }

            if( this.method === METHOD_POST && !( FormData && data instanceof FormData ) ){
                gallery.setRequestHeader( "Content-Type", "application/x-www-form-urlencoded; charset=" + this.charset );
            }else{
                //gallery.setRequestHeader( "Content-Type", "charset=" + this.charset );
            }


            gallery.responseType = this.responseType;
            //console.log( gallery.responseType );
            gallery.send( data || null );
        };

        Public.resend = function( data ){
            if( this.readyState === STATE_UNSET ){
                throw new Error( "该请求状态无法被重新发送" );
            }
            this.abort();
            this.gallery.open(
                this.method,
                this.target.toString(),
                this.mode,
                this.auth.user,
                this.auth.password
            );
            this.send( data );
        };

        Public.abort = function(){
            try{
                clearTimeout( this._timeout_timer );
                this._timeout_timer = null;
                this.gallery.abort();
                this.readyState   = STATE_UNSET;
                this.status       = null;
                this.statusText   = null;
                this.response     = null;
                this.responseText = null;
                this.responseXML  = null;
                this.fireEvent( "abort", [ this.getEvent( "abort" ) ] );
            }catch( e ){
            }
        };


        Public.setTarget = XFunction(
            String, function( target ){
                return this.target = ( is( URL, target ) && new URL( target ) )
                                  || ( is( URI, target ) && new URI( target ) ) 
                                  || "";     
            }
        );

        Public.setTarget.define(
            URI, function( target ){
                return this.target = target;
            }
        );

        Public.setMethod = function( method ){
            return this.method = RE_METHOD_VALUE.test( method ) ? method.toLowerCase() : DEFAULT_METHOD;
        };

        Public.setMode = function( mode ){
            return this.mode = !!mode;
        }

        Public.setTimeout = XFunction(
            Number, Optional( Function ), function( timeout, callback ){
                this.timeout = Math.max( timeout, 0 );
                callback && this.on( "timeout", callback );
                return this.timeout;
            }
        );

        Public.setHeader = Public.setRequestHeader = XFunction(
            String, String,
            function( key, value ){
                var 
                    gallery = this.gallery
                ;
                
                if( gallery.readyState !== STATE_OPENED ){
                    throw new Error(
                        "只有请求通道在被打开状态下才允许修改请求头信息"
                    );
                }
                
                gallery.setRequestHeader( key, value );
            }
        );


        Public.open = XFunction(
            String, String, Optional( Boolean, DEFAULT_MODE ), Optional( String ), Optional( String ),
            function( method, target, mode, user, pwd ){
                var gallery = this.gallery;

                if( gallery.readyState !== STATE_UNSET ){
                    throw new Error(
                        "一个已被打开的请求通道无法继续执行打开操作."
                    );
                }
                this.setTarget( target );
                this.setMethod( method );
                this.setMode( mode );
                this.auth.user     = user;
                this.auth.password = pwd;
                gallery.open( 
                    this.method, 
                    this.target.toString(), 
                    this.mode, 
                    user, 
                    pwd 
                );

            }
        );

        Public.getResponseHeader = function( header ){
            return this.gallery.getReponseHeader( header );
        };

        Public.getAllResponseHeaders = function(){
            return this.gallery.getAllResponseHeaders();
        };

        Public.overrideMimeType = function( mimetype ){
            this.gallery.overrideMimeType( mimetype );
        };
        
    } );

    module.exports = XMLHttpRequest;
} );
