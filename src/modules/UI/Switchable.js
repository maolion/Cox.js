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

Define("Switchable", Extends("~/Cox/Extends/jQuery", "~/Cox/jQuery.Dom"), function(require, Switchable, module)
{
    var 
        jQuery = require("jQuery"),
        Dom    = require("jQuery.Dom")
    ;

    Switchable = Class("Switchable", Abstract, Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = function()
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("prev"),
                new Cox.Event("next")
            );
        };
        Public.prev = Function;
        Public.next = Function;
        Public.jumpTo = ParamTypeTable(Number);
    });

});
