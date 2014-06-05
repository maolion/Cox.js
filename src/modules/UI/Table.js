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
 * <Table.js> - 2014/3/27
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */

Define(
"Table", 
Depend("~/Cox/Extends/jQuery"), 
function(require, Table, module)
{
    var 
        jQuery = require("jQuery"),
        WINDOW = jQuery(window),
        DOC    = jQuery(document),
        UID    = function(){
            var uid = new Date().getTime();
            return function(prefix)
            {
                return (prefix || "") + uid++;
            };
        }(),
        SORT   = {
            ASC  : function(a, b){ return a > b ? 1 : -1;},
            DESC : function(a, b){ return a > b ? -1 : 1;}
        }
    ;

    Table = module.exports = new Class("Table", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_SORT = /\bsort\b/i,
            TH_CB_SELECTOR = "th[name=-] input[type=checkbox]",
            TD_CB_SELECTOR = "td[name=-] input[type=checkbox]",
            FILTER_BTN_TPL = '<a title="筛选" class="filter-btn" href="javascript:;"><i class="fa fa-filter"></i></a>',
            OPERATOR_TEMP  = {
                modify : '<a class="icon" href="javascript:;" operator="modify" title="编辑">编辑</a>',//<i class="fa fa-edit"></i>
                remove: '<a class="icon" href="javascript:;" operator="remove" title="删除">删除</a>',//<i class="fa fa-trash-o"></i>
                reply: '<a class="icon" href="javascript:;" operator="reply" title="回复">回复</a>',//<i class="fa fa-reply"></i>
                up: '<a class="icon" href="javascript:;" operator="up" title="上移">上移</a>',//<i class="fa fa-chevron-up"></i>
                down: '<a class="icon" href="javascript:;" operator="down" title="下移">下移</a>',//<i class="fa fa-chevron-down"></i>
                view: '<a class="icon" href="javascript:;" operator="view" title="浏览">浏览</a>'//<i class="fa fa-eye"></i>
            }            
            DEFAULT_OP     = "modify, remove",
            DEFAULT_OP_T   = OPERATOR_TEMP.modify + OPERATOR_TEMP.remove  
        ;
        
        Public.constructor = XFunction(jQuery, function(table)
        {
            var 
                _this = this,
                thead = null,
                tbody = null
            ;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("select"),
                new Cox.Event("rowMoves"),
                new Cox.Event("append"),
                new Cox.Event("update"),
                new Cox.Event("remove"),
                new Cox.Event("sort"),
                new Cox.Event("modifyBtnClick"),
                new Cox.Event("removeBtnClick"),
                new Cox.Event("viewBtnClick"),
                new Cox.Event("replyBtnClick"),
                new Cox.Event("upBtnClick"),
                new Cox.Event("downBtnClick")
            );
            
            this._table        = table;
            this._thead        = thead = table.find("thead");
            this._tbody        = tbody = table.find("tbody");
            this._columnInfo   = {};
            this._startSnumber = 0;
            this._nextSnumber  = 0;
            this._stepSnumber  = 1;
            this._dataCache    = {};
            thead.dropdowns    = thead.find("th .panel-container .dropdown");
            this._columns      = thead.find("th").map(function(index, item)
            {
                var 
                    cname = item.getAttribute("name"),
                    info  = null
                ;
                _this._columnInfo[cname] = info = {
                    index  : index,
                    name   : cname,
                    text   : item.innerText || item.textContent,
                    sort   : RE_SORT.test(item.className),
                    width  : item.offsetWidth,
                    format : item.getAttribute("format") || "",
                    order  : item.getAttribute("order")
                };
                switch(cname)
                {
                    case "%":
                        var 
                            operator = item.getAttribute("operator") || DEFAULT_OP
                        ;
                        if (operator !== DEFAULT_OP) {
                            info.operator = XList.reduce(XString.trim(operator).split(/\s*[,|]\s*/), function(a, b)
                            {
                                return a + (OPERATOR_TEMP[b]||"");
                            }, "");
                        } else {
                            info.operator = DEFAULT_OP_T;
                        }
                    break;
                }
                item = jQuery(item);
                item.hasClass("filter") && item.append(FILTER_BTN_TPL);
                var dropdown = item.find(".panel-container .dropdown");
                if (dropdown.length) {
                    thead.dropdowns[cname] = dropdown;
                }
                return cname;
            });
            thead.on("click", "th.sort", function(event)
            {   
                var item = jQuery(this);

                if (item.hasClass("asc")) {
                    item.addClass("desc").removeClass("asc");
                    _this.fireEvent("sort", [item.attr("name"), "desc"])
                } else {
                    item.addClass("asc").removeClass("desc");
                    _this.fireEvent("sort", [item.attr("name"), "asc"]);
                }
            });
            thead.on("click", "th div.panel-container, th a.filter-btn", stopPropagation);
            
            thead.on("click", "th a.filter-btn", function ()
            {
                DOC.trigger("click");
                _this.showTheadDropDown(jQuery(this).parent().attr("name"));
            });
            thead.on("click", "th button[filter]", function ()
            {
                DOC.trigger("click");
                _this.hideTheadDropDown();
            });

            if (this._columnInfo.hasOwnProperty("-")) {
                thead.on("click", TH_CB_SELECTOR, function()
                {
                    var 
                        checkboxs = _this._tbody.find(TD_CB_SELECTOR),
                        value     = !!this.checked
                    ;

                    checkboxs.each(function(index, checkbox)
                    {
                        checkbox.checked = value;
                    });
                    _this.fireEvent("select", [_this.getSelected()]);

                });

                tbody.on("click", TD_CB_SELECTOR, function()
                {
                    _this.fireEvent("select", [_this.getSelected()]);
                });
            }
            if (this._columnInfo.hasOwnProperty("%")) {
                tbody.on("click", "a.icon[operator]", function()
                {
                    var 
                        btn = jQuery(this),
                        row = btn.parents("tr"),
                        id  = row.attr("data-id"),
                        op  = btn.attr("operator")
                    ;
                    op && _this.fireEvent(op+"BtnClick", [id, XObject.mix({},_this._dataCache[id]), row]);
                });
            }
        });

        Public.append = XFunction(Cox.PlainObject, function(data)
        {
            var 
                _this      = this,
                columnInfo = this._columnInfo,
                table      = this._tbody[0],
                row        = table.insertRow(table.rows.length),
                columns    = this._columns
            ;
            if (data.ID)
                this._dataCache[data.ID] = data;
            for (var i = 0, l = columns.length; i < l; i++) {
                var 
                    cname = columns[i],
                    cell  = row.insertCell(i),
                    info  = columnInfo[cname]
                ;
                row.setAttribute("data-id", data.ID);

                switch(cname)
                {
                    case "-":
                        cell.setAttribute("name", "-");
                        cell.innerHTML = '<input type="checkbox" />';
                        cell.className = "center";
                    break;
                    case "#":
                        cell.setAttribute("name", "#");
                        cell.className = info.format;
                        cell.innerHTML = _this._nextSnumber += _this._stepSnumber;
                    break;
                    case "%":
                        var other = '';
                        if (info.conversion instanceof Function) {
                            other = info.conversion(data[name], data);
                        }
                        cell.setAttribute("name", "%");
                        cell.innerHTML = info.operator + other;
                        cell.className = info.format;
                    break;
                    default:
                        cell.setAttribute("name", cname);
                        cell.className = info.format;
                        cell.innerHTML = info.conversion ? info.conversion(data[cname], data) : data[cname] || "&nbsp;";
                        if(!info.conversion) {
                            cell.title = data[cname]||"";
                        }
                }

            }
        });

        Public.append.define(Array, function(data)
        {
            for (var i =0, l = data.length; i < l; i++) {
                this.append(data[i]);
            }
        });
        
        Public.update = XFunction(Optional(String, ""), Cox.PlainObject, function(dataId, data)
        {
            var 
                dataId  = dataId || data.ID,
                row     = this._tbody.find("tr[data-id=" + dataId + "]"),
                columns = this._columns,
                cinfo   = this._columnInfo,
                cache   = this._dataCache[dataId] || {},
                cells   = null
            ;
            if (!row.length) {
                return this.append(data);
            };
            cells = row[0].cells;
            
            if (data.ID && dataId !== data.ID)
                row.attr("data-id", data.ID);

            for(var k in data) {
                var 
                    info  = cinfo[k],
                    value = data[k]
                ;
                if (k === "-" || k === "#" || k ==="%") continue;
                cache[k] = value;
                if (!data.hasOwnProperty(k) || !cinfo.hasOwnProperty(k)) continue;
                cells[info.index].innerHTML = info.conversion ? info.conversion(value, data) : value || "&nbsp;";
                if(!info.conversion) {
                    cells[info.index].title = value||"";
                }
            }
            this._dataCache[dataId] = cache;
            this.fireEvent("update", [dataId, data]);
        });

        Public.update.define(Optional(Boolean, false), Array, function(reset, list)
        {
            if (reset) {
                this.removeAll();
                return this.append(list);
            }
            for (var i = 0, l = list.length; i < l; i++) {
                this.update(list[i].ID, list[i]);
            }
        });

        Public.remove = XFunction(Array, function(ids)
        {
            var 
                table  = this._tbody[0],
                rows   = table.rows,
                index  = {}
            ;
            for (var i = 0, l = ids.length; i < l; i++) {
                index[ids[i]] = true;
            }

            for (var i = rows.length - 1; i >= 0; i--) {
                var id = rows[i].getAttribute("data-id");
                if (index.hasOwnProperty(id)) {
                    delete this._dataCache[id];
                    table.deleteRow(i);
                }
            }
            this.updateSerialNumber();
            this.fireEvent("remove", [ids]);
            return ids;
        });

        Public.remove.define(Params(String), function(ids)
        {
            return this.remove(ids);
        });

        Public.remove.define(Params(Number), function(index)
        {
            var 
                table = this._tbody[0],
                index = index.sort(SORT.DESC),
                rows  = table.rows,
                ids   = []
            ;
            for (var i = 0, l = index.length; i < l; i++) {
                var id = rows[index].getAttribute("data-id");
                ids.push(id);
                delete this._dataCache[id];
                table.deleteRow(index);
            }
            this.updateSerialNumber();
            this.fireEvent("remove", [ids]);
            return ids;
        });

        Public.remove.define(Function, function(callback)
        {
            var 
                table = this._tbody[0],
                rows  = table.rows,
                ids   = []
            ;

            for (var i = rows.length; --i >= 0; ) {
                var 
                    row    = rows[i],
                    dataId = row.getAttribute("data-id")
                ;

                if (callback(i, dataId, row, row.cells)) {
                    table.deleteRow(i);
                    ids.push(dataId);
                    delete this._dataCache[dataId];
                }
            }
            this.updateSerialNumber();
            this.fireEvent("remove", [ids.reverse()]);
            return ids;
        });

        Public.removeAll = function()
        {
            var 
                table = this._tbody[0],
                rows  = table.rows,
                ids   = []
            ;
            while (rows.length) {
                ids.push(rows[0].getAttribute("data-id"));
                table.deleteRow(0);
            }
            this._dataCache   = {};
            this._nextSnumber = this._startSnumber;
            this.fireEvent("remove", [ids, true]);
            return ids;
        };
        Public.unSelect = function()
        {
            this._thead.find(TH_CB_SELECTOR).attr("checked", false);
            this._tbody.find(TD_CB_SELECTOR).each(function(index, checkbox)
            {
                this.checked = false;
            });
            this.fireEvent("select", [[]]);
        };
        Public.getSelected = function()
        {
            return XList.map(this.getSelectedRow(), function(row, index) {
                return row.getAttribute("data-id");
            });
        };

        Public.getSelectedRow = function()
        {
            var result = [];
            
            this._tbody.find(TD_CB_SELECTOR).map(function(index, checkbox)
            {
                if (!this.checked) return;
                var row = jQuery(this).parents("tr")[0];
                result.push(row);
            });
            return result;
        };
        Public.getSelectedData = function()
        {
            var 
                result = [],
                cache  = this._dataCache
            ;
            
            this._tbody.find(TD_CB_SELECTOR).map(function(index, checkbox)
            {
                if (!this.checked) return;
                var row = jQuery(this).parents("tr")[0];
                result.push(cache[row.getAttribute("data-id")]);
            });
            return result;
        };
        Public.getCount = function()
        {
            return this._tbody[0].rows.length;
        };

        Public.findRow = XFunction(String, function(dataId)
        {
            var 
                rows   = this._tbody[i].rows
            ;
            for (var i =0, l = rows.length; i < l; i++) {
                var row = rows[i];
                if (dataId === rows.getAttribute("data-id")) {
                    return row;
                }
            }
        });

        Public.findRow.define(Function, function(callback)
        {
            var 
                rows   = this._tbody[i].rows,
                resuls = []
            ;
            for (var i =0, l = rows.length; i < l; i++) {
                var row = rows[i];
                if (callback(row)) {
                    resuls.push(row);
                    //return row;
                }
            }
            return resuls;
        });

        Public.findData = XFunction(String, function(id)
        {
            return this._dataCache[id];
        });

        Public.findData.define(Function, function(callback)
        {
            var 
                cache  = this._dataCache,
                resuls = []
            ;
            for (var id in cache) {
                if (cache.hasOwnProperty(id) && callback(cache[id], id)) {
                    resuls.push(cache[id], id);
                }
            }
            return resuls;
        });

        Public.thead = function()
        {
            return this._thead;
        }
        Public.tbody = function()
        {
            return this._tbody;
        };

        Public.getRowColumns = function(row)
        {
            var 
                r     = {},
                cells = row.cells
            ;
            XList.forEach(this._columns, function(cname, index)
            {
                r[cname] = row.cells[index];
            });
            return r;
        };

        Public.rowMovesUp = XFunction(Number, function(index)
        {
            var rows = this._tbody[0].rows;
            index = Math.abs(~~index);
            if (index === 0) return;
            return rowsMoves(this, "up", rows[index-1], rows[index])
        });

        Public.rowMovesUp.define(Object, function(row)
        {
            var 
                table = this._tbody[0],
                rows  = table.rows
            ;
            if (!row || row === rows[0]) return;   
            return rowsMoves(this, "up", rows[row.rowIndex - 2], row);
        });

        Public.rowMovesDown = XFunction(Number, function(index)
        {
            var rows = this._tbody[0].rows;
            index = Math.abs(~~index);
            if (index === rows.length - 1) return;
            return rowsMoves(this, "down", rows[index + 2], rows[index]);
        });
        Public.rowMovesDown.define(Object, function(row)
        {
            var 
                table = this._tbody[0],
                rows  = table.rows
            ;
            if (!row || row === rows[rows.length - 1]) return;   
            return rowsMoves(this, "up", rows[row.rowIndex + 2], row); 
        });
        Public.itemEvent = function(type, selector, handler)
        {
            this._tbody.on(type, "tr>td " + selector, handler);
        };

        Public.updateSerialNumber = function(start, step)
        {
            var 
                start  = ~~start||(this._startSnumber+this._stepSnumber),
                _tbody = this._tbody,
                sn     = null;
            ;
            step   = ~~step||this._stepSnumber;
            start -= step;
            this._startSnumber = start;
            this._nextSnumber  = start;
            this._stepSnumber  = step;
            if (!this._columnInfo.hasOwnProperty("#")) return;
            _tbody.find("tr>td[name=#]").each(function(index, td)
            {
                td.innerHTML = start += step;
            });
            this._nextSnumber = start;
        };
        Public.getTheadDropDown = function(name)
        {
            return this._thead.dropdowns[name];
        };
        Public.showTheadDropDown = function(name)
        {
            var 
                dropdown = this._thead.dropdowns[name]
            ;
            if (!dropdown) return;
            this.hideTheadDropDown();
            dropdown.addClass("show");
            DOC.off("click", hideDropDownHandler);
            hideDropDownHandler.table = this;
            DOC.one("click", hideDropDownHandler);
        };

        Public.hideTheadDropDown = function ()
        {
            this._thead.dropdowns.removeClass("show");
            DOC.off("click", hideDropDownHandler);
        };

        Public.getColumnInfo = function(name)
        {
            return this._columnInfo[name];
        };
        Public.getData = function()
        {
            return this._dataCache;
        };
        Public.setConversion = XFunction(Cox.PlainObject, function(conversion)
        {
            var cinfo = this._columnInfo;
            XObject.forEach(conversion, true, function(v, k)
            {
                if (cinfo[k]) {
                    cinfo[k].conversion = v;
                }
            });
        });
        Public.setConversion.define(String, Function, function(name, conversion) 
        {
            if (this._columnInfo[name])
                this._columnInfo[name].conversion = conversion;
        });
        Public.addOperatorButton = function(operator, title, icon, callback) 
        {
            var info = this._columnInfo['%'];
            if (!info) return;
            this.dispatchEvent(
                new Cox.Event(operator + "BtnClick")
            );
            if (callback) {
                this.on(operator+"BtnClick", callback);
            }
            info.operator += '<a class="icon" href="javascript:;" operator="'+operator+'" title="'+(title||"")+'">'+icon+'</a>';
        };
        function hideDropDownHandler(event)
        {
            var 
                target = jQuery(event.srcElement || event.target),
                table  = hideDropDownHandler.table
            ;
            table && table.hideTheadDropDown();
            hideDropDownHandler.table = null;
        }

        function rowsMoves(_this, d, refer, row)
        {
            if (!refer) {
                _this._tbody.append(row);
            } else {
                _this._tbody[0].insertBefore(row, refer);
            }
            _this.updateSerialNumber();
            _this.fireEvent("rowMoves", [d, row]);
        };

        function stopPropagation(event)
        {
            //DOC.trigger("click");
            event.stopPropagation();
        }
    });
});