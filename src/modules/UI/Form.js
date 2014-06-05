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
Depend("~/Cox/Extends/jQuery", "./Form/Validation"),
function(require, Form, module)
{
    var 
        jQuery     = require("jQuery"),
        Validation = require("Validation")
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

        Public.constructor = function(form)
        {
            var 
                _this = this,
                inputs = null
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("submit"),
                new Cox.Event("append"),
                new Cox.Event("remove")
            );
            this.form        = form;
            this.V           = null;
            this._formAction = null;
            this._inputs     = {};
            this.tips        = {};
            inputs = form.find("input, select, textarea");
            inputs.each(function(index, input)
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
                    _this.form[name] = _this._inputs[name] = jQuery(input);
                    _this.tips[name] = form.find('span.tip[name='+name+']');
                }
            });
            form.find("button, input[type=submit], input[type=reset]").on("click", preventDefault);
            inputs = inputs.filter("[test]");
            if (inputs.length) {
                this.V = new Validation(inputs, true);
                this.V.on("pass", function(ok, obj)
                {
                    var 
                        tip   = _this.tips[obj.name],
                        input = _this._inputs[obj.name]
                    ;
                    if (ok) {
                        input.removeClass("error");
                        tip.removeClass("error");
                        tip.html(tip.tip||'');
                    } else {
                        input.addClass("error");
                        tip.addClass("error");
                        tip.html(obj.msg);
                    }
                });
            }

        };
        
        Public.reset = function(data, handler) {
            for(var k in this._inputs) {
                if (!this._inputs.hasOwnProperty(k)) return;
                var 
                    input = this._inputs[k],
                    tip   = this.tips[k]
                ;
                tip.removeClass("error");
                tip.html(tip.tip||'');
                input.removeClass("error");
                if (handler) {
                    handler(k, input, data, tip, this._inputs, this);
                } else {
                    input.val(data[k]||'');
                }
            }
        };

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
    

        Public.submit = function()
        {
            var 
                _this  = this,
                data   = null,
                submit = new Deferred
            ;
            if (this.V) {
                this.V.check().done(function(ok)
                {
                    if (!ok) {
                        submit.rejected();
                        return;
                    }
                    data = _this.getData();
                    _this.onSubmit(data, submit);
                    _this.fireEvent("submit", data);
                });
                return submit;
            }
            data = this.getData();
            this.onSubmit(data, submit);
            this.fireEvent("submit", data);
            return submit;
        };

        Public.onSubmit = function()
        {
            throw new Error("需要实现Form类的onSubmit方法");
        };
        Public.getInputs = function()
        {
            return this._inputs;
        };
        Public.getData = function()
        {
            var data = {};
            XObject.forEach(this._inputs, true, function(input, name)
            {
                if (input.length === 1) {
                    if (input.attr("type") === "checkbox") {
                        var 
                            val   = input[0].hasAttribute("value"),
                            check = !!input.attr("checked")
                        ;
                        if (val) {
                            if (check) {
                                data[name] = input.val();
                            }
                        } else {
                            data[name] = check ? 1 : 0;
                        }
                    } else {
                        data[name] = input.val();
                    }
                } else {
                    var item = data[name] = [];
                    for(var i = 0, l = input.length; i < l; i++) {
                        item.push(input[i].value);
                    }
                }
            });
            return data;
        };
        Public.tip = function(name, msg, state) {
            var tip = tis.tips[name];
            tip.html(msg);
            this.attr("class", 'tip ' + state);
        };

        function preventDefault(event)
        {
            event.preventDefault();
        };
    });

});