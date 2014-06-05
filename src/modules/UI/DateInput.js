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
 * <DateInput.js> - 2014/4/19
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"DateInput", 
Depend("~/Cox/Extends/jQuery", "./Calendar"), function(require, DateInput, module)
{
    var
        RE_DATE     = /\d{4}\/\d{1,2}\/\d{1,2}|\d{4}\/\d{1,2}\/?|\d{1,4}\/?/,
        DATE_FORMAT = "{0}/{1}/{2}",
        jQuery      = require("jQuery"),
        Calendar    = require("Calendar"),
        DOC         = jQuery(document),
        now         = new Date(),
        calendar    = null,
        active      = null
    ;
    DateInput.buid = function (input)
    {
        input.on("click", onInputClick);
    };
    DateInput.onClick = onInputClick;

    calendar = jQuery('<div class="calendar dropdown">');
    jQuery(document.body).append(calendar);
    calendar.on("click", function(event)
    {
        event.stopPropagation();
    });

    calendar = new Calendar(calendar);
    calendar.on("selectDay", function(day, month, year)
    {
        if (active) {
            active.value = XString.format(DATE_FORMAT, year, month, day);
        }
        active = null;
        calendar.hide();
        DOC.off("click", globalClickHideCalendar);
    });

    DOC.on("click", "div.input-text.date-input", onInputClick);

    function formatDateInput()
    {
        this.value = (this.value.match(RE_DATE)||[""])[0];
    };
    function onInputClick(event)
    {
        var 
            input = jQuery(this).find("input[type=text]"),
            pos   = input.offset()
        ;
        pos.top = input.outerHeight() + pos.top - 2;
        input.off("input", formatDateInput);
        input.on("input", formatDateInput);
        input   = input[0];
        active  = input;
        calendar.setDate(input.value ? new Date(input.value) : now);
        calendar.show(pos.left, pos.top);
        DOC.off("click", globalClickHideCalendar);
        DOC.one("click", globalClickHideCalendar);
        event.stopPropagation();
    };
    function globalClickHideCalendar()
    {
        calendar.hide();
    };

});