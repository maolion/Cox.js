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
Define("AmountIncrease", Depend("~/Cox/Extends/jQuery"), function(require, AmountIncrease, module)
{
    AmountIncrease = module.exports = Class("AmountIncrease", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            COMPONENT_STRUCT = [
            '<div class="cox-ui-form-amount-increase"></div>',
            '<button class="increase" /><button class="decrease" />'
            ]
        ;
        Public.constructor = XFunction(
            jQuery, Optional(Number, 1), Optional(Number, 1), Optional(Number, 0), Optional(Number, Infinity),
            function(input, initValue, step, min, max)
            {
                var
                    _this = this,
                    step  = Math.abs(step),
                    swap  = min,
                    min   = Math.min(min, max),
                    max   = Math.max(swap, max),
                    wrap  = null
                ;
                this.Super("constructor");
                this.dispatchEvent(
                    new Cox.Event("change")
                );
                this._step  = step;
                this._min   = min;
                this._max   = max;
                this._input = input;
                this._wrap  = null;
                swap        = input.width();
                input.wrap(COMPONENT_STRUCT[0]);
                wrap = input.parent();
                wrap.append(COMPONENT_STRUCT[1]);
                this._increaseBtn = wrap.find("button.increase");
                this._decreaseBtn = wrap.find("button.decrease");
                input.width(swap-17);
                wrap.width(swap);
                input.val(Math.max(min,Math.min(max, initValue)));
                //input.on("keyup", INPUT_FILTER);
                input.on("keydown", function(event)
                {
                    switch(event.keyCode) {
                        case 38: _this.increase(); break;
                        case 40: _this.decrease(); break;
                    }
                });
                function changeEventHandler()
                {
                    var value = parseFloat(this.value)||0;
                    this.value = value;
                    _this.fireEvent("change", [value]);
                }
                input.on("change", changeEventHandler);
                //input.on("blur", changeEventHandler);
                this._increaseBtn.on("click", function(event){
                    event.preventDefault();
                    _this.increase();
                });

                this._decreaseBtn.on("click", function(event)
                {
                    event.preventDefault();
                    _this.decrease();
                });

            }
        );
    
        Public.increase = function()
        {
            var 
                input = this._input,
                value = parseFloat(input.val()) || 0,
                max = this._max
            ;
            if (this._disable || value >= max) return;
            value += this._step;
            value = value >= max ? max : value;
            input.val(value);
            this.fireEvent("change", [value]);
        };

        Public.decrease = function()
        {
            var 
                input = this._input,
                value = parseFloat(input.val()) || 0,
                min   = this._min
            ;

            if (this._disable || value < min) return;
            value -= this._step;
            value = value < min ? min : value;
            input.val(value);
            this.fireEvent("change", [value]);
        };

        Public.setValue = XFunction(Number, function(value)
        {
            if (this._disable) return;
            value = Math.max(this._min, Math.min(this._max, value));
            this._input.val(value);
            this.fireEvent("change", [value]);
        });

        Public.setStep = XFunction(Number, function(step)
        {
            this._step = ~~step;
        });

        Public.getValue = function()
        {
            return parseFloat(this._input.val());
        };

        Public.disable = function(){
            this._disable = true;
            this._input[0].disabled = true;
        };

        Public.enable = function()
        {
            this._disable = false;
            this._input[0].disabled = false;
        };

        Public.isDisabled = function()
        {
            return this._disable;
        };

    });  
});


