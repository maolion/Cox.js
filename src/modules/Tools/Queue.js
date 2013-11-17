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


Define( "Queue", function( require, Queue, module ){
    var 
        SLICE   =  Array.prototype.slice,
        Handler = null
    ;

    Handler = Class("Handler", Abstract, Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = XFunction(function()
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("done"),
                new Cox.Event("timeout")
            );
            this._busy = false;
        });

        //Public.exec = ParamTypeTable(Object);
        Public.exec = Function;
        Public.reset = function()
        {
            this._busy = false;
        };

        Public.isBusy = function()
        {
            return this._busy;
        };
    });

    Handler.__instancelike__ = function(obj)
    {
        if (!obj || !(obj instanceof Function) || obj.extened && !obj.extened(Cox.EventSource)) {
            return false;
        }
        try {
            this.implementIn(obj);
        } catch(e) {
            return false;
        }
        return true;
    };

    Queue = module.exports = Class("Queue", Extends(Cox.EventSource), function(Static, Public)
    {
        Static.Handler = Handler;

        Public.constructor = XFunction(Handler, Number, function(handler, threadCount)
        {
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("push"),
                new Cox.Event("pop"),
                new Cox.Event("next"),
                new Cox.Event("pass"),
                new Cox.Event("done"),
                new Cox.Event("clear")
            );
            this._handler     = handler;
            this._threadCount = Math.max(~~threadCount, 1);
            this._threads     = [];
            this._queue       = [];
            this._doneHandler = createDoneHandler(this);
        });
        Public.push = XFunction(Params(Object), function(datas)
        {
            var 
                _this   = this,
                handler = null,
                data    = null
            ;
            this._queue.push.apply(this._queue, datas);
            this.fireEvent("push", [datas]);
            for (var i = 0; i < this._threadCount && this._queue.length; i++) {
                handler = this._threads[i];
                if (!handler) {
                    handler = new this._handler;
                    handler.on("done", this._doneHandler);
                    this._threads[i] = handler;
                }
                if (handler && !handler.isBusy()) {
                    data = this._queue.shift();
                    this.fireEvent("next", [data]);
                    handler.exec(data);
                    handler = null;
                }
            }
        });
        Public.size = function()
        {
            return this._queue.length;
        };
        Public.isEmpty = function()
        {
            return this._queue.length === 0;
        };
        Public.pop = function()
        {
            var data = null;
            if (this._queue.length) {
                data = this._queue.pop();
                this.fireEvent("pop", [ok, data]);
            }
            return data;
        };

        Public.clear = function()
        {
            this._queue.length = 0;
            this.fireEvent("clear");
        };

        function createDoneHandler(thisp)
        {
            return function(){
                thisp.fireEvent("pass", SLICE.call(arguments));
                this.reset();
                if (thisp._queue.length) {
                    var 
                        data = thisp._queue.shift(),
                        _this = this
                    ;
                    thisp.fireEvent("next", [data]);
                    _this.exec(data);
                    data = null;
                }else{
                    var done = true;
                    XList.forEach(thisp._threads, function(handler)
                    {
                        if(handler.isBusy()){
                            done = false;
                        }
                    });
                    done && thisp.fireEvent("done");
                }
            };
        }
    });

} );    
