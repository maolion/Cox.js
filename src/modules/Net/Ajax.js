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


Define( "Ajax", Depend( "~/Cox/Net/XMLHttpRequest", "~/Cox/Net/URI", "~/Cox/Net/URL", "~/Cox/Env" ), function( require, Ajax ){
    var 
        EMPTY_FUNCTION  = function(){},
        DOC             = document,
        XHR             = require( "XMLHttpRequest" ),
        URI             = require( "URI" ),
        URL             = require( "URL" ),
        Env             = require( "Env" ),
        MAX_XHR_COUNT   = 3,
        xhrs            = [],
        busyCount       = 0,
        queue           = [],
        FormData        = null,
        JSONP_PARAMNAME = "callback",
        uid             = function(){
            var uid = new Date().getTime();
            return function( prefix ){
                return ( prefix || "" ) + uid++;
            };
        }()
    ;

    Ajax.FormData = FormData = Class( "FormData", function( Static, Public ){

        var formTags = null;

        formTags = {
            INPUT : function( form, data ){
                XList.forEach( form.getElementsByTagName( "INPUT" ) || [], function( input ){
                    if( input.hasAttribute( "name" ) ){
                        var 
                            name  = input.getAttribute( "name" ),
                            type  = ( input.getAttribute( "type" ) || "" ).toLowerCase(),
                            value = input.value,
                            temp  = data[ name ]
                        ;
                        if( type !== "radio" && temp && !( temp instanceof Array ) ){
                            temp = data[ name ] = [ temp ];
                        }
                        if( ( type === "checkbox" || type === "radio" ) 
                         && !input.checked
                        ){
                            return;
                        }

                        if( temp instanceof Array ){
                            temp.push( value );
                        }else{
                            data[ name ] = value;
                        }
                    }   
                } );    
            },
            TEXTAREA : function( form, data, tag ){
                XList.forEach( form.getElementsByTagName( tag ), function( el ){
                    if( el.hasAttribute( "name" ) ){
                        var 
                            name  = el.getAttribute( "name" ),
                            value = el.value,
                            temp  = data[ name ]
                        ;

                        if( temp && !( temp instanceof Array ) ){
                            temp = data[ name ] = [ temp ];
                        }

                        if( temp instanceof Array ){
                            temp.push( value );
                        }else{
                            data[ name ] = value;
                        }
                    }
                } );
            }
        };

        formTags.SELECT = formTags.TEXTAREA;
        formTags.BUTTON = formTags.TEXTAREA;
        function parseForm( formElement ){
            var 
                form = {},
                data = {}
            ;

            form.action  = formElement.getAttribute( "action" );
            form.method  = formElement.getAttribute( "method" );
            form.charset = formElement.getAttribute( "accept-charset" );
            form.enctype = formElement.getAttribute( "enctype" );

            XObject.forEach( formTags, true, function( handler, tag ){
                handler( formElement, data, tag );
            } );
            
            form.data = data;
            return form;
        };

        Public.constructor = function( formElement ){
            var info = formElement ? parseForm( formElement ) : {};
            this.action  = info.action  || "./";
            this.method  = info.method  || "post";
            this.charset = info.charset || "utf-8";
            this.enctype = info.enctype || "application/x-www-form-urlencoded";
            this.data    = info.data || {};
        };

        Public.append = XFunction( String, Object, Optional( Boolean ), function( key, value, override ){
            var temp = this.data[ key ];
            if( !override && temp && !( temp instanceof Array ) ){
                temp = this.data[ key ] = [ temp ];
            }
            if( !override && temp instanceof Array ){
                temp.push( value );
            }else{
                this.data[ key ] = value;
            }
        } );
        Public.get = XFunction( String, function( name ){
            return this.data[name];
        } );
    } );

    function exec( xhr ){
        var
            xhr    = this instanceof XHR ? this : xhr,
            params = queue.shift()
        ;

        xhr.abort();
        if( !params ){
            return;
        }
        
        xhr.un( "error" );
        xhr.un( "load" );
        xhr.open(
            params.method,
            params.url,
            params.mode,
            params.user,
            params.pwd
        );

        xhr.responseType = params.type;
        xhr.once( "load", function( event, data ){
            params.req.resolved( data );
        } );
        xhr.once( "error", function( event, error ){
            params.req.rejected( error );
        } );

        xhr.send( params.method === XHR.POST ? params.data : null );
    };

    function request( method, url, mode, type, user, pwd, data, req ){
        var xhr = null;
        XList.forEach( xhrs, function( x ){
            if( x.readyState === XHR.UNSET ){
                xhr = x;
                return false;
            }
        } );

        if( !xhr && xhrs.length < MAX_XHR_COUNT ){
            xhr = new XHR;
            xhrs.push( xhr );
            xhr.on( "done", exec );
        }

        queue.push( {
            method : method,
            url    : url,
            mode   : mode,
            type   : type,
            user   : user,
            pwd    : pwd,
            data   : data,
            req    : req
        } );
        xhr && exec( xhr );
    }

    Ajax.get = XFunction(
        String, 
        Optional( Boolean, true ), 
        Optional( String ),
        Optional( String ),
        Optional( String ),
        Optional( Cox.PlainObject, {} ),
        Optional( Function, EMPTY_FUNCTION ),
        Optional( Function, EMPTY_FUNCTION ),
        function( url, mode, type, user, pwd, data, success, error ){
            var req   = new Deferred();

            url = is( URL, url ) ? new URL( url ) : new URI( url );
            url.query.append( data );
            req.then( success, error );
            request( XHR.GET, url.toString(), mode, type, user, pwd, data, req );
            return req;
        }
    );

    Ajax.post = XFunction(
        String, 
        Optional( Boolean, true ),
        Optional( String ),
        Optional( String ),
        Optional( String ),
        Optional( Cox.PlainObject, {} ),
        Optional( Function, EMPTY_FUNCTION ),
        Optional( Function, EMPTY_FUNCTION ),
        function( url, mode, type, user, pwd, data, success, error ){
            var 
                req        = new Deferred(),
                data_stack = [ [ "", data ] ],
                datas      = []
            ;
            //url = is( URL, url ) ? new URL( url ) : new URI( url );
            //= = 能别这样刷帅嘛？
            while( data = data_stack.shift() ){
                var key = data[0];
                data = data[1];
                forEach( data, function( v, k ){
                    k = key ? key + "[" + k + "]" : k;
                    if( is( Cox.PlainObject, v ) || v instanceof Array ){
                        data_stack.push( [ k, v ] );
                    }else{
                        datas.push( k + "=" + escape(v) );
                    }
                } );
            }
            data = datas.join( "&" );
            //console.log( data );
            req.then( success, error );
            request( XHR.POST, url, mode, type, user, pwd, data, req  );

            return req;
        }
    );
    
    Ajax.jsonp =  Env.isBrowser && function(){
        var 
            GPREFIX = "COX_JSONP",
            REL     = DOC.documentElement.firstChild,
            datas   = {}
        ;

        function createGlobalCallBack( id ){
            window[id] = function( data ){
                datas[ id ] = data;
                window[id]  = null;
                delete window[id];
            };
        };

        function clear( loader, name, handler ){
            if( loader.removeEventListener ){
                loader.removeEventListener( name, handler );
            }else{
                loader.detachEvent( "onreadystatechange", handler );
            }
            REL.removeChild( loader );
            loader = null;
        };

        function loadScript( url, id, req ){
            var 
                loader   = DOC.createElement( "script" )
            ;

            if( loader.addEventListener ){
                loader.addEventListener( "load", loaded, true );
                loader.addEventListener( "error", loadfail, true );
            }else{
                loader.attachEvent( "onreadystatechange", loaded );
            }

            loader.setAttribute( "type"   , "text/javascript" );
            loader.setAttribute( "charset", "utf-8"  );
            loader.setAttribute( "async"  , "true" );
            loader.setAttribute( "defer"  , "true" );
            loader.setAttribute( "src"    , url );

            REL.insertBefore( loader, null );

            function loaded(){ 
                if( loader.addEventListener 
                 || loader.readyState === "loaded" 
                 || loader.readyState === "complete" 
                ){
                    clear( loader, "load", loaded );
                    req.resolved( datas[ id ] );
                    delete datas[ id ];
                }
            }

            function loadfail(){
                clear( loader, "error", loadfail ); 
                req.resolved(); 
            }                
        }

        return XFunction(
            String, 
            Optional( String, JSONP_PARAMNAME ),
            Optional( Cox.PlainObject, {} ),
            Optional( Function, EMPTY_FUNCTION ), 
            Optional( Function, EMPTY_FUNCTION ),
            function( url, cbkey, data, success, error ){
                var 
                    req    = new Deferred(),
                    cbname = uid( GPREFIX )
                ;
                url = is( URL, url ) ? new URL( url ) : new URI( url );
                
                data[ cbkey ] = cbname;
                url.query.append( data );
                req.then( success, error );
                createGlobalCallBack( cbname );
                loadScript( url.toString(), cbname, req );
                return req;
            }
        );
    }();

    Ajax.setJsonp = XFunction(
        String, function( name ){
            return JSONP_PARAMNAME = name;
        }
    );
    Ajax.submitForm = XFunction( 
        Optional( String ), 
        Optional( Boolean, true ), 
        Optional( String ), 
        Object,
        Optional( Function, EMPTY_FUNCTION ),
        Optional( Function, EMPTY_FUNCTION ),
        function( url, mode, type, form, success, error ){
            form   = form instanceof FormData ? form : new FormData( form );
            //console.log( url || form.url )
            return Ajax[ form.method ](
                url || form.action,
                mode,
                type,
                form.data,
                success,
                error
            );
        }
    );
    if( Env.FormData ){
        Ajax.submitForm2 =  XFunction(
            Optional( String ),
            Optional( Boolean, true ),
            Optional( String ),
            Env.FormData,
            Optional( Function, EMPTY_FUNCTION ),
            Optional( Function, EMPTY_FUNCTION ),
            function( url, mode, type, form, success, error ){
                var 
                    xhr = new XHR,
                    req = new Deferred
                ;
                xhr.open(  
                    form.method || XHR.POST, 
                    url || form.action,
                    mode                    
                );
                xhr.responseType = type;
                xhr.on( "load", function( event, data ){
                    success( data );
                    req.resolved( data );
                } );
                xhr.on( "error", function( event, err ){
                    error( err );
                    req.rejected();
                } );
                xhr.send( form );
                req.xhr = xhr;
                return req;
            }
        );
    }

} );