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

Define( "Env", function( require, exports, module ){
    var 
        GLOBAL = function(){ return this }(),
        SLICE  = Array.prototype.slice,
        UA     = ( GLOBAL.navigator && navigator.userAgent || "" ).toLowerCase(),
        DOM    = GLOBAL.document || {},
        name   = "unknow",
        version= "unknow"
    ;

    if( GLOBAL.ActiveXObject ){
        name    = "ie";
        version = UA.match( /ie ([\d.]+)/ )[1];
    }else if( DOM.getBoxObjectFor || DOM.getBindingParent ){
        name    = "firefox";
        version = UA.match( /firefox\/([\d.]+)/ )[1];
    }else if( GLOBAL.opera ){
        name    = "opera";
        version = UA.match( /opera.([\d.]+)/ )[1];
    }else if( 
        GLOBAL.chrome || 
        ( GLOBAL.MessageEvent && !DOM.getBoxObjectFor ) 
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

    exports.global     = GLOBAL;
    exports.name       = name;
    exports.version    = version; 
    exports.platform   = GLOBAL.orientation != void 0 ? "ipod" : 
                         ( GLOBAL.navigator && navigator.platform ) || 
                         ( GLOBAL.process && process.platform );
        
    exports.LocalStorage = GLOBAL.localStorage || null;

    exports.XMLHttpRequest = ( function(){
        var xhr = null;
        
        if( GLOBAL.XMLHttpRequest ){
            xhr = GLOBAL.XMLHttpRequest;
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
        }else if( exports.name === "node" ){
            try{
                xhr = require( "XMLHttpRequest" ).XMLHttpRequest;
            }catch( e ){
                xhr = null;
            }
        }

        return xhr;
    } )();

    if( exports.XMLHttpRequest ){
        exports.XMLHttpRequest2 = "withCredentials" in ( new exports.XMLHttpRequest ) ? exports.XMLHttpRequest : null;
    }

    exports.jsEngine = function(){
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

    exports.renderEngine = function(){
        var 
            engine = {
                name    : "unknow",
                version : "unknow"
            }
        ;

        switch( name ){
            case "ie":
                engine.name    = "Trident";
                engine.version = XMLHttpRequest ? ( DOM.querySelectorAll ? 6 : 5 ) : 4;
            break;
            case "firefox":
                engine.name    = "Gecko";
                engine.version = DOM.getElementsByClassName ? 19 : 18;
            break;
            case "opera":
                engine.name    = "Presto";
                engine.version = !arguments.callee.caller ? ( DOM.getElementsByClassName ? 950 : 925 ) : 960;
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

    
    exports.renderEngine.Xpath         = DOM.evaluate || null;
    exports.renderEngine.querySelector = DOM.querySelector || null;
    exports.renderEngine.WebGL         = GLOBAL.WebGLRenderingContext || null;
    exports.renderEngine.Canvas        = GLOBAL.HTMLCanvasElement || null;
    
} );