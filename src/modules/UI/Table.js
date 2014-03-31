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
        },
        _JSON  = {
            __instancelike__ : function(obj)
            {
                return obj && obj.constructor === Object;
            }
        }
    ;

    Table = module.exports = new Class("Table", Extends(Cox.EventSource), function(Static, Public)
    {
        var 
            RE_SORT = /\bsort\b/i,
            TH_CB_SELECTOR = "th[name=-] input[type=checkbox]",
            TD_CB_SELECTOR = "td[name=-] input[type=checkbox]"
        ;
        
        Public.constructor = XFunction(jQuery, function(table)
        {
            var _this = this;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("selectedRow"),
                new Cox.Event("rowMoves"),
                new Cox.Event("update"),
                new Cox.Event("remove")
            );

            this._table      = table;
            this._thead      = table.find("thead");
            this._tbody      = table.find("tbody");
            this._columnInfo = {};
            this._buildData  = [];
            this._columns    = this._thead.find("th").map(function(index, item)
            {
                var cname = item.getAttribute("name");
                _this._columnInfo[cname] = {
                    name   : cname,
                    text   : item.innerText || item.textContent,
                    sort   : RE_SORT.test(item.className),
                    width  : item.offsetWidth,
                    format : item.getAttribute("format") || ""
                };
                return cname;
            });

            this._columnInfo.hasOwnProperty("-") && setupRowSelect(this, this._thead, this._tbody);
        });

        Public.appendColumn = XFunction(String, String, Optional(String, ""), Optional(Number, -1), Optional(Boolean, false), function(name, title, defaultValue, before, sort)
        {
            
        });

        Public.removeColumn = XFunction(String, function(name)
        {

        });

        Public.append = XFunction(_JSON, function(data)
        {
            var 
                columnInfo = this._columnInfo,
                table      = this._tbody[0],
                row        = table.insertRow(table.rows.length)
            ;
            XList.forEach(this._columns, function(cname, index)
            {
                var 
                    cell    = row.insertCell(index),
                    info    = columnInfo[cname]
                ;
                row.setAttribute("data-id", data.ID);

                if (cname === "-") {
                    cell.setAttribute("name", "-");
                    cell.innerHTML = '<input type="checkbox" />';
                } else {
                    cell.className = info.format;
                    cell.innerHTML = data[cname];
                }

            });
        });

        Public.append.define(Array, function(data)
        {
            var _this = this;
            XList.forEach(data, function(row)
            {
                _this.append(row);
            });
        });
        
        Public.update = XFunction(Optional(String, ""), _JSON, function(dataId, data)
        {
            var 
                dataId = dataId || data.ID,
                row    = this._tbody.find("tr[data-id=" + dataId + "]"),
                cells  = null
            ;
            if (!row.length) {
                return this.append(data);
            };
            cells = row.children("td");
            data.ID && row.attr("data-id", data.ID);
            XList.forEach(this._columns, function(cname, index)
            {
                if (cname === "-" || !data.hasOwnProperty(cname)) return;
                cells[index].innerHTML = data[cname];
            });
            this.fireEvent("update", [dataId, data]);
        });

        Public.update.define(Array, Optional(Boolean, false), function(data, reset)
        {
            var _this = this;
            if (reset) {
                this.removeAll();
                return this.append(data);
            }
            XList.forEach(data, function(data)
            {
                _this.update(data);
            });
        });

        Public.remove = XFunction(Params(String), function(ids)
        {
            var 
                tbody  = this._tbody,
                table  = tbody[0]
            ;

            XList.forEach(ids, function(dataId)
            {
                tbody.find("tr[data-id=" + dataId + "]").remove();
            });

            this.fireEvent("remove", [ids]);
            return ids;
        });

        Public.remove.define(Params(Number), function(indexs)
        {
            var 
                table = this._tbody[0],
                rows  = table.rows,
                ids   = []
            ;
            XList.forEach(indexs.sort(SORT.DESC), function(index)
            {
                ids.push(rows[index].getAttribute("data-id"));
                table.deleteRow(index);
            });

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
                }
            }

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
            this.fireEvent("remove", [ids]);
            return ids;
        };

        Public.getSelected = function()
        {
            return this.getSelectedRow().map(function(index, row) {
                return row.getAttribute("data-id");
            });
        };

        Public.getSelectedRow = function()
        {
            var result = [];
            
            this._tbody.find(TD_CB_SELECTOR).map(function(index, checkbox)
            {
                var row = jQuery(this).parents("tr")[0];
                if (!this.checked) return;
                result.push(row);
            });
            return result.length ? jQuery(result) : null;
        };

        Public.find = XFunction(String, function(dataId)
        {
            var 
                _this  = this,
                result = null,
                table  = this._tbody[0],
                rows   = table.rows
            ;

            XList.forEach(rows, function(row)
            {
                if (dataId !== row.getAttribute("data-id")) {
                    return;
                }
                result = row;
                return false;
            });
            return result;
        });

        Public.find.define(Function, function(callback)
        {
            var 
                _this  = this,
                result = [],
                table  = this._tbody[0],
                rows   = table.rows
            ;

            XList.forEach(rows, function(row)
            {
                if (callback(row)) {
                    result.push(row);
                }
            });

            return result; 
        });

        Public.getRowColumns = XFunction(Object, function(row)
        {
            var 
                r = {},
                cells = row.cells
            ;
            XList.forEach(this._columns, function(cname, index)
            {
                if (cname === "-") return;
                r[cname] = row.cells[index];
            });
            r.ID = row.getAttribute("data-id");
            return r;
        });

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

        function rowsMoves(_this, d, refer, row)
        {
            if (!refer) {
                _this._tbody.append(row);
            } else {
                _this._tbody[0].insertBefore(row, refer);
            }
            _this.fireEvent("rowMoves", [d, row]);
        };
        function setupRowSelect(_this, thead, tbody)
        {
            thead.on("click", TH_CB_SELECTOR, function()
            {
                var 
                    checkboxs = tbody.find(TD_CB_SELECTOR),
                    value     = !!this.checked
                ;

                checkboxs.each(function(index, checkbox)
                {
                    checkbox.checked = value;
                });

                if (value) {
                    _this.fireEvent("selectedRow", [
                        _this._tbody.find("tr").map(function(index, tr) {
                            return tr.getAttribute("data-id");
                        })
                    ]);
                }
            });

            tbody.on("click", TD_CB_SELECTOR, function()
            {
                if (this.checked) {
                    _this.fireEvent("selectedRow", [jQuery(this).parents("tr").attr("data-id")]);
                }
            });
        }

    });
});