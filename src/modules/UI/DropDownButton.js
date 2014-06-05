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
 * <DropDownButton.js> - 2014/4/19
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"DropDownButton", 
Depend("~/Cox/Extends/jQuery"), 
function(require, DropDownButton, module)
{
    var 
        jQuery = require("jQuery"),
        DOC    = jQuery(document)
    ;
    DropDownButton = module.exports = Class("DropDownButton", Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = function(button)
        {
            var _this = this;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("dropdown"),
                new Cox.Event("itemClick")
            );
            this._button  = button;
            this.dropdown = button.find(".dropdown");
            button.find("i.trigger").on("click", function(event)
            {
                button.addClass("active");
                DOC.off("click", gobalClickHideButtonDropdown);
                DOC.one("click", gobalClickHideButtonDropdown);
                event.stopPropagation();
            });
            this.dropdown.on("click", stopPropagation);
        };
        this.on = function(a, b, c, d, e, f, g, h, i, j, k) {
            return this._button.on(a, b, c, d, e, f, g, h, i, j, k);
        };
        this.off = function(a, b, c, d, e, f, g, h, i, j, k) {
            return this._button.off(a, b, c, d, e, f, g, h, i, j, k);
        };
    });
    DOC.on("click", ".button.dropdown-button>i.trigger", function(event)
    {
        jQuery(this).parent().toggleClass("active");
        DOC.off("click", gobalClickHideButtonDropdown);
        DOC.one("click", gobalClickHideButtonDropdown);
        event.stopPropagation();
    });

    function gobalClickHideButtonDropdown()
    {
        jQuery(".button.dropdown-button.active").removeClass("active");
    };
    function stopPropagation(event){
        event.stopPropagation();
    }
});