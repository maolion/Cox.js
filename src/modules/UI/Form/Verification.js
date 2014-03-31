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
 * <Verification.js> - 2014/3/23
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"Verification", 
Depend("~/Cox/Extends/jQuery"),
function(require, Verification, module)
{
    var 
        jQuery = require("jQuery")
    ;

    Verification = module.exports = Class("Verification", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_NUMBER  = /^(?:\d+|\d*(?:\.{0,1}\d+))$/,
            RE_FIX_EXPRESSION = /\b([A-Z_a-z]+\d*)(?=\()?/g,
            RE_TEST_TOOL_SPLIT = /\s*;\s*/,
            testTools = null
        ;

        Public.constructor = XFunction(jQuery, function(inputs)
        {
            var 
                _this   = this,
                _inputs = {}
            ;
            this.Super("constructor");
            this._inputs = _inputs;
            inputs.each(function(index, input)
            {
                var 
                    test = XString.trim(input.getAttribute("test")||""),
                    name = input.getAttribute("name")
                ;
                if (!test || !name) return;


            });
        });

        testTools = function()
        {
            var 
                len = XFunction(Optional(Number, 0), Optional(Number, Infinity), function(min, max)
                {
                    var 
                        swap = min
                    ;
                    min = Math.min(max, min);
                    max = Math.max(max, swap);
                    return {
                        tool   : "len",
                        errmsg : "输入字符长度不符合要求",
                        test   : function(input, value){
                            return len >= min && len <= max;
                        }
                    };
                }),
                num = XFunction(Optional(Number, 0), Optional(Number, Infinity), function(min, max)
                {
                    var 
                        swap = min
                    ;
                    min = Math.min(max, min);
                    max = Math.max(max, swap);
                    return {
                        tool   : "num",
                        errmsg : "输入数字不在限定范围",
                        test   : function(input, value)
                        {
                            return RE_NUMBER.test(value) && value >= min && value <= max;
                        }
                    }
                }),
                re = XFunction(String, Optional(String), function(regexp, flag)
                {
                    regexp = new RegExp(regexp, flag);
                    return {
                        tool   : "re",
                        errmsg : "输入数据格式不符合要求",
                        test   : function(input, value)
                        {
                            regexp.lastIndex = 0;
                            return regexp.test(value);
                        }
                    };
                }),
                notEmpty = {
                    tool   : "notEmpty",
                    errmsg : "不允许空数据输入",
                    test   : function(input, value) 
                    {
                        return !!value;
                    }
                },
                checked = {
                    tool   : "checked",
                    errmsg : "必须被选中",
                    test   : function(input, value)
                    {
                        return !!input.checked;
                    }
                },
                Enum = XFunction(Params(String), function(list)
                {
                    var enum_dict = {};
                    XList.forEach(list, function(item)
                    {
                        enum_dict[item] = 1;
                    });
                    return {
                        tool   : "enum",
                        errmsg : "输入数据不包含在限定列表中",
                        return : function(input, value) 
                        {
                            return enum_dict.hasOwnProperty(value);
                        }
                    };
                }),
                and = XFunction(Params(Object), function(tools)
                {
                    return {
                        tool : "and",
                        test : function(input, value)
                        {
                            var r = null;
                            XList.forEach(tools, function(tool)
                            {
                                if (!tool.test(input, value)) {
                                    r = msg;
                                    return false;
                                }
                            });
                            if (r) this.msg = r;
                            return !r;
                        }
                    }
                }),
                or = XFunction(Params(Object), function(tools)
                {
                    return {
                        tool   : "or",
                        errmsg : XList.reduce(tools, function(a, b)
                        {
                            return a.errmsg + " 或 " + b.errmsg
                        }),
                        test : function(input, value)
                        {
                            return XList.some(tools, function(tool)
                            {
                                return tool.test(input, value);
                            });
                        }
                    }
                })
            ;
            or.define(String, Params(Object), function(label, tools)
            {
                return {
                    tool : "or",
                    test : function(input, value, vobj)
                    {
                        
                    }
                };
            });
            return function(expression) 
            {
                return eval('('+ expression +')');
            }
        }();
    });

    /*v = new Verification(jQuery("input")).check().done(function(ok)
    {
        if (ok) {
            ...
        }
    });*/
});

/*
    <input type="text" test="and(int(), len(0, 10))" />
    <input type="text" test="regexp(); len(6, 12)" />
    <input type="checkbox" test="group('v', checked)" />
    <select test="notEmpty; in('abc', 'cba', 'ddd')">
*/