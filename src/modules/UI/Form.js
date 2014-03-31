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
 * <Form.js> - 2014/3/23
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */


Define(
"Form",
Depend("~/Cox/Extends/jQuery"),
function(require, Form, module)
{
    var 
        jQuery = require("jQuery")
    ;

    Form = module.exports = Class("Form", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_FILTER_INPUT = /^(?:button|image|reset|submit)$/i, 
            RE_INPUT_SIGN   = /^(?:input|textarea|select)$/i,
            RE_INDEX        = /^([^\[\]])+\[(\d+)\]$/,
            InputElement    = {
                __instancelike__ : function(obj)
                {
                    return obj && RE_INPUT_SIGN.test(obj.nodeName||"") && !RE_FILTER_INPUT.test(obj.type||"");
                }
            }
        ;

        Public.constructor = XFunction(jQuery, function(form)
        {
            var _this = this;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("append"),
                new Cox.Event("remove")
            );
            this._form       = form;
            this._formAction = null;
            this._inputs     = {};
            form.find("input, select, textarea").each(function(index, input)
            {
                var 
                    type = (input.getAttribute("type") || "").toLowerCase(),
                    name = input.getAttribute("name")
                ;
                if (!name || RE_FILTER_INPUT.test(type)) {
                    return;
                }

                if (name in _this._inputs) {
                    _this._inputs[name].push(input);
                } else {
                    _this._inputs[name] = jQuery(input);
                }
            });
        });

        Public.get = XFunction(String, function(name)
        {
            var match = name.match(RE_INDEX);
            if (match && this._inputs[match[1]]) {
                return jQuery(this._inputs[match[1]][match[2]]);
            } else {
                return this._inputs[name];
            }
        });

        Public.append = XFunction(Params(InputElement), function(inputs)
        {
            var 
                _this  = this,
                inputs = this._inputs
            ;
            XList.forEach(inputs, function(input)
            {
                var name = input.name;
                if (!name) {
                    return;
                }
                if (name in inputs) {
                    inputs[name].push(input);
                } else {
                    inputs[name] = jQuery(input);
                }
                _this.fireEvent("append", [inputs[name]]);
            });
        });

        Public.remove = XFunction(Params(String), function(names)
        {
            var 
                _this  = this,
                inputs = this._inputs
            ;
            XList.forEach(names, function(name)
            {
                var 
                    match = name.match(RE_INDEX),
                    temp  = null
                ;
                if (match) {
                    var name = match[1];
                    if (!(inputs[name] instanceof jQuery)) {
                        return;
                    }
                    temp = inputs[name].splice(match[2], 1)[0];
                    if (inputs[name].length === 0) {
                        delete inputs[name];
                    }
                } else {
                    temp = inputs[name];
                    delete inputs[name];
                }
                temp && _this.fireEvent("remove", [temp]);
            });

        });
        Public.setAction = XFunction(String, function(action)
        {
            this._form.attr("action", action);
            this._formAction = null;
        });
        Public.setAction.define(Function, function(action)
        {
            this._formAction = action;
        });
        Public.getData = function()
        {
            
        };
        Public.submit = function()
        {
            if (!this._formAction) {
                this._form.submit();
                return;
            }
            return this._formAction(this.getData());
        };
        
    });

});