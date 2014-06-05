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
 * <SwitchButton.js> - 2014/4/9
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"SwitchButton", 
Depend("~/Cox/Extends/jQuery"), 
function (require, SwitchButton, module)
{
    var 
        jQuery = require("jQuery")
    ;
    SwitchButton = module.exports = Class("SwitchButton", Extends(Cox.EventSource), function(Static, Public)
    {
        var TEMPLATE = '<label class="switch-button {0}"><input {0} {1} type="checkbox" /><span></span></label>';
        
        Static.create = function(check, props, small, cls)
        {
            return XString.format(TEMPLATE, (check ? "checked" : "") + (small ? " small" : "") + (cls ? " " +cls : ""), props || "");
        };
        Static.onClick = function()
        {
            var check = jQuery(this);
            if (check.hasClass("disabled")) return;
            check.toggleClass("checked");
        };
        Static.update = function(checkbox)
        {
            var checked = checkbox.checked;
            jQuery(checkbox).parent()[checked ? "addClass" : "removeClass"]("checked");
        };

        Public.constructor = function(button)
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("switch")
            );
            this._button = button;
            this._check  = button.find("input[type=checkbox]")[0];
            /*if (this._check.checked) {
                this._button.addClass("checked");
            } else {
                this._button.removeClass("checked");
            }*/
        };

        Public.checked = function()
        {
            this._button.addClass("checked");
            this._check.checked = true;
            this.fireEvent("switch", [true]);
        };

        Public.unChecked = function()
        {
            this._button.removeClass("checked");
            this._check.checked = false;
            this.fireEvent("switch", [false]);
        };

        Public.toggle = function(toggle)
        {
            var checked = null;
            if (arguments.length > 0) {
                console.log(toggle);
                this._button[toggle ? "addClass" : "removeClass"]("checked");
                checked = this._check.checked = toggle;
            } else {
                this._button.toggleClass("checked");
                checked = this._check.checked = this._button.hasClass("checked");
            }
            this.fireEvent("switch", [checked]);
        };

        Public.isChecked = function()
        {
            return this._check.checked;
        };

        Public.disabled = function()
        {
            this._button.addClass("disabled");
            this._check.disabled = true;
        };
        
        Public.enabled = function()
        {
            this._button.removeClass("disabled");
            this._check.disabled = false;
        };
    });
    jQuery(document).on("click", "label.switch-button", SwitchButton.onClick);
});