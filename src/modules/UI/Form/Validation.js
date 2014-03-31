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
 * <Validation.js> - 2014/3/23
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"Validation", 
Depend("~/Cox/Extends/jQuery"),
function(require, Validation, module)
{
    var 
        jQuery = require("jQuery")
    ;

    Validation = module.exports = Class("Validation", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_FILTER_TYPE       = /^(?:checkbox|radio|file|button|submit|reset|image)$/i,
            RE_FIX_EXPRESSION    = /\b([A-Z_a-z]+\d*)(?=\()?/g,
            RE_TEST_TOOL_SPLIT   = /\s*;\s*/,
            getVerifaicationTool = null
        ;

        Public.constructor = XFunction(jQuery, function(inputs)
        {
            var 
                _this   = this,
                _inputs = {}
            ;
            this.Super("constructor");  
            this._inputs = _inputs;
            
            this.dispatchEvent(
                new Cox.Event("next"),
                new Cox.Event("pass"),
                new Cox.Event("done")
            );

            inputs.each(function(index, input)
            {
                var 
                    type = XString.trim(input.getAttribute("type")||""),
                    test = XString.trim(input.getAttribute("test")||""),
                    name = XString.trim(input.getAttribute("name")||"")
                ;
                if (RE_FILTER_TYPE.test(type) || !test || !name) return;
                _inputs[name] = {
                    input    : input,
                    verify   : getValidationTool(test)
                };
            });
        });

        Public.check = XFunction(function()
        {
            var 
                checks = [],
                _this  = this
            ;
            XObject.forEach(this._inputs, true, function(obj, name)
            {
                var 
                    check = null,
                    input = obj.input,
                    r     = null
                ;
                _this.fireEvent("next", [input]);
                if (obj.verify.test instanceof RegExp) {
                    r = obj.verify.test.test(input.value);
                } else {
                    r = obj.verify.test(input, input.value, this);
                }

                obj = {
                    pass  : r,
                    name  : name,
                    input : input,
                    value : input.value,
                    msg   : obj.verify.errmsg
                };

                if (r instanceof Deferred) {
                    checks.push(r);
                    r.done(function(ok, value)
                    {
                        if (ok) {
                            obj.msg = "";
                        }
                        _this.fireEvent("pass", [ok, obj, value]);
                    });
                    return; 
                }
                check = new Deferred;
                checks.push(check);
                if (!r) {
                    _this.fireEvent("pass", [false, obj]);
                    check.rejected(obj);
                } else {
                    obj.msg = "";
                    _this.fireEvent("pass", [true, obj]);
                    check.resolved(obj);
                }
            });


            checks = new DeferredList(checks);
            checks.done(function(ok, value)
            {
                _this.fireEvent("done", [ok, value]);
            });
            return checks;
        });

        Public.check.define(String, function(name)
        {
            var 
                _this = this,
                obj   = this._inputs[name],
                input = null,
                v     = null
            ;
            if(!obj) return;
            input = obj.input;
            this.fireEvent("next", [input]);
            if (obj.verify.test instanceof RegExp) {
                v = obj.verify.test.test(input.value);
            } else {
                v = obj.verify.test(input, input.value, this);
            }
            obj = {
                pass  : v,
                name  : name,
                input : input,
                value : input.value,
                msg   : obj.verify.errmsg
            };
            if (v instanceof Deferred) {
                v.done(function(ok , value)
                {
                    if (ok) {
                        obj.msg = "";
                    }
                    _this.fireEvent("pass", [ok, obj, value]);
                });
            } else {
                if (v) {
                    obj.msg = "";
                }
                _this.fireEvent("pass", [!!v, obj]);
            }
            return v;
        });

        getValidationTool = function()
        {
            var 
                RE_NUMBER      = /^(?:-?\d+|\d*(?:\.{0,1}\d+))$/,
                RE_USER_NAME   = /^[A-Za-z_\.][\w\d]*$/,
                RE_INTEGER     = /^-?\d+$/,
                RE_URL_SIGN    = /^\w+:\/\/[\w\-\.]+(?:\:\d+)?[\w\-%&\?\/.=]+$/,
                RE_URI_SIGN    = /^[\.\/\S]+(?:\?[&#%_\w]*)?$/,
                RE_MOBILE_SIGN = /^1\d{10}$/,
                RE_TEL_SIGN    = /^(?:\d{3,4}-)?\d{7,8}(?:-\d{1,4})?$/,
                RE_EMAIL_SIGN  = /^\w+(?:\.?\w+)+@\w+(?:\.\w+)+$/,
                RE_DATE_SIGN   = /^\d{2,4}\/(?:0?\d|1[0-2])\/(?:[0-2]?\d|3[0-1])$|^(?:0?\d|1[0-2])\/(?:[0-2]?\d|3[0-1])\/\d{2,4}$/,
                RE_TIME_SIGN   = /^(?:[0-1]?\d|2[0-3]):[0-5]?\d(?:\:[0-5]?\d)?$/,
                RE_DTIME_SIGN  = /^(?:\d{2,4}\/(?:0?\d|1[0-2])\/(?:[0-2]?\d|3[0-1])|^(?:0?\d|1[0-2])\/(?:[0-2]?\d|3[0-1])\/\d{2,4}) (?:[0-1]?\d|2[0-3]):[0-5]?\d(?:\:[0-5]?\d)?$/
                userName       = null,
                len            = null,
                int            = null,
                decimal        = null,
                reg            = null,
                tel            = null,
                mobile         = null,
                email          = null,
                must           = null,
                date           = null,
                time           = null,
                dateTime       = null,
                Enum           = null,
                and            = null,
                url            = null,
                or             = null
            ;
            function Tool(name, errmsg, test)
            {
                this.tool   = name || "";
                this.errmsg = errmsg || "";
                if (test instanceof RegExp) {
                    this.test = function(input, value) 
                    {
                        if (value === "") return true;
                        return test.test(value);
                    }
                } else {
                    this.test = test;
                }
            }
            
            function DateTool(name, errmsg, format, reg)
            {
                var tool = XFunction(String, String, function(min, max)
                {
                    var swap = null;
                    min = swap = new Date(format + min).getTime();
                    max = new Date(format + max).getTime();
                    return new Tool(name, errmsg + "或不在限定范围内", function(input, value)
                    {
                        if (value === "") return true;
                        if (!reg.test(value)) return false;
                        value = new Date(format + value).getTime();
                        return value >= min && value <= max;
                    });
                });
                tool.define(function()
                {
                    return new Tool(name, errmsg, function(input, value)
                    {
                        if (value === "") return true;
                        return reg.test(value);
                    });
                });
                return tool;
            }

            userName = new Tool("userName", "输入的用户名数据格式不符合要求", RE_USER_NAME);
            
            len = XFunction(Number, Number, function(min, max)
            {
                var 
                    swap = min
                ;
                min = Math.min(max, min);
                max = Math.max(max, swap);
                return new Tool("len", "输入字符长度不符合要求", function(input, value)
                {
                    if(value === "") return true;
                    return value.length >= min && value.length <= max;
                });
            });

            len.define(Number, function(max)
            {
                return len(0, Math.abs(max));
            });

            int = XFunction(Number, Number, function(min, max)
            {
                var 
                    swap = min
                ;
                min = Math.min(max, min);
                max = Math.max(max, swap);
                return new Tool("int", "输入数值非整数值或不大限定大小范围内", function(input, value)
                {
                    if(value === "") return true;
                    return RE_INTEGER.test(value) && value >= min && value <= max;
                });
            });

            int.define(function()
            {
                return int(-Number.MAX_VALUE, Number.MAX_VALUE);
            });

            decimal = XFunction(Number, Number, Number, function(min, max, precision)
            {
                var 
                    swap = min
                ;
                min       = Math.min(max, min);
                max       = Math.max(max, swap);
                precision = precision;
                return new Tool("decimal", "输入数字值不符合格式要求", function(input, value)
                {
                    if(value === "") return true;
                    if ((!RE_NUMBER.test(value) || value < min || value > max)
                    || (value.length - (value.lastIndexOf(".")+1) > precision)) {
                        return false;
                    }
                    return true;
                });
            });

            decimal.define(Number, Number, function(min, max)
            {
                return decimal(min, max ,Number.MAX_VALUE);
            });

            decimal.define(Number, function(precision)
            {
                return decimal(-Number.MAX_VALUE, Number.MAX_VALUE, precision);
            });

            decimal.define(function()
            {
                return decimal(-Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            });

            reg = XFunction(RegExp, function(reg)
            {
                return new Tool("reg", "输入数据格式不符合要求", reg)
            });

            reg.define(String, Optional(String, ""), function(regexp, flag)
            {
                return reg(new RegExp(regexp, flag));
            });
            must = new Tool("must", "必填项", function(input, value) { return !!value; })

            Enum = XFunction(Params(String), function(list)
            {
                var enum_dict = {};
                XList.forEach(list, function(item)
                {
                    enum_dict[item] = 1;
                });
                return new Tool("enum", "输入数据不包含在限定列表中", function(input, value) 
                {
                    if(value === "") return true;
                    return enum_dict.hasOwnProperty(value);
                });
            });
            url      = new Tool("url", "输入的URL格式不正确", RE_URL_SIGN);
            uri      = new Tool("uri", "输入的URI格式不正确", RE_URI_SIGN);
            mobile   = new Tool("mobile", "输入的电话号码格式不正确", RE_MOBILE_SIGN);
            tel      = new Tool("tel", "输入的电话号码格式不正确", RE_TEL_SIGN);
            email    = new Tool("email", "输入的Email格式不正确", RE_EMAIL_SIGN);
            date     = DateTool("date", "输入的日期格式错误", "", RE_DATE_SIGN);
            time     = DateTool("time", "输入的时间格式错误", "1900/1/1 ", RE_TIME_SIGN);
            dateTime = DateTool("DateTime", "输入的日期时间格式错误", "", RE_DTIME_SIGN);

            and = XFunction(Params(Object), function(tools)
            {
                return new Tool("and", "", function(input, value)
                {
                    var r = null;
                    XList.forEach(tools, function(tool)
                    {
                        if ( tool.test instanceof RegExp ? !tool.test.test(value) : !tool.test(input, value)) {
                            r = tool.errmsg;
                            return false;
                        }
                    });
                    if (r) this.errmsg = r;
                    return !r;
                });
            });
            or = XFunction(Params(Object), function(tools)
            {
                return new Tool(
                    "or", 
                    XList.reduce(tools, function(a, b)
                    {
                        return a.errmsg + " 或 " + b.errmsg
                    }),
                    function(input, value)
                    {
                        return XList.some(tools, function(tool)
                        {
                            return tool.test(input, value);
                        });
                    }
                );
            });

            return function(expression) 
            {
                var tool = eval('('+ expression +')');
                if (tool instanceof Function) 
                    tool = tool();
                return tool;
            };

        }(); 
    });
});
