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


Define("Switchable", Depend("~/Cox/Extends/jQuery", "~/Cox/Extends/jQuery.Dom", "~/Cox/Net/Loader"), function(require, Switchable, module)
{
    var 
        jQuery = require("jQuery"),
        Dom    = require("Dom"),
        Loader = require("Loader")
    ;
    Switchable = module.exports = Class("Switchable", Abstract, Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = function()
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("prev"),
                new Cox.Event("next"),
                new Cox.Event("switch"),
                new Cox.Event("SwitchComplete")
            );
        };

        Public.prev     = Function;
        Public.next     = Function; 
        Public.switchTo = ParamTypeTable(Number);
    });

    Switchable.ScrollSwitch = Class("ScrollSwitch", Extends(Switchable), function(Static, Public)
    {
        var 
            DIRECTION_RELEVANCE_OSIZEPROP = {
                left  : "outerWidth",
                right : "outerWidth",
                up    : "outerHeight",
                down  : "outerHeight"
            },
            DIRECTION_RELEVANCE_SIZEPROP = {
                left   : "width",
                right  : "width",
                up     : "height",
                down   : "height"
            },
            DIRECTION_RELEVANCE_SCROLLPROP = {
                left  : "left",
                right : "left",
                up    : "top",
                down  : "top"
            },
            DIRECTION = {
                left  : -1,
                right : 1,
                up    : -1,
                down  : 1
            }
        ;

        

        Static.LEFT  = "left";
        Static.RIGHT = "right";
        Static.UP    = "up";
        Static.DOWN  = "down";

        Public.constructor = XFunction(jQuery, Optional(Number, 1), Optional(String, Static.LEFT), function(items, pageSize, direction)
        {
            this.Super("constructor");
            pageSize            = Math.max(0, ~~pageSize);
            this._items         = items;
            this._listwrap      = items.parent();
            this._visibleWidth  = this._listwrap.width();
            this._visibleHeight = this._listwrap.height();
            this._scrollSize    = items[DIRECTION_RELEVANCE_OSIZEPROP[direction]]() * pageSize;
            this._pageCount     = items.length / pageSize + (items.length % pageSize ? 1 : 0);
            this._current       = 1;
            this._scrollprop    = DIRECTION_RELEVANCE_SCROLLPROP[direction];
            this._direction     = DIRECTION[direction];
            this._listwrap[DIRECTION_RELEVANCE_SIZEPROP[direction]](this._scrollSize / pageSize * items.length);
            this._listwrap.css(this._scrollprop, this._direction === -1 ? 0 : -(this._pageCount - 1) * this._scrollSize);
        });

        Public.prev = function()
        {
            var page = Math.max(this._current-1, 0);
            this.fireEvent("prev", [page]);
            this.switchTo(page);
        };

        Public.next = function()
        {
            var page = Math.min((this._current || 1) + 1, this._pageCount);
            this.fireEvent("next", [page]);
            this.switchTo(page);
        };

        Public.switchTo = XFunction(Number, function(page)
        {
            var 
                anima = null,
                _this = this
            ;

            page = Math.max(Math.min(~~page, this._pageCount), 1);
            if (page === this._current) {
                return;
            }
            this.fireEvent("switch", [page]);
            anima         = {};
            this._current = page;
            if (this._direction === -1) {
                anima[this._scrollprop] = -(page - 1) * this._scrollSize;
            } else {
                anima[this._scrollprop] = -(this._pageCount - page) * this._scrollSize;
            }
            this._listwrap.stop().animate(
                anima,
                function()
                {
                    _this.fireEvent("SwitchComplete", [page]);
                }
            );
        });
        Public.getCurrent = function()
        {
            return ~~this.__cureent;
        };
        Public.isFirst = function()
        {
            return ~~this._current <= 1;
        };

        Public.isLast = function()
        {
            return ~~this._current === this._pageCount;
        };

    });
});


