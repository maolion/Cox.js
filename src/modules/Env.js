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
Define( "Env", function( _require, Env, module ){
    var 
        R_JSON_SIGN = /^[;\s]*{[\s\S]*}[;\s]*$/,
        GLOBAL      = function(){ return this }(),
        SLICE       = Array.prototype.slice,
        UA          = ( GLOBAL.navigator && navigator.userAgent || "" ).toLowerCase(),
        DOC         = GLOBAL.document || {},
        DOC_ROOT    = DOC.documentElement || {},
        name        = "unknow",
        version     = "unknow",
        undefined   = void 0
    ;

    if( GLOBAL.ActiveXObject ){
        name    = "ie";
        version = UA.match( /ie ([\d.]+)/ )[1];
    }else if( DOC.getBoxObjectFor || DOC.getBindingParent ){
        name    = "firefox";
        version = UA.match( /firefox\/([\d.]+)/ )[1];
    }else if( GLOBAL.opera ){
        name    = "opera";
        version = UA.match( /opera.([\d.]+)/ )[1];
    }else if( 
        GLOBAL.chrome || 
        ( GLOBAL.MessageEvent && !DOC.getBoxObjectFor ) 
    ){
        name    = "chrome";
        version = UA.match( /chrome\/([\d.]+)/ )[1];
    }else if( GLOBAL.openDataBase ){
        name    = "safari";
        version = UA.match( /version\/([\d.]+)/ )[1];
    }else if( GLOBAL.process && process.versions && process.versions.node ){
        name    = "node";
        version = process.version;
    }

    Env.FormData   = GLOBAL.FormData;
    Env.isBrowser  = name !== "node";
    Env.global     = GLOBAL;
    Env.name       = name;
    Env.version    = version; 
    Env.root       = DOC.URL || ( name === "node" ? require( "path" ).dirname( require.main.filename ) : undefined );
    Env.platform   = GLOBAL.orientation != void 0 ? "ipod" : 
                         ( GLOBAL.navigator && navigator.platform ) || 
                         ( GLOBAL.process && process.platform );

    Env.CRLF       = Env.platform.indexOf( "win" ) !== -1 ? "\r\n" : "\n";
        
    Env.LocalStorage = GLOBAL.localStorage || null;

    Env.addEventListener = [
        function( target, type, handler, capture ){
            return target.addEventListener( type, handler, !!capture );
        },
        function( target, type, handler ){
            return target.attachEvent( "on" + type, handler );
        }
    ][ GLOBAL.addEventListener ? 0 : 1 ];

    Env.removeEventListener = [
        function( target, type, handler, capture ){
            target.removeEventListener( type, handler, capture )
        },
        function( target, type, handler ){
            target.detachEvent( "on" + type, handler );
        }
    ][ GLOBAL.removeEventListener ? 0 : 1 ];

    Env.XMLHttpRequest = ( function(){
        var xhr = null;
        
        if( GLOBAL.XMLHttpRequest ){
            xhr = GLOBAL.XMLHttpRequest;
        }else if( GLOBAL.XDomainRequest ){
            xhr = GLOBAL.XDomainRequest;
        }else if( GLOBAL.ActiveXObject ){
            forEach(
                [ "Msxml2.XMLHTTP", "Microsoft.XMLHTTP" ],
                function( libname ){
                    try{
                        new GLOBAL.ActiveXObject( libname );
                        xhr = GLOBAL.ActiveXObject( libname );
                    }catch( e ){

                    }
                }
            );
        }else if( Env.name === "node" ){
            try{
                xhr = require( "XMLHttpRequest" ).XMLHttpRequest;
            }catch( e ){
                xhr = null;
            }
        }

        return xhr;
    } )();

    if( Env.XMLHttpRequest ){
        Env.XMLHttpRequest2 = "withCredentials" in ( new Env.XMLHttpRequest ) ? Env.XMLHttpRequest : null;
    }

    Env.jsEngine = function(){
        var 
            engine = {
                name    : "unknow",
                version : "unknow"
            }
        ;

        switch( name ){
            case "ie":
                engine.name = version < 9 ? "JScript" : "Chakra";
            break;
            case "firefox":
                if( version < 3.5 ){
                    engine.name = "SpiderMonkey";
                }else if( version < 4 ){
                    engine.name = "TraceMonkey";
                }else if( version < 18 ){
                    engine.name = "JaegerMonkey";
                }else{
                    engine.name = "IonMonkey";
                }
            break;
            case "opera":
                if( version < 7 ){
                    engine.name = "Linear A";
                }else if( version < 9.5 ){
                    engine.name = "Linear B";
                }else if( version < 10.5 ){
                    engine.name = "Futhark";
                }else{
                    engine.name = "Carakan";
                }
            break;
            case "safari":
                engine.name = "Nitro";
            break;
            case "chrome":
                engine.name = "v8";
            break;
            case "node":
                engine.name    = "v8";
                engine.version = GLOBAL.process.versions.v8;
            break;
        }

        return engine;
    }();

    Env.jsEngine.parseJSON = function( json ){
        if( !R_JSON_SIGN.test( json ) ){
            throw new SyntaxError(
                "不被接受的 json 数据格式."
            );
        }
        return new Function( "return " + json + ";" )();
    };

    Env.renderEngine = function(){
        var 
            engine = {
                name    : "unknow",
                version : "unknow"
            }
        ;

        switch( name ){
            case "ie":
                engine.name    = "Trident";
                engine.version = XMLHttpRequest ? ( DOC.querySelectorAll ? 6 : 5 ) : 4;
            break;
            case "firefox":
                engine.name    = "Gecko";
                engine.version = DOC.getElementsByClassName ? 19 : 18;
            break;
            case "opera":
                engine.name    = "Presto";
                engine.version = !arguments.callee.caller ? ( DOC.getElementsByClassName ? 950 : 925 ) : 960;
            break;
            case "chrome":
                engine.name    = "Webkit";
            break;
            case "safari":
                engine.name    = "Webkit";
                engine.version = Browser.Features.xpath ? ( Browser.Features.query ? 525 : 420 ) : 419;
            break;
        }
        return engine;
    }();
    
    Env.renderEngine.currentStyle  = !!DOC_ROOT.currentStyle;
    Env.renderEngine.computedStyle = !!GLOBAL.getComputedStyle;
    Env.renderEngine.Xpath         = DOC.evaluate || null;
    Env.renderEngine.querySelector = DOC.querySelector || null;
    Env.renderEngine.WebGL         = GLOBAL.WebGLRenderingContext || null;
    Env.renderEngine.Canvas        = GLOBAL.HTMLCanvasElement || null;
        
} );

