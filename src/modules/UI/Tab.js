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
 * <Tab.js> - 2014/4/22
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */


Define(
"Tab",
Depend("~/Cox/Extends/jQuery"),
function(require, Tab, module)
{
    var 
        jQuery = require("jQuery")
    ;
    Tab = module.exports = Class("Tab", Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = function(container)
        {
            var _this = this;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("switchBefore"),
                new Cox.Event("switchAfter"),
                new Cox.Event("switch")
            );
            this._container = container;
            this._tabs      = container.find("ul.tabs li");
            this._panels    = container.find(".panel-container .panel");
            if (this._tabs.filter("active").length === 0) {
                this._tabs.slice(0, 1).addClass("active");
                this._panels.slice(0, 1).addClass("active");
            }
            container.on("click", "ul.tabs li", function()
            {
                _this.switchTab(jQuery(this).index());
            });
        };

        Public.switchTab = function(index) {
            var 
                tab  = this._tabs.slice(index, index + 1)
                prev = null
            ;
            if (tab.hasClass("active")) {
                return;
            }
            prev = this._tabs.filter(".active");
            this.fireEvent("switchBefore", [index, prev.index()]);
            this._tabs.removeClass("active");
            this.fireEvent("switch", [index]);
            tab.addClass("active");
            this._panels.removeClass("active");
            this._panels.slice(index, index+1).addClass("active");
            this.fireEvent("switchAfter", [index]);
        };
    });
});
