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

Define("Radio", Depend("~/Cox/Extends/jQuery"), function(require, Radio, module)
{
    Radio = Class("Radion", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            COMPONENT_STRUCT = [
            '<a class="cox-ui-form-radio" title=""></a>',
            '<span class="text" >{0}</span><span class="state"></span>'
            ]
        ;

        Public.constructor = XFunction(jQuery, Optional(String), function(radios, initValue)
        {
            var 
                _this   = this,
                buttons = null
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("checked")
            );
            radios.wrap(COMPONENT_STRUCT[0]);
            buttons = radios.parent();
            
            this._radios  = radios;
            this._buttons = buttons;
            this._disable = false;

            radios.each(function(index, item)
            {
                var parent = buttons.slice(index, index+1);
                parent.append(XString.format(COMPONENT_STRUCT[1], item.getAttribute("label")));
                parent.attr("title", item.getAttribute("title"));
                if (initValue && initValue == item.value) {
                    item.checked = true;
                }
                (initValue ? initValue == item.value : item.checked) && parent.addClass("cox-ui-form-radio-checked");
            }); 

            buttons.on("click", function()
            {
                var 
                    btn   = jQuery(this),
                    radio = radios[btn.index()]
                ;
                if (_this._disable) return;
                buttons.removeClass("cox-ui-form-radio-checked");
                btn.addClass("cox-ui-form-radio-checked");
                _this.fireEvent("checked", [radio.value]);
                radio.checked = true;
            });
        });

        Public.getChecked = function()
        {
            var value = null;
            this._radios.each(function(index, item)
            {
                if (item.checked) {
                    value = item.value;
                    return false;
                }

            });
            return value;
        };

        Public.setChecked = XFunction(String, function(value)
        {
            var 
                _this   = this,
                buttons = this._buttons
            ;
            if (this._disable) return;
            this._radios.each(function(index, item)
            {
                if (item.value == value) {
                    var btn = buttons.slice(index, index+1);
                    buttons.removeClass("cox-ui-form-radio-checked");
                    btn.addClass("cox-ui-form-radio-checked");
                    item.checked = true;
                    _this.fireEvent("checked", [item.value]);
                    return false;
                }
            });
        });

        Public.setChecked.define(Number, function(index)
        {

            var 
                index = Math.max(0, Math.min(~~index, this._radios.length - 1)),
                btn = this._buttons.slice(index, index+1),
                radio = this._radios[index]
            ;
            if (this._disable) return;
            this._buttons.removeClass("cox-ui-form-radio-checked");
            btn.addClass("cox-ui-form-radio-checked");
            this.fireEvent("checked", [radio.value]);
            radio.checked = true;
        });
        Public.disable = function()
        {
            this._disable = true;
            this._buttons.css("opacity", "0.5");
            this._radios.each(function(index, item)
            {
                item.disable = true;
            });
        };
        Public.enable = function()
        {
            this._disable = false;
            this._buttons.css("opacity", "1");
            this._radios.each(function(index, item)
            {
                item.disable = false;
            });
        };
        Public.isDisabled = function()
        {
            return this._disable;
        };

    });
    module.exports = Radio;
});

