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
 * <Tree.js> - 2014/4/23
 * @version 0.1
 * @author  Joye, maolion.j@gmail.com
 * @website http://maolion.com
 */


Define(
"Tree",
Depend("~/Cox/Extends/jQuery"),
function(require, Tree, module)
{
    var
        jQuery = require("jQuery")
    ;

    Tree = module.exports = Class("Tree", Extends(Cox.EventSource), function(Static, Public)
    {
        Public.constructor = XFunction(jQuery, Optional(Array, null), Optional(Boolean, true), function(tree, treeList, auto)
        {
            var _this = this;
            this.Super("constructor");
            this.dispatchEvent(
                new Cox.Event("append"),
                new Cox.Event("remove"),
                new Cox.Event("removeAll"),
                new Cox.Event("active"),
                new Cox.Event("fold"),
                new Cox.Event("unfold")
            );
            this._autoFold = auto;
            this._tree = tree;
            this._dataCache = {};
            tree.on("click", "li>span", function()
            {
                var 
                    title   = jQuery(this),
                    li      = title.parent(),
                    id      = li.attr("data-id"),
                    prev    = _this._tree.find("li>span.active")
                ;
                prev.removeClass("active");
                title.addClass("active");
                _this.fireEvent("active", [id, _this._dataCache[id], li]);
                _this.unFold(li);
            });
            tree.on("click", "li.node>i.fold-btn", function()
            {
                var 
                    btn = jQuery(this),
                    li  = btn.parent("li"),
                    id  = li.attr("data-id")
                ;
                if (!li.hasClass("unfold")) {
                    _this.unFold(li);
                } else {
                    _this.fold(li);
                }
            });
            treeList && treeList.length && this.append(treeList);
        });

        Public.append = XFunction(Optional(String), Array, function(pid, list)
        {
            (pid ? getTree(pid, this._tree) : this._tree).append(toTreeHtml(list, this));
            this.fireEvent("append",[list]);
        });
        Public.append.define(Optional(String), Cox.PlainObject, function(pid, item)
        {
            (pid ? getTree(pid, this._tree) : this._tree).append(toTreeHtml([item], this));
            this.fireEvent("append", [item]);
        });
        Public.update = XFunction(String, String, Object, function(id, pid, item)
        {
            var li   = this._tree.find('li[data-id='+id+']');
            if (li.parents("li").attr("data-id") !== pid) {
                this.remove(id);
                this.append(pid, item);
            } else {
                li.children("span").html(this.item(item));
            }
        });
        
        Public.remove = function(id)
        {
            var 
                li   = this._tree.find('li[data-id='+id+']'),
                data = this._dataCache[id],
                pli   = li.parents("li")
            ;
            li.remove();
            delete this._dataCache[id];
            if (pli.find("li").length === 0) {
                pli.removeClass("node");
            }
            this.fireEvent("remove", [id, data, li]);
        };
        Public.removeAll = function()
        {
            this._tree.empty();
            this._dataCache = {};
            this.fireEvent("removeAll");
        };
        Public.fold = XFunction(function()
        {
            this._tree.find("li.node").removeClass("unfold");
            this.fireEvent("flod");
        });
        Public.fold.define(jQuery, function(li)
        {
            li.removeClass("unfold");
            this.fireEvent("fold", [li.attr("data-id"), this._dataCache[li.attr("data-id")], li]);
        });
        Public.fold.define(String, function(id)
        {
            var li = this._tree.find("li[data-id="+id+"]");
            li.removeClass("unfold");
            this.fireEvent("fold", id, this._dataCache[id], li);
        });
        Public.unFold = XFunction(function()
        {
            this._tree.find("li.node").addClass("unfold");
            this.fireEvent("unflod");
        });
        Public.unFold.define(jQuery, function(li)
        {
            var
                id = li.attr("data-id"),
                unflods = this._tree.find('li.unfold')
            ;
            if (unflods.length && this._autoFold) {
                for (var i = 0, c = li[0], l = unflods.length; i < l; i++) {
                    if (!jQuery.contains(unflods[i], c)) {
                        var 
                            item = jQuery(unflods[i]),
                            uid  = item.attr("id")
                        ;
                        item.removeClass("unfold");
                        this.fireEvent("unfold", [uid, this._dataCache[uid], item]);
                    }
                }
            }
            li.has("ul").length && li.addClass("unfold");
            this.fireEvent("fold", [id, this._dataCache[id], li]);
        });
        Public.unFold.define(String, function(id)
        {
            this.unFlod(this._tree.find('li[data-id='+id+']'));
        });
        Public.childs = function(id)
        {
            var 
                _this = this,
                tree = id ? this._tree.find('li[data-id='+id+']>ul') : this._tree
            ;
            return tree.children('li').map(function(index, item)
            {
                return _this._dataCache[item.getAttribute("data-id")];
            });
        };
        Public.isLeaf = XFunction(String, function(id)
        {
            return this._tree.find('li[data-id='+id+']>ul').length === 0;
        });
        Public.isLeaf.define(jQuery, function(leaf)
        {
            return leaf.children('ul').length === 0;
        });
        Public.item = function(item) {
            return item.Name;
        };
        Public.getItem = function(id) {
            return this._dataCache[id];
        };
        function toTreeHtml(list, obj)
        {
            var 
                struct    = "",
                item      = null
            ;
            list = list.slice();
            while(item = list.shift())
            {
                var 
                    childs    = item.Children,
                    hasChilds = childs && childs.length > 0
                ;
                if (typeof item === 'string') {
                    struct += item;
                    continue;
                }
                obj._dataCache[item.ID] = item;
                struct += '<li data-id="' + item.ID + '"' + (hasChilds ? ' class="node" ' : "") +'>'
                        + '<i class="fold-btn"></i>'
                        + '<span>'+obj.item(item)+'</span>'
                ;
                if (hasChilds) {
                    struct += '<ul>';
                    list.unshift.apply(list, childs.concat('</ul></li>'));
                } else {
                    struct += '</li>';
                }
            }
            return struct;
        }
        function getTree(id, tree)
        {
            var 
                li = tree.find("li[data-id="+id+"]")
                container = li.children("ul")
            ;
            li.addClass("node");
            if (!container.length) {
                container = jQuery("<ul></ul>");
                li.append(container);
            }
            return container;
        };
    });
    
});