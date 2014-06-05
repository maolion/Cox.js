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
 * <Dialog.js> - 2014/4/5
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */


Define("Dialog", Depend("~/Cox/Env", "~/Cox/Extends/jQuery", "./DragDrop"), function(require, Dialog, module)
{
    var 
        Env       = require("Env"),
        jQuery    = require("jQuery"),
        DragDrop  = require("DragDrop"),
        WINDOW    = jQuery(window),
        DOC       = jQuery(document),
        BODY      = jQuery(document.body),
        CONTAINER = null,
        TEMPLATE  = 
        '<div class="dialog" id="{0}">\n'+
        '    <div class="top-bar">\n'+
        '        <span class="title">{1}</span>\n'+
        '        <div class="btn-bar">\n'+
        '            <i class="icon full-screen resize"></i>\n'+
        '            <i class="icon close"></i>\n'+
        '        </div>\n'+
        '    </div>\n'+
        '    <div class="panel"></div>\n'+
        '</div>\n',
        UID       = function(){
            var uid = new Date().getTime();
            return function( prefix ){
                return prefix + uid++;
            }
        }(),
        DialogMask = null;
    ;


    Dialog = module.exports = Class("Dialog", Extends(Cox.EventSource), function(Static, Public)
    {
        var
            SHOW                    = 2,
            HIDE                    = 4,
            DESTORY                 = 5,
            zIndex                  = 2,
            caches                  = {},
            dialogs                 = [],
            active                  = null,
            prevActive              = null,
            visibleds               = 0,
            CSS_FULL_SCREEN_SIZE    = { width : "100%", height : "100%", left : 0, top : 0 },
            DEFAULT_CONFIGS         = {
                close     : true,
                resize    : false,
                topbar    : true,
                draggable : true
            }
        ;
        Static.onFx        = Env.name === "ie" && ~~Env.version < 9 ? false : true;
        Static.NORMAL      = 1;
        Static.FULL_SCREEN = 2;

        Static.getDialogs = function()
        {
            return dialogs.slice();
        };
        Static.get = function(uid)
        {
            return caches[uid];
        };
        Public.constructor = XFunction(String, Optional(String), Optional(Cox.PlainObject, DEFAULT_CONFIGS), function(title, template, config)
        {
            var 
                _this   = this,
                uid     = UID("dialog-"),
                dialog  = jQuery(XString.format(TEMPLATE, uid, title))
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("showBefore"),
                new Cox.Event("show"),
                new Cox.Event("hide"),
                new Cox.Event("close"),
                new Cox.Event("resize"),
                new Cox.Event("focus"),
                new Cox.Event("unFocus"),
                new Cox.Event("destory")
            );
            CONTAINER.append(dialog);
            this._uid        = uid;
            this._dialog     = dialog,
            this._topbar     = dialog.find(".top-bar"),
            this.title       = this._topbar.find("span.title"),
            this.closeBtn    = this._topbar.find("div.btn-bar>i.close"),
            this.resizeBtn   = this._topbar.find("div.btn-bar>i.resize"),
            this._panel      = dialog.find(".panel");
            this._lock       = false;
            this._template   = template;
            this._config     = config;
            this._state      = HIDE;
            this._lastpos    = null;
            this._lastsize   = null;
            this._dialogMode = config.dialogMode || Static.NORMAL;

            if (config !== DEFAULT_CONFIGS) {
                XObject.mix(config, DEFAULT_CONFIGS, false);
            }

            !config.close && this.closeBtn.hide();
            !config.resize && this.resizeBtn.hide();
            if (config.pos) {
                dialog.css({
                    left : config.pos[0],
                    top  : config.pos[1]
                });
            }
            if (config.size) {
                dialog.css({
                    width : config.size[0],
                    height  : config.size[1]
                });
            }
            if (!config.topbar) {
                this.hideTopBar();
            }
            if (config.draggable) {
                dialog.addClass("draggable");
            }
            this._lastpos = config.pos;

            template && this._panel.append(template);
            this.panel(this._panel);
            caches[uid] = this;
            dialogs.push(this);
        });
        Public.panel = function(panel)
        {
        };
        Public.show = function(offFx, mode)
        {
            var 
                _this    = this,
                dialog   = this._dialog,
                omode    = this._dialogMode,
                mode     = mode || omode,
                pos      = null,
                full     = mode === Static.FULL_SCREEN,
                reduce   = omode === Static.FULL_SCREEN && mode === Static.NORMAL,
                resize   = !!this._config.resize
            ;
            if (this._state === DESTORY) {
                show.rejected();
                return show;
            }
            if (omode === mode && this._state === SHOW) {
                
                this.focus();
                show.resolved();
                return show;
            }
            if (visibleds <= 0) {
                DialogMask.show();
            }
            this._state !== SHOW && visibleds++;
            this.focus();
            this._state = SHOW;

            if (!this._lastpos) {
                this._lastsize = this.getSize();
                var 
                    wHeight = WINDOW.height(),
                    dHeight = this._lastsize[1]
                ;
                this._lastpos = [
                    (WINDOW.width() - this._lastsize[0]) / 2,
                    Math.max(wHeight / 2 < dHeight  ? (wHeight - dHeight) / 2 : wHeight * .2, 0)
                ];
                dialog.css({
                    left : this._lastpos[0],
                    top  : this._lastpos[1]
                });
            }
            this.fireEvent("showBefore");
            if (resize && full) {
                if (omode !== mode) {
                    this._lastpos  = this.getPosition();
                    this._lastsize = this.getSize();
                    this.fireEvent("resize", [Static.FULL_SCREEN]);
                }
                this.resizeBtn.addClass("reduction").removeClass("full-screen");
                dialog.addClass("full-screen");
                dialog.removeClass("draggable");
                dialog.css(CSS_FULL_SCREEN_SIZE);
            } else if (reduce) {
                this.fireEvent("resize", [Static.NORMAL]);
                dialog.css({
                    left   : this._lastpos[0],
                    top    : this._lastpos[1],
                    width  : this._lastsize[0],
                    height : this._lastsize[1]
                });
                dialog.removeClass("full-screen");
                this._config.draggable && dialog.addClass("draggable");
                this.resizeBtn.addClass("full-screen").removeClass("reduction");
            } else {
                mode = Static.NORMAL;
            }

            this._dialogMode = mode;
            dialog.addClass("show").removeClass("hide");
            this.fireEvent("show");
        };

        Public.hide = function(offFx)
        {
            var 
                _this   = this,
                hide    = new Deferred,
                dialog  = this._dialog,
                pos     = null
            ;
            if (this._state === DESTORY || this._lock) {
                return false;
            };
            if (this._state === HIDE) {
                return true;   
            }
            
            this._state = HIDE;
            if (this._dialogMode === Static.FULL_SCREEN || offFx) {
                dialog.removeClass("show").removeClass("hide");
            } else {
                dialog.removeClass("show");
                dialog.addClass("hide");
            }
            if (--visibleds <= 0) {
                DialogMask.hide();
            }
            this.unFocus();
            nextFocus();
            this.fireEvent("hide");
            return true;
        };
        Public.lock = function()
        {
            this._lock = true;
        };
        Public.unLock = function()
        {
            this._lock = false;
        };
        Public.isLock = function()
        {
            return this._lock;
        };
        Public.focus = function()
        {
            if (active === this) return;
            active && active.unFocus();
            active = this;
            this._dialog.addClass("active");
            this._dialog.css("zIndex", ++zIndex);
            this._dialog.focus();
            this.fireEvent("focus");
        };
        Public.unFocus = function()
        {
            this._dialog.removeClass("active");
            if (active === this) 
                active = null;

            this.fireEvent("unFocus");
        };

        Public.find = function(selector)
        {
            return this._panel.find(selector);
        };
        Public.setPosition = function(left, top)
        {
            left = ~~left;
            top  = ~~top;
            if (this._dialogMode !== Static.FULL_SCREEN) {

                this._dialog.css({
                    left : left, 
                    top  : top
                });
            }
            this._lastpos = [left, top];
        };
        Public.getPosition = function()
        {
            return [parseInt(this._dialog.css("left")), parseInt(this._dialog.css("top"))]
        };
        Public.setSize = function(width, height) 
        {
            width  = ~~width;
            height = ~~height;
            if (this._dialogMode !== Static.FULL_SCREEN) 
                this._dialog.css({
                    width : width,
                    height : height
                });
            this._lastsize = [width, height];
        }
        Public.getSize = function()
        {
            return [this._dialog.outerWidth(), this._dialog.outerHeight()];
        };
        Public.hideTopBar = function()
        {
            this._dialog.addClass("no-topbar");
        };
        Public.showTopBar = function()
        {
            this._dialog.removeClass("no-topbar");
        };
        Public.updateLastPos = function()
        {
            this._lastpos = this.getPosition();
        };
        Public.destory = function()
        {
            this.hide();
            delete caches[this._uid];
            XList.remove(dialogs, this);
            this._dialog.remove();
            this._state = DESTORY;
            this.fireEvent("destory");
        };  

        function nextFocus()
        {
            var 
                next = null,
                z    = 0
            ;
            for (var i = 0, l = dialogs.length; i < l; i++ ) {
                var 
                    dialog = dialogs[i],
                    z2     = ~~dialog._dialog.css("zIndex")
                ;
                if (dialog._state !== SHOW) continue;
                if (!next) {
                    next = dialog;
                    z    = z2;
                    continue;
                }
                if (z2 > z) {
                    next = dialog;
                    z = z2;
                }
            }
            next && active !== next && next.focus();
            return next;
        }
    });
    

    CONTAINER = jQuery(
    '<div id="dialog-container">\n'+
    '   <div class="dialog-mask"></div>\n'+
    '</div>'
    );

    BODY.append(CONTAINER);
    WINDOW.on("resize", function()
    {
        CONTAINER.width(WINDOW.width());
        CONTAINER.height(WINDOW.height());
    });
    WINDOW.trigger("resize");
    CONTAINER.on("mousedown", "div.dialog>.panel, div.dialog>.top-bar>.btn-bar>i", function(event)
    {   
        var dialog = jQuery(this).parents(".dialog");
        if (!dialog.hasClass("no-topbar")) {
            dialog = Dialog.get(dialog.attr("id"));
            dialog && dialog.focus();
            event.stopPropagation();
        }
    });
    CONTAINER.on("mousedown", "div.dialog", function(event)
    {
        var dialog = Dialog.get(this.getAttribute("id"));
        if (!dialog) return;
        dialog.focus();
    });

    CONTAINER.on("click", "div.dialog>.top-bar>.btn-bar>i", function(event)
    {
        var 
            btn    = jQuery(this),
            dialog = btn.parents("div.dialog")[0],
            dialog = dialog && Dialog.get(dialog.getAttribute("id"))
        ;

        if (!dialog) return;
        if (btn.hasClass("close")) {
            dialog.unLock();
            dialog.hide();
            dialog.fireEvent("close");
        } else if(btn.hasClass("full-screen")){
            dialog.show(false, Dialog.FULL_SCREEN);
        } else {
            dialog.show(false, Dialog.NORMAL);
        }
    });
    CONTAINER.on("keydown", "div.dialog", function(event)
    {
        if (event.keyCode === 27) {
            var dialog = Dialog.get(this.getAttribute("id"));
            dialog.unLock();
            dialog.hide();
        }
    });
    DialogMask = function()
    {
        var 
            mask = jQuery("#dialog-container>.dialog-mask")
        ;
        function dialogHideHandler(dialog)
        {
            dialog.hide(true);
        };
        mask.on("click", function()
        {
            XList.forEach(Dialog.getDialogs(), dialogHideHandler);
        });

        return {
            show : function() {
                CONTAINER.addClass("show").removeClass("hide");
            },
            hide : function() {
                CONTAINER.removeClass("show").addClass("hide");
            }
        }
    }();

    //setup dialog dragdrop
    Dialog.dragdrop = new DragDrop("div.dialog.draggable", false);
    /*Dialog.dragdrop.on("drag", function(dialog)
    {
        //dialog.addClass("resetting");
        //dialog.css("opacity", .5);
        //dialog.addClass("dragging");
    });*/
    Dialog.dragdrop.on("drop", function(dialog)
    {
        //dialog.removeClass("resetting");
        //dialog.css("opacity", 1);
        Dialog.get(dialog.attr("id")).updateLastPos();
    });
    
});

