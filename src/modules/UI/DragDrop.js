/***
 *  ▄████▄      ▒█████     ▒██   ██▒ Cox JavaScript Framework
 * ▒██▀ ▀█     ▒██▒  ██▒   ▒▒ █ █ ▒░   
 * ▒▓█    ▄    ▒██░  ██▒   ░░  █   ░   
 * ▒▓▓▄ ▄██▒   ▒██   ██░    ░ █ █ ▒    
 * ▒ ▓███▀ ░   ░ ████▓▒░   ▒██▒ ▒██▒   
 * ░ ░▒ ▒  ░   ░ ▒░▒░▒░    ▒▒ ░ ░▓ ░   
 *   ░  ▒        ░ ▒ ▒░    ░░   ░▒ ░   
 * ░           ░ ░ ░ ▒      ░    ░   
 * ░ ░             ░ ░      ░    ░     
 * ░                  
 * ----------------------------------------------------------------------------
 * <DragDrop.js> - 2014/4/7
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */


Define("DragDrop", Depend("~/Cox/Extends/jQuery"), function(require, DragDrop, module)
{
    var
        jQuery = require("jQuery")
    ;

    DragDrop = module.exports = Class("DragDrop", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_DRAGGABLE = /\bdraggable\b/,
            DOC          = jQuery(document),
            target       = null,
            obj          = null,
            left         = null,
            top          = null
        ;

        Public.constructor = XFunction(String, Optional(Boolean, true), function(selector, updateZindex)
        {
            var 
                _this  = this,
                zIndex = 0
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("drag"),
                new Cox.Event("draging"),
                new Cox.Event("drop")
            );

            DOC.on("mousedown", selector, function(event)
            {
                
                obj    = _this;
                target = _this._target = jQuery(this);
                left   = event.pageX - parseInt(target.css("left"));
                top    = event.pageY - parseInt(target.css("top"));
                DOC.setCapture && DOC.setCapture();
                if (updateZindex) {
                    target.css("zIndex", zIndex++);
                }
                obj.fireEvent("drag", [target]);
            });
        });

        DOC.on("mousemove", function(event)
        {
            var 
                acitve = null, 
                x      = null, 
                y      = null
            ;
            if (!target) return;
            active = target[0];
            x = active.style.left = event.pageX - left + "px";
            y = active.style.top  = event.pageY - top + "px";
            obj.fireEvent("draging", [target, x, y]);
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
        });

        DOC.on("mouseup", function(event)
        {
            if (!target) return;
            obj.fireEvent("drop", [target]);
            target = null;
            DOC.releaseCapture && DOC.releaseCapture();
        });

    });
});

