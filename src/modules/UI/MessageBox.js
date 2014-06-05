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
 * <MessageBox.js> - 2014/4/7
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define("MessageBox", Depend("~/Cox/Extends/jQuery", "./Dialog"), function(require, MessageBox, module)
{
    var 
        jQuery   = require("jQuery"),
        Dialog   = require("Dialog"),
        WINDOW   = jQuery(window),
        MDialog  = null
    ;

    MDialog = Class("MessageDialog", Single, Extends(Dialog), function(Staitc, Public)
    {
        Public.constructor = function()
        {
            var _this = this;
            this.Super("constructor", "消息提示", { pos : [0, 0], draggable : false });
            this.dispatchEvent(
                new Cox.Event("ok"),
                new Cox.Event("cancel")
            );
            this._container = this.find("#messagebox-container");
            this._inputbox  = this.find("input[type=text]");
            this._tip       = this.find("span.tip");
            this.on("close", function()
            {
                this.fireEvent("cancel", [false]);
            });
            this._container.on("click", ".button-bar>button", function()
            {
                _this.unLock();
                _this.hide();
                if (this.getAttribute("target") === "ok") {
                    _this.fireEvent("ok", [_this._container.hasClass("prompt") ? _this._inputbox.val() : true]);
                } else {
                    _this.fireEvent("cancel", [false]);
                }
            });
            this.on("showBefore", function()
            {
                var size = this.getSize();
                this.setPosition(
                    (WINDOW.width() - size[0]) / 2,
                    WINDOW.height() *.2
                );
            });
        };

        Public.show = XFunction( String, String, Optional( String ), function( mode, message, initValue ){
            var _this = this;
            //this.hide(true);
            if (mode === "wait") {
                MDialog.hideTopBar();
            } else {
                MDialog.showTopBar();
            }
            this._container.attr("class", mode);
            this.un("ok");
            this.un("cancel");
            this._tip.html(message);
            this._inputbox.val(initValue);
            this.unLock();
            this.Super("show");
            var container = MDialog._container;
            MDialog.lock();
            if (container.hasClass("prompt")) {
                MDialog._inputbox.focus();
            }
        } );


        Public.panel = function(panel)
        {
            panel.html(
            '<div id="messagebox-container" >\n'+
            '   <span class="tip" ></span>\n'+
            '   <input type="text" placeholder="请输入数值..." />\n'+
            '   <div class="button-bar">\n'+
            '       <button target="ok" class="button ok blue">确定</button>\n'+
            '       <button target="cancel" class="button cancel red">取消</button>\n'+
            '   </div>\n'+
            '</div>'
            );
        };
    }).getInstance();
    WINDOW.on("resize", function()
    {
        var size = MDialog.getSize();
        MDialog.setPosition(
            (WINDOW.width() - size[0]) / 2,
            WINDOW.height() *.2
        );
    });
    MessageBox.alert = XFunction( String, Optional(Function), function (message, callback)
    {
        MDialog.show("alert", message);
        MDialog.closeBtn.show();
        callback && MDialog.once("ok", callback);
        callback && MDialog.once("cancel", callback);
    });

    MessageBox.confirm = XFunction(String, Function, Optional(Function), function(message, okCallback, cancelCallback)
    {
        MDialog.show("confirm", message);
        MDialog.closeBtn.show();
        MDialog.once("ok", okCallback);
        MDialog.once("cancel", cancelCallback || okCallback);
    });

    MessageBox.prompt = XFunction(String, Optional(String), Function, Optional(Function), function(message, initValue, okCallback, cancelCallback)
    {
        MDialog.show("prompt", message, initValue);
        MDialog.closeBtn.show();
        MDialog.once("ok", okCallback );
        MDialog.once("cancel", cancelCallback || function(){
            okCallback(undefined);
        });
    });

    MessageBox.wait = XFunction(String, Optional(Deferred), function(message, deferr)
    {
        
        MDialog.show("wait", message);
        MDialog.closeBtn.hide();
        deferr&&deferr.done( function(){
            MessageBox.hide();
        } );
    });

    MessageBox.hide = function()
    {

        MDialog.unLock();
        MDialog.hide();
    };
});