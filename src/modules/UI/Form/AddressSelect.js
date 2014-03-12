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


Define("AddressSelect", Depend("~/Cox/Data/LocalList"), function(require, AddressSelect, module)
{
    var LocalList = require("LocalList");
    AddressSelect = Class("AddressSelect", function(Static, Public)
    {
        function loadList(select, pkey, next)
        {
            var 
                el      = select[0],
                options = el.options,
                list    = LocalList.get(pkey);
            ;
            options.length = 0;
            select[list.length === 0 ? "hide" : "show"]();
            XList.forEach(list, function(item, index)
            {
                var option = new Option(item, item);
                option.setAttribute("area-index", pkey + "_" + index);
                options.add(option);
            });
            select.trigger("change");
        }

        function interaction(prev, next)
        {
            prev.on("change", function()
            {
                var 
                    options   = this.options,
                    option    = this.options[this.selectedIndex],
                    nextIndex = option.getAttribute("area-index")
                ;
                loadList(next, nextIndex);
            });
        }

        Public.constructor = XFunction(jQuery, jQuery, jQuery, function(province, city, town)
        {
            interaction(province, city);
            interaction(city, town);
            this._province = province;
            this._city     = city;
            this.town      = town;
            
            loadList(province, "0");
        });

        Public.change = XFunction(String, Optional(String, ""), Optional(String, ""), 
            function(province, city, town) 
            {
                this._province.val(province);
                this._province.trigger('change');
                if (city==="") {
                    return;
                }
                this._city.val(city);
                this._city.trigger("change");
            }
        );
    });
    module.exports = AddressSelect;
});