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


Define("jQuery.Dom", Depend("./jQuery", "~/Cox/Env"), function(require, Dom, modules)
{
    var 
        jQuery   = require("jQuery"),
        Env      = require("Env"),
        CLIENT   = jQuery( document ),
        DOC      = document,
        DOC_ROOT = document.documentElement,
        BODY     = document.body
    ;
    Dom.containersClass = function ( target, className ){
        return new RegExp( "^(?:.*\\s)?" + className + "(?:\\s.*)?$" ).test( target.className );
    };

    Dom.addClass = function( target, className ){
        className = XString.trim( className );
        if( !Dom.containersClass( target, className ) ){
            target.className = XString.trim( target.className += " " + className );
        }
    };

    Dom.removeClass = function( target, className ){
        target.className = target.className.replace(
            new RegExp( "^(?:(.*)\\s)?" + className + "(?:\\s(.*))?$" ), "$1$2"
        );
    };

    Dom.replaceClass = function( target, oldClass, newClass ){
        target.className = target.className.replace(
            new RegExp( "^(.*\\s)?" + oldClass + "(\\s.*)?$" ), 
            "$1" + newClass + "$2"
        );
    };

    Dom.toggleClass = function( target, className, toggle ){
        toggle = arguments.length < 3 ? null : !!toggle;
        if( toggle === null ){
            toggle = !Dom.containersClass( target, className );
        }
        Dom[ toggle ? "addClass" : "removeClass" ]( target, className );
        return toggle;
    };

    Dom.setStyle = XFunction( Object, Cox.PlainObject, function( element, style ){
        XObject.forEach( style, true, function( value, key ){
            element.style[ key ] = value.toString();
        } );
    } );

    Dom.getStyle = XFunction( 
        Object, String, 
        [   
            function( element, key ){
                return element.currentStyle[ key ];
            },
            function( element, key ){
                return window.getComputedStyle( element, null )[ key ];
            }
        ][ ~~Env.renderEngine.computedStyle ]
    );

    Dom.getStyle.define( Object, Params( String ), function( element, keys ){
        var values = {};
        XList.forEach( keys, function( key ){
            values[key] = Dom.getStyle( element, key );
        } );
        return values;
    } );

    Dom.containersElement = function( container, child ){
        if( container === child ){
            return false;
        }
        try{
            return container.containers 
                 ? container.containers( child ) 
                 : !!( container.compareDocumentPosition( child ) & 16 )
            ;
        }catch( e ){
            return false;
        }
    };


    Dom.intersectRect = function( rect1, rect2 ){
        var 
            A = null,
            B = null,
            C = null
        ;

        A = {
            left   : rect1.left,
            top    : rect1.top,
            right  : rect1.left + rect1.width,
            bottom : rect1.top + rect1.height
        };

        B = {
            left   : rect2.left,
            top    : rect2.top,
            right  : rect2.left + rect2.width,
            bottom : rect2.top + rect2.height
        };

        C = {
            left   : Math.max( A.left, B.left ),
            top    : Math.max( A.top, B.top ),
            right  : Math.min( A.right, B.right ),
            bottom : Math.min( A.bottom, B.bottom )
        };

        return !( C.left > C.right || C.top > C.bottom );
    };

    //判断元素是否可见
    Dom.elementIsVisible = function( el, container ){
        var 
            offset     = null,
            scroll     = null,
            con_offset = container && container.offset(),
            container  = container || CLIENT
        ;
        if( el.css( "display" ) === "none" || el.css( "visibility" ) === "hidden" ){
            return false;
        }
        offset = el.offset();
        scroll = {
            top  : container.scrollTop(),
            left : container.scrollLeft()
        };

        if( el.css( "position" ) === "fixed" ){
            offset.left -= scroll.left;
            offset.top  -= scroll.top;
        }

        return Dom.intersectRect( 
            !con_offset ? {
                left   : scroll.left,
                top    : scroll.top,
                height : DOC_ROOT.clientHeight,
                width  : DOC_ROOT.clientWidth
            } : {
                left   : con_offset.left,
                top    : con_offset.top,
                height : container.height(),
                width  : container.width()
            },  
            {
                left   : offset.left,
                top    : offset.top,
                height : el.outerHeight(),
                width  : el.outerWidth()
            }
        );
    };

    Dom.XImageElement = {
        __instancelike__ : function(obj)
        {
            if (!obj || obj.nodeName !== "IMG" || obj.nodeType !== 1) {
                return false;
            }
            return true;   
        }
    };

});