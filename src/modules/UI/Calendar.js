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

Define("Calendar", Depend("~/Cox/Extends/jQuery", "./Animation"), function(require, Calendar, module)
{
    var 
        jQuery    = require("jQuery"),
        Animation = require("Animation"),
        UID       = function() {
            var uid = new Date().getTime();
            return function(prefix) {
                return (prefix || "") + "" + uid++;
            }
        }()
    ;
    Calendar = module.exports = Class("Calendar", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            MAX_YEAR        = 2099,
            MIN_YEAR        = 1900,
            NOW             = new Date,
            MONTH_ITEMS     = '一 二 三 四 五 六 七 八 九 十 十一 十二'.split(" "),
            WEEK_BAR_TPL    = '<div class="week-bar">' + XList.map("日一二三四五六".split(""), function(item){return '<span>'+item+'</span>'}).join("") + '</div>',
            TEMPLATE        = null,
            PANEL_ANIMATE   = [
                { marginTop  : 0 },
                { marginTop  : -140 },
                { marginTop  : -280 },
                [{ key : "marginLeft", from : -182, to : 0 }],
                [{ key : "marginLeft", from : 0, to : -182 }]
            ],
            OPACITY_ANIMATE = [
                { opacity : 0 },
                { opacity : 1 }
            ],
            SHOW_CSS = {
                display : "none",
                opacity : 0
            }
        ;
        Static.YEAR         = NOW.getFullYear();
        Static.MONTH        = NOW.getMonth()+1;
        Static.DAY_OF_MONTH = NOW.getDate();
        Static.DAY_OF_WEEK  = NOW.getDay();

        Static.getMaxDayOfMonth = XFunction.memoize(function(year, month)
        {
            return new Date(year, month, 0).getDate();
        });
        Static.getFirstDayOfWeek = XFunction.memoize(function(year, month)
        {
            return new Date(year, month-1, 1).getDay();
        });
        Static.getLastDayOfWeek = XFunction.memoize(function(year, month)
        {
            return new Date(year, month - 1, Calendar.getMaxDayOfMonth(year, month)).getDay();
        });

        Public.constructor = XFunction(jQuery, Optional(Date), function(container, date)
        {
            var 
                _this  = this,
                pWraps = null,
                anima  = {
                    prev   : new Animation(Animation.Transition.Quad.easeOut),
                    next   : new Animation(Animation.Transition.Quad.easeOut),
                    lock   : false
                }
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("selectDate"),
                new Cox.Event("selectYear"),
                new Cox.Event("selectMonth"),
                new Cox.Event("selectDay"),
                new Cox.Event("show"),
                new Cox.Event("hide")
            );
            date            = date || new Date;
            this._container = container;
            this._level     = 2;
            container.html(getCalendarHtml(date));
            this._yearPanel  = container.find(".year-panel");
            this._monthPanel = container.find(".month-panel");
            this._dayPanel   = container.find(".day-panel");
            this._dateBar    = container.find(".top-bar .date");
            this._panelWraps = pWraps = [
                initWrap(this._yearPanel.find(".wrap")),
                initWrap(this._monthPanel.find(".wrap")),
                initWrap(this._dayPanel.find(".wrap"), ".days span")
            ];

            this._cyear      = Calendar.YEAR;
            this._cmonth     = Calendar.MONTH;
            this._cday       = Calendar.DAY_OF_MONTH;

            this._year       = date.getFullYear();
            this._month      = date.getMonth() + 1;
            this._day        = date.getDate();
            anima.prev.addClip(300, PANEL_ANIMATE[3], switchPanel);
            anima.prev.anima    = anima;
            anima.prev.calendar = this;
            anima.next.addClip(300, PANEL_ANIMATE[4], switchPanel);
            anima.next.anima    = anima;
            anima.next.calendar = this;
            
            anima.prev.on("start", switchPanelStartHandler);
            anima.prev.on("done", switchPanelDoneHandler);
            anima.next.on("start", switchPanelStartHandler);
            anima.next.on("done", switchPanelDoneHandler);
            this._container.on("click", ".year-panel span, .month-panel span, .days span", function()
            {
                var 
                    item  = jQuery(this),
                    wrap  = pWraps[item.parents(".wrap[level]").attr("level")],
                    panel = wrap.current,
                    level = ~~wrap.attr("level"),
                    items = panel.items
                ;
                if (item.hasClass("disabled")) return;
                switch (level) {
                    case 2:
                        _this._day = ~~this.innerHTML;
                        items.removeClass("current");
                        item.addClass("current");
                        _this.fireEvent("selectDay", [_this._day, _this._month, _this._year]);
                        _this.fireEvent("selectDate", [_this._year, _this._month, _this._day]);
                        return;
                    break;
                    case 1:
                        _this._month = item.index()+1;
                        _this._day   = 1;
                        _this._level = 2;
                        _this.fireEvent("selectMonth", [_this._month, _this._year]);
                    break;
                    case 0:
                        _this._year  = ~~this.innerHTML;
                        _this._month = 1;
                        _this._day   = 1;
                        _this._level = 1;
                        _this.fireEvent("selectYear", [_this._year]);
                    break;
                }
                _this.fireEvent("selectDate", [_this._year, _this._month, _this._day]);
                wrap  = pWraps[level+1];
                items.removeClass("current");
                item.addClass("current");
                _this._dateBar.stop().css("opacity", 0);
                _this._dateBar.animate(OPACITY_ANIMATE[1], 300);
                _this._yearPanel.stop().animate(PANEL_ANIMATE[level+1], 300);
                switchDate(_this, wrap, wrap.current, 0);
                _this._dateBar.animate(OPACITY_ANIMATE[1], 300);
            });
            this._container.find(".top-bar").on("click", ".prev, .date, .next", function()
            {
                var level = _this._level;
                if (anima.lock) return;
                switch (this.className) {
                    case "date":
                        _this._yearPanel.stop();
                        if (level===0) return;
                        anima.lock = true;
                        _this._level = --level;
                        _this._dateBar.stop().css('opacity', 0);
                        switchDate(_this, pWraps[level], pWraps[level].current, 0);
                        _this._dateBar.stop().animate(OPACITY_ANIMATE[1], 300);
                        _this._yearPanel.animate(PANEL_ANIMATE[level], 300, function()
                        {
                            anima.lock = false;
                        });
                    break;
                    default:
                        var a = anima[this.className];
                        if (anima.lock) return;
                        a.wrap = pWraps[level];
                        a.play();
                }
            });
        });
        Public.getDate = function()
        {
            return new Date(this._year, this._month - 1, this._day);
        };
        Public.setDate = function(date)
        {
            var 
                y = date.getFullYear(),
                m = date.getMonth() + 1,
                d = date.getDate()
            ;
            if (y === this._year && m === this._month && d === this._day) return;
            this._year  = y;
            this._month = m;
            this._day   = d;
            switchDate(
                this, 
                this._panelWraps[this._level], 
                this._panelWraps[this._level].current, 
                0
            );
        };
        Public.getYear = function()
        {
            return this._year;
        };
        Public.setYear = function(year)
        {
            year = Math.max(Math.min(~~year, MAX_YEAR), MIN_YEAR);
            if (year === this._year && this._month === 1) return;
            this._year  = year;
            this._month = 1;
            this._day   = 1;
            switchDate(
                this, 
                this._panelWraps[this._level], 
                this._panelWraps[this._level].current, 
                0
            );
        };
        Public.getMonth = function()
        {
            return this._month;
        };
        Public.setMonth = function(month)
        {
            month = Math.max(Math.min(~~month, 12), 1);
            this._month  = month;
            this._day    = 1;
            if (this._level > 0)  {
                switchDate(
                    this, 
                    this._panelWraps[this._level], 
                    this._panelWraps[this._level].current, 
                    0
                );
            }
        };
        Public.getDay = function()
        {
            return this._day;
        };
        Public.setDay = function(day)
        {
            var items = null;
            day = Math.max(Math.min(~~day, Calendar.getMaxDayOfMonth(this._year, this._month)), 1);
            
            this._day = day;
            if (this._level < 2)  return;
            items = this._panelWraps[2].current.items;
            XList.forEach(items, function(item)
            {
                if (item.className === "disabled") return;
                item.className = ~~item.innerHTML === day ? "current" : "";
            });
        };

        Public.show = function(left, top)
        {
            top  = ~~top;
            left = ~~left;
            this._container.css({left:left, top:top});
            this._container.addClass("show");
            //this._container.css(SHOW_CSS);
            /*this._container.css({
                display : "block",
                opacity : 0,
                top     : top - 10,
                left    : left
            });
            this._container.stop().animate({
                top     : top,
                opacity : 1
            }, 150);*/
            this.fireEvent("show");
        };

        Public.hide = function()
        {
            this._container.removeClass("show");
            this._container.css({left:-9999, top:-9999});
            this.fireEvent("hide");
        }

        function initWrap(wrap, span)
        {
            span             = span || "span";
            wrap.first       = wrap.find(".panel:first-child");
            wrap.first.items = wrap.first.find(span);
            wrap.last        = wrap.find(".panel:last-child");
            wrap.last.items  = wrap.last.find(span);
            wrap.current     = wrap.first;
            return wrap;
        };
        function switchDate(calendar, wrap, panel, next)        
        {
            var items = panel.items;
            wrap.current = panel;
            switch(calendar._level)
            {
                case 2:
                    var 
                        now   = null,
                        f_day = null,
                        y     = calendar._year,
                        m     = calendar._month
                        d     = 0
                    ;
                    if (next) {
                        now = new Date(y, m + next - 1, 1),
                        y   = calendar._year  = now.getFullYear();
                        m   = calendar._month = now.getMonth() + 1;
                              calendar._day   = 1;
                    }
                    calendar._dateBar.html(y + "年" + m + "月");
                    f_day = Calendar.getFirstDayOfWeek(y, m);
                    if (f_day > 0) {
                        var e = new Date(y, m - 1, 0).getDate();
                        for (var s = e - f_day + 1; s <= e; s++) {
                            items[d].className = "disabled";
                            items[d].innerHTML = s;
                            d++;
                        }
                    }
                    panel._year  = y;
                    panel._month = m;
                    var r = calendar._cyear === y && calendar._cmonth === m;
                    for (var s = 1, e = Calendar.getMaxDayOfMonth(y, m); s <= e; s++, d++) {
                        if (next && r && s === calendar._cday) {
                            items[d].className = "current";
                        } else {
                            items[d].className = (!r || !next) && s === calendar._day ? "current" : "";
                        }
                        items[d].innerHTML = s;
                    }

                    if (d < 42) {
                        for (var s = 1; d<42; s++, d++) {
                            items[d].className = "disabled";
                            items[d].innerHTML = s;
                        }
                    }
                break;
                case 1:
                    calendar._year  = Math.max(Math.min(calendar._year + next, MAX_YEAR), MIN_YEAR);
                    if (next) {
                        calendar._month = 1;
                        calendar._day   = 1;
                    }
                    calendar._dateBar.html(calendar._year);
                    items.removeClass("current");
                    if (next && calendar._year === calendar._cyear) {
                        items[calendar._cmonth - 1].className = "current";
                    } else {
                        items[calendar._month-1].className = 'current';
                    }
                break;
                case 0:
                    var 
                        start = Math.max(Math.min(~~((calendar._year + next*10) / 10) * 10, MAX_YEAR - 9), MIN_YEAR)
                        end   = start + 9
                    ;

                    calendar._year  = Math.max(Math.min(calendar._year, end), start);
                    calendar._month = 1;
                    calendar._day   = 1;
                    calendar._dateBar.html(start + "-" + end);
                    for (var s = start - 1, e = end + 1, i = 0; s <= e; s++, i++) {
                        var item = items[i];
                        if (s < start || s === e) {
                            if (s === 1899) {
                                item.className = "disabled";
                                item.innerHTML = "&nbsp;";
                            } else {
                                item.className = "gray";
                                item.innerHTML = s;
                            }
                        } else {
                            item.className = s === calendar._year ? "current" : "";
                            item.innerHTML = s;
                        }
                    }
            }

        }
        function switchPanel(value)
        {
            this.wrap.css("marginLeft", value.marginLeft);
        }
        function switchPanelStartHandler()
        {
            var 
                wrap  = this.wrap,
                first = wrap.first,
                last  = wrap.last 
            ;
            this.anima.lock = true;
            if (this === this.anima.next) {
                if (wrap._) {
                    switchDate(this.calendar, wrap, first, 1);
                    wrap.css("marginLeft", 0);
                    last.insertBefore(first);
                    wrap.first = last;
                    wrap.last  = first;
                } else {
                    switchDate(this.calendar, wrap, last, 1);
                }
                wrap._ = true;
            } else {
                if (!wrap._) {
                    switchDate(this.calendar, wrap, last, -1);
                    wrap.css("marginLeft", -182);
                    last.insertBefore(first);
                    wrap.first = last;
                    wrap.last  = first;
                } else {
                    switchDate(this.calendar, wrap, first, -1);
                }
                wrap._ = false;
            }
        }
        function switchPanelDoneHandler()
        {
            this.anima.lock = false;
        }
        function getCalendarHtml(date)
        {
            var 
                year  = date.getFullYear(),
                month = date.getMonth() + 1,
                day   = date.getDate(),
                f_day = Calendar.getFirstDayOfWeek(year, month),
                y_start = ~~(year/10) * 10,
                y_end   = y_start + 9,
                y_items = "",
                m_items = "",
                d       = 0,
                d_items = ""
            ;
            for (var s = y_start - 1, e = y_end + 1; s <= e; s++) {
                if (s < y_start || s === e) {
                    y_items += s === 1899 ? '<span class="disabled"></span>' : '<span class="gray">'+s+'</span>';
                } else {
                    y_items += '<span '+(s === year ? 'class="current"' : '')+'>'+s+'</span>';
                }
            }
            m_items = XList.map(MONTH_ITEMS, function(item, index) {
                return '<span '+(index+1 === month ? 'class="current"' : '')+'>'+item+'月</span>';
            }).join("");
            if (f_day > 0) {
                var e = new Date(year, month - 1, 0).getDate();
                for (var s = e - f_day + 1; s <= e; s++) {
                    d_items += '<span class="disabled">'+s+'</span>';
                    d++;
                }
            }
            for (var s = 1, e = Calendar.getMaxDayOfMonth(year, month); s <= e; s++) {
                d_items += '<span '+(s === day ? 'class="current"':'')+'>'+s+'</span>';
                d++;
            }
            if (d < 42) {
                for (var s = 1; d++<42; s++) {
                    d_items += '<span class="disabled">'+ s+'</span>';
                }
            }
            return XString.format(
                TEMPLATE,
                year + "年" + month + "月",
                y_items,
                m_items,
                d_items
            );
        }

        TEMPLATE = 
         '<div class="top-bar">'
        +'  <span class="prev"><i class="icon arrow-left"></i></span>'
        +'  <div class="date">{0}</div>'
        +'  <span class="next"><i class="icon arrow-right"></i></span>'
        +'</div>'
        +'<div class="panel-container">'
        +'  <div class="year-panel">'
        +'      <div class="wrap" level="0">'
        +'          <div class="panel">{1}</div>'
        +'          <div class="panel">' + XList.map(MONTH_ITEMS, function(item){return '<span></span>'}).join("") + '</div>'
        +'      </div>'
        +'  </div>'
        +'  <div class="month-panel">'
        +'      <div class="wrap" level="1">'
        +'          <div class="panel">{2}</div>'
        +'          <div class="panel">' + XList.map(MONTH_ITEMS, function(item){return '<span>' + item + '月</span>'}).join("") + '</div>'
        +'      </div>'
        +'  </div>'
        +'  <div class="day-panel">'
        +'      <div class="wrap" level="2">'
        +'          <div class="panel">'
        +               WEEK_BAR_TPL
        +'              <div class="days">{3}</div>'
        +'          </div>'
        +'          <div class="panel">'
        +               WEEK_BAR_TPL
        +'              <div class="days">' + XList.map(new Array(42), function(item){return '<span></span>'}).join("") + '</div>'
        +'          </div>'
        +'      </div>'
        +'  </div>'
        +'</div>';

    });  
});
