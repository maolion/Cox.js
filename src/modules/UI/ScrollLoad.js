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


Define( "ScrollLoad", Depend("~/Cox/Extends/jQuery", "~/Cox/Extends/jQuery.Dom", "~/Cox/Tools/Queue", "~/Cox/Net/Loader"), function(require, ScrollLoad, module)
{
    var 
        jQuery = require("jQuery"),
        Dom    = require("jQuery.Dom"),
        Queue  = require("Queue"),
        Loader = require("Loader"),
        WIN    = jQuery(window),
        DOC    = jQuery(document)
    ;
    ScrollLoad = module.exports = Class("ScrollLoad", Abstract, Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = XFunction(Queue, Optional(jQuery, WIN), function(loader, container)
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("visible"),
                new Cox.Event("listenerScroll"),
                new Cox.Event("loadBefore"),
                new Cox.Event("loadComplete"),
                new Cox.Event("done")
            );
            this._loader    = loader;
            this._container = container;
        });
        Public.load = Function;
    });
    ScrollLoad.Image = Class("ScrollLoadImage", Extends(ScrollLoad), function(Static, Public)
    {
        var 
            DELY_TIMEOUT  = 50,
            DefaultLoader = new Loader.ImageLoader,
            uid           = new Date().getTime()
        ;
                    
        Public.constructor = XFunction(Optional(Loader.ImageLoader, DefaultLoader), Optional(jQuery, WIN), Optional(Boolean, false) , function(loader, container, timely)
        {
            var 
                _this     =  this,
                delyTimer = null
            ;
            this.Super("constructor", loader, container);
            this._buffer    = [];
            this._images    = {};
            this._listener  = false;

            loader.on("next", function(image)
            {
                if (_this._images.hasOwnProperty(image.attr("scroll-load-uid"))) {
                    _this.fireEvent("loadBefore", [image]);
                }
            });

            loader.on("pass", function(loaded, image)
            {
                var uid = image.attr("scroll-load-uid");
                if (_this._images.hasOwnProperty(uid)) {
                    delete _this._images[uid];
                    image.removeAttr("scroll-load-uid");
                    _this.fireEvent("loadComplete", [loaded, image]);
                }
            });

            this._loadHandler = function()
            {
                var 
                    buffer= _this._buffer;
                    vimgs = [],
                    n     = 0
                ;
                for (var i = 0, l = buffer.length; i < l; i++) {
                    var img = buffer[i];
                    if (Dom.elementIsVisible(img, _this._container)) {
                        var suid = uid++;
                        _this._images[suid] = 1;
                        img.attr("scroll-load-uid", suid);
                        vimgs.push(img);
                    } else {
                        buffer[n++] = img;
                    }
                }
                buffer.length = n;
                if (vimgs.length) {
                    _this.fireEvent("visible", [vimgs]);
                    loader.load(vimgs);
                }
                if (!n && _this._listener) {
                    _this.fireEvent("done");
                    _this._container.off("scroll", _this._loadHandler.wrap);
                    _this._listener = false;
                }
            };

            this._loadHandler.wrap  = [
                this._loadHandler,
                function()
                {
                    delyTimer && clearTimeout(delyTimer);
                    delyTimer = setTimeout(_this._loadHandler, DELY_TIMEOUT);
                }
            ][timely ? 0 : 1];

        });
        
        Public.load = XFunction(Array, function(imgs)
        {
            this._buffer.push.apply(this._buffer, XList.map(imgs, getJQueryObject));
            if (!this._listener) {
                this._listener = true;
                this.fireEvent("listenerScroll");
                this._container.on("scroll", this._loadHandler.wrap);
            }
        });

        Public.load.define(Params(Dom.XImageElement), function(imgs)
        {
            this.load(imgs);
        });

        Public.load.define(jQuery, function(imgs)
        {
            this.load(imgs.get());
        });

        function getJQueryObject(obj)
        {
            return jQuery(obj);
        };
    });
} );
