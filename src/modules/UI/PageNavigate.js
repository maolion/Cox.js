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
 * <Dialog.js> - 2014/4/5
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define("PageNavigate", Depend("~/Cox/Extends/jQuery"), function(require, PageNavigate, module)
{
    var 
        jQuery = require("jQuery")
    ;

    PageNavigate = module.exports = Class("PageNavigate", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            FIRST_BTN_TEMP = '<a href="javascript:;" class="button index">1</a>',
            PREV_BTN_TEMP  = '<a href="javascript:;" class="button icon" next="prev"><i class="icon arrow-left no-rotate"></i></a>',
            NEXT_BTN_TEMP  = '<a href="javascript:;" class="button icon" next="next"><i class="icon arrow-right no-rotate"></i></a>'
        ;
        Public.constructor = XFunction(jQuery, Number, Optional(Number, 3), function(container, pageCount, neighborCount)
        {
            var 
                _this = this,
                split = 0
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("active")
            );
            this._container     = container;
            this._btnList       = container.find("div.btn-list");
            this._input         = container.find("div.input input");
            this._goBtn         = container.find("div.input button");
            this._pageCount     = Math.abs(~~pageCount);
            this._neighborCount = neighborCount = Math.abs(~~neighborCount);
            split               = this._neighborCount / 2;
            this._rightNCount   = ~~split;
            this._leftNCount    = this._rightNCount >= neighborCount - 1 ? 0 : this._rightNCount - (split % 2 ? 0 : 1);
            this._activePage    = 1;
            this.updateBtnList();
            this._input.val("1");
            this._btnList.on("click", "a.index", function()
            {
                _this.active(this.innerHTML);
            });
            this._btnList.on("click", "a[next]", function()
            {
                _this[this.getAttribute("next")]();
            });
            this._goBtn.on("click", function()
            {
                _this.active(_this._input.val() || this._activePage);
            });
        });

        Public.active = function(page, notNotify)
        {
            page = Math.max(1, Math.min(this._pageCount, ~~page));
            if (page === this._activePage) return;
            !notNotify && this.fireEvent("active", [page, this._activePage]);
            this._input.val(page);
            this._activePage = page;
            this.updateBtnList();
        };
        Public.prev = function()
        {
            this.active(this._activePage - 1);
        };
        Public.next = function()
        {
            this.active(this._activePage + 1);
        };

        Public.updateBtnList = function()
        {
            var
                page          = this._activePage,
                pageCount      = this._pageCount,
                lnc           = this._leftNCount,
                rnc           = this._rightNCount,
                limit_s       = Math.max(page - lnc, 1),
                limit_e       = Math.min(page + rnc, pageCount),
                html          = "",
                LAST_BTN_TEMP = '<a href="javascript:;" class="button '+(page === pageCount ? 'active' : 'index')+'">'+pageCount+'</a>'
            ;
            if (limit_e - page !== rnc) {
                limit_s = Math.max(limit_s - (rnc - (limit_e - page)), 1);
            }
            if (page - limit_s !== lnc) {
                limit_e = Math.min(limit_e + (lnc - (page - limit_s)), pageCount);
            }

            if (limit_s === 2) {
                html += FIRST_BTN_TEMP;
            }
            if (limit_s > 2) {
                html += FIRST_BTN_TEMP + PREV_BTN_TEMP;
            }
            for (var i = limit_s; i <= limit_e; i++) {

                html += '<a href="javascript:;" class="button '+(page === i ? 'active': 'index')+'">'+i+'</a>';
            }

            if (limit_e < pageCount - 1) {
                html += NEXT_BTN_TEMP + LAST_BTN_TEMP;
            }
            if (limit_e === pageCount - 1) {
                html += LAST_BTN_TEMP;
            }
            this._btnList.html(html);
        };
        Public.getActive = function()
        {
            return this._activePage;
        };
        Public.getPageCount = function()
        {
            return this._pageCount;
        };

        Public.setPageCount = function(pageCount)
        {
            if (pageCount === this._pageCount) return;
            this._pageCount = ~~pageCount;
            this.updateBtnList();
        };

    });


});