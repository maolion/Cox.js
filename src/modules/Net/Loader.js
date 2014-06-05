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

Define("Loader", Depend("~/Cox/Extends/jQuery", "~/Cox/Tools/Queue", "~/Cox/Env"), function(require, Loader, module)
{

    var 
        Queue           = require("Queue"),
        jQuery          = require("jQuery"),
        Env             = require("Env"),
        IE              = Env.name === "ie",
        OPERA           = Env.name === "opera",
        OLD_IE          = IE && ~~Env.version < 9,
        RE_JS_URI_SIGN  = /\.js\b/i,
        RE_CSS_URI_SIGN = /\.css\b/i,
        ImageElement    = {
            __instancelike__ : function(obj)
            {
                if (!obj || obj.nodeName !== "IMG" || obj.nodeType !== 1) {
                    return false;
                }
                return true;   
            }
        }
    ;

    Loader = module.exports = Class("Loader", Abstract, Extends(Queue.Handler), function(Static, Public)
    {
        Public.constructor = function()
        {
            var _this = this;
            this.Super("constructor");
            this._curObj = null;
        };

        Public.exec = function(obj)
        {
            this._curObj = obj;
            this._busy   = true;
        };

        Public.reset = function()
        {
            this._busy   = false;
            this._curObj = null;
        };

    });

    Loader.ImageLoader = Class("ImageLoader", Extends(Queue), function(Static, Public)
    {
        var _Loader = null;
        Static.DEFAULT_THREAD_COUNT = 3;

        _Loader = Class("_Loader", Extends(Loader), function(Static, Public)
        {
            Public.constructor = function()
            {
                var _this = this;
                this.Super("constructor");
                this._onLoadHandler = [
                    function()
                    {
                        setTimeout(function(){
                            _this.fireEvent("done", [true, _this._curObj]);
                        }, 0);
                        _this._curObj.off("error", _this._onErrorHandler);
                        
                    },
                    function()
                    {
                        _this._curObj.off("error", _this._onErrorHandler);
                        _this.fireEvent("done", [true, _this._curObj]);
                    }
                ][OLD_IE ? 0 : 1];

                this._onErrorHandler = function()
                {
                    _this._curObj.off("load", _this._onLoadHandler);
                    _this.fireEvent("done", [false, _this._curObj]);
                }
            };

            Public.exec = function(image)
            {
                var 
                    src   = image.attr("data-src")
                ;
                this.Super("exec", image);
                if (!src) {
                    this.fireEvent("done", [false, image]);
                    return;
                }  
                image.one("load", this._onLoadHandler);
                image.one("error", this._onErrorHandler);
                image.attr('src', src);
                image = null;
            }
        });
    
        Static.load = XFunction(jQuery, Optional(Function), function(image, callback)
        {
            var load = new Deferred;
            image.one("load", loadHandler);
            image.one("error", errorHandler);
            image.attr('src', image.attr('data-src'));
            function loadHandler()
            {
                load.resolved(image);
                image.off("error", errorHandler);
                callback&&callback(image, true);
            }
            function errorHandler()
            {
                load.rejected(image);
                image.off("load", loadHandler);
                callback&&callback(image);
            }
            return load;
        });

        Public.constructor = XFunction(Optional(Number, Static.DEFAULT_THREAD_COUNT), function(threadCount)
        {
            this.Super("constructor", _Loader, threadCount);
        });

        Public.load = XFunction(jQuery, function(imgs)
        {
            var _this = this;
            imgs.each(function(index, img)
            {
                _this.push(imgs.slice(index, index + 1));
            });
        });
        Public.load.define(Params(ImageElement), function(imgs)
        {
            var _this = this;
            XList.forEach(imgs, function(img, index)
            {
                _this.push(jQuery(img));
            });
        });

        Public.load.define(String, function(src)
        {
            this.push(jQuery("<img data-src='"+src+"'/>"));
        });

        Public.load.define(Array, function(imgs)
        {
            for (var i = 0, l = imgs.length; i < l; i++) {
                if (!(imgs[i] instanceof jQuery)) {
                    throw new TypeError();
                }
                this.push(imgs[i]);
            }
        });
    });
    var ResLoader = Class("ResLoader", Abstract, Extends(Loader), function(Static, Public)
    {
        var
            _head    = jQuery("html head")[0],
            OK_STATE = {
                "loaded"   : true,
                "complete" : true
            }
        ;

        Public.constructor = function()
        {
            var _this = this;
            this.Super("constructor");
            this._timeout = null;
            this._onLoadHandler = [
                function()
                {
                    var loader = this;
                    if (this.__load) return;
                    if(loader.readyState && !(loader.readyState in OK_STATE)){
                        return;
                    }
                    clearTimeout(_this._timeout);
                    _this._curObj.off("error", _this._onErrorHandler);
                    _this._curObj.off("load", _this._onLoadHandler);
                    _this._curObj.off("readystatechange", _this._onLoadHandler);
                    _this.fireEvent("done", [true, _this._curSrc]);
                    
                    this.__load = true;
                },
                function()
                {
                    clearTimeout(_this._timeout);
                    if (_this._curObj)  {
                        _this._curObj.off("error", _this._onErrorHandler);
                        _this._curObj.off("done", _this._onLoadHandler);
                        _this._curObj.off("readystatechange", _this._onLoadHandler);
                    }
                    _this.fireEvent("done", [true, _this._curSrc]);
                }
            ][OLD_IE ? 0 : 1];

            this._onErrorHandler = function()
            {
                clearTimeout(_this._timeout);
                _this._curObj.off("load", _this._onLoadHandler);
                _this._curObj.off("readystatechange", _this._onLoadHandler);
                _this.fireEvent("done", [false, _this._curSrc]);
            }
        };
        Public.exec = function(src)
        {
            var obj = this.createElement();
            this._curSrc = src;
            this.Super("exec", obj);
            obj.one("load", this._onLoadHandler);
            obj.one("readystatechange", this._onLoadHandler);
            obj.one("error", this._onErrorHandler);
            //_head.appendTo(obj);

            _head.appendChild(obj[0]);
            obj[0].setAttribute(
                obj[0].nodeName === "LINK" ? "href" : "src",
                src
            );
            //obj.attr( obj[0].nodeName === "LINK" ? "href" : "src", src );
            if (OPERA) {
                this._timeout = setTimeout(this._onErrorHandler, 30000);
            }
            obj = null;
        };
        Public.createElement = Function;
    });
    
    Loader.loadStyleSheet = XFunction(String, [
        function(cssText){
            document.createStyleSheet().cssText = cssText;
        },
        function(cssText){
            var style         = document.createElement('style');
            style.type        = 'text/css';
            style.textContent = cssText;
            document.documentElement.insertBefore( style, null );   
        }
    ][document.createStyleSheet ? 0 : 1]);
    

    Loader.CSSLoader = Class("CSSLoader", Extends(Queue), function(Static, Public)
    {
        var 
            _Loader  = null
        ;
        Static.DEFAULT_THREAD_COUNT = 3;

        _Loader = Class("_Loader", Extends(ResLoader), function(Static, Public)
        {
            Public.createElement = function()
            {
                return jQuery('<link rel="stylesheet" />');
            };
        });

        Public.constructor = XFunction(Optional(Number, Static.DEFAULT_THREAD_COUNT), function(threadCount)
        {
            this.Super("constructor", _Loader, threadCount);
        });
        Public.load = XFunction(Params(String), function(srcs)
        {
            var _this = this;
            XList.forEach(srcs, function(src)
            {
                _this.push(src);
            });
        });
        Public.load.define(Array, function(srcs)
        {
            this.load.apply(this, srcs);
        });
    });
    Loader.ScriptLoader = Class("ScriptLoader", Extends(Queue), function(Static, Public)
    {
        var 
            _Loader  = null
        ;
        Static.DEFAULT_THREAD_COUNT = 3;
        _Loader = Class("_Loader", Extends(ResLoader), function(Static, Public)
        {
            Public.createElement = function()
            {
                return jQuery(document.createElement("SCRIPT"));
                //return jQuery('<script type="text/javascript"></script>');
            };
        });

        Public.constructor = XFunction(Optional(Number, Static.DEFAULT_THREAD_COUNT), function(threadCount)
        {
            this.Super("constructor", _Loader, threadCount);
        });
        Public.load = XFunction(Params(String), function(srcs)
        {
            var _this = this;
            XList.forEach(srcs, function(src)
            {
                _this.push(src);
            });
        });
        Public.load.define(Array, function(srcs)
        {
            this.load.apply(this, srcs);
        });
    });

    Loader.load   = XFunction(Optional(Number, 3), Params(String), function(threadCount, srcs)
    {
        var 
            jsload    = new Deferred,
            cssload   = new Deferred,
            load      = new DeferredList(jsload, cssload),
            jsloader  = new Loader.ScriptLoader(threadCount),
            cssloader = new Loader.CSSLoader(threadCount)
        ;
        jsloader.srcs   = [];
        cssloader.srcs  = [];  
        jsloader._load  = jsload;
        cssloader._load = cssload;
        
        function pass(ok, src)
        {
            ok && XList.remove(this.srcs, src);
        }
        function done()
        {
            if (this.srcs.length) {
                this._load.rejected(this.srcs);
            } else {
                !this._load.isResolved() && this._load.resolved();
            }
        }

        jsloader.on("pass", pass);
        cssloader.on("pass", pass);
        jsloader.on("done", done);
        cssloader.on("done", done);

        XList.forEach(srcs, function(src)
        {
            if (RE_JS_URI_SIGN.test(src)) {
                jsloader.srcs.push(src);
            } else {
                cssloader.srcs.push(src);
            }
        });
        
        jsloader.srcs.length ? jsloader.load(jsloader.srcs) : jsload.resolved();
        cssloader.srcs.length ? cssloader.load(cssloader.srcs) : cssload.resolved();
        
        return load;
    });

});
