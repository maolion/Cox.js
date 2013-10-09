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

Define( "Dom", Depend( "~/Cox/Env", "~/Cox/UI/Animation" ), function( require, Dom, module ){

    var 
        EMPTY_FUNCTION     = function(){},
        RE_SIMPLE_SELECTOR = /^[\.#]?[^\s\.\>\~\:\+\[\]\=\|\*]+$/,
        RE_ID_SELECTOR     = /^#[^\s\.\>\~\:\+\[\]\=\|\*]+$/,
        RE_CLASS_SELECTOR  = /^.[^\#\s\.\>\~\:\+\[\]\=\|\*]+$/,
        RE_TAG_SELECTOR    = /^[^\#\s\.\>\~\:\+\[\]\=\|\*]+$/,
        RE_INLINE_ELEMENT  = /^(AABBR|ACRONYM|B|BDO|BIG|BR|CITE|CODE|DFN|EM|I|IMG|INPUT|KBD|LABEL|Q|SAMP|SELECT|SMALL|SPAN|STRONG|SUB|SUP|TEXTAREA|TT|VAR)$/i,
        RE_CSS_UNIT        = /^[\d\.\s]+([A-Za-z]+)?$/,
        RE_DISPLAY         = /^(?:block|inline)/,
        RE_TAG             = /^[A-Za-z]+\d*$/,
        RE_MULTI_SELECTOR  = /\s*,\s*/,
        DOC                = document,
        DOC_ROOT           = document.documentElement,
        BODY               = document.body,
        Env                = require( "Env" ),
        Animation          = require( "Animation" ),
        XDom               = null,
        animaCenter        = null
        EventAliase        = Env.name !== "ie" ? {
            "mouseEnter"   : "mouseover",
            "mouseLeave"   : "mouseout"
        } : {}
    ; 
    XDom = Class( "XDom", function( Static, Public ){
        
        var 
            ANIMA_DEFAULT_DURATION   = 400,
            ANIMA_DEFAULT_TRANSITION = Animation.Transition.Quint.easeInOut
        ;

        void function(){
            var 
                MAX_ANIMA_COUNT  = 5,
                animas  = [],
                tasks   = []
            ;

            function nextTask(){
                var 
                    info  = null,
                    task  = null,
                    anima = this
                ;
                if( anima.playing() ){
                    return;
                }
                anima.removeAllClip();
                //anima.exit();
                if( anima.task ){
                    var 
                        task_cb = anima.task.callback,
                        elements = anima.task.elements
                    ;
                    anima.task.anima = null;
                    anima.task       = null;
                    XObject.forEach( elements, true, function( element ){
                        task_cb && task_cb.call( element );
                    } );
                }
                if( !tasks.length ){
                    return;
                }

                task          = tasks.shift();
                task.elements = {};
                task.anima    = anima;
                anima.task    = task;
                while( info = task.clipInfos.shift() ){
                    var id = anima.addClip( task.duration, info.options, animaUpdateCss );
                    task.elements[ id ] = info.element;
                }

                anima.restart();
            }

            function animaUpdateCss( values, id ){
                var element = this.task.elements[ id ];
                XObject.forEach( values, true, function( value, key ){
                    if( key !== "opacity" ){
                        value += "px";
                    }
                    element && ( element.style[ key ] = value );
                } );
            }

            animaCenter = {
                push : function( task ){
                    var anima = null;

                    tasks.push( task );
                    animas.length && XList.forEach( animas, function( a ){
                        if( a.stopped() ){
                            anima = a;
                        }
                    } );
                    
                    if( !anima && animas.length < MAX_ANIMA_COUNT ){
                        anima = new Animation( ANIMA_DEFAULT_TRANSITION );
                        anima.on( "done", nextTask );
                        animas.push( anima );
                    }

                    anima && nextTask.call( anima );
                },
                clear : function(){
                    tasks.length = 0;
                },
                play : function(){
                    XList.forEach( animas, function( a ){
                        a.stopped() && a.play();
                    } );
                },
                stop : function(){
                    XList.forEach( animas, function( a ){
                        a.playing() && a.stop();
                    } );
                },
                exit : function(){
                    XList.forEach( animas, function( a ){
                        a.playing() && a.exit();
                    } );
                },
                busy : function(){
                    var busy = false;
                    XList.forEach( animas, function( a ){
                        return busy = !!a.playing();
                    } );
                    return busy;
                }
            };
        }();

        Public.constructor = function( elements ){
            this.elements = XList.filter( elements || [], function( element ){
                return element;
            } );
            this.length   = this.elements.length;
        };

        Public.get = function( index ){
            return arguments.length === 0 ? this.elements : this.elements[ index ];
        };

        Public.on = Public.addEventListener = XFunction(
            String, Optional( Boolean ), Function, 
            function( type, capture, handler ){
                XList.forEach( this.elements, function( element ){
                    if( type in EventAliase ){
                        return Dom[ type ]( element, handler, capture );
                    }
                    Env.addEventListener( element, type.toLowerCase(), handler, capture );
                } );
            }
        );

        Public.once = Public.addOnceEventListener = XFunction(
            String, Optional( Boolean ), Function,
            function( type, capture, handler ){
                XList.forEach( this.elements, function( element ){
                    function _handler(){
                        handler.apply( this, arguments );
                        Env.removeEventListener( element, type, _handler, capture );
                    }

                    if( type in EventAliase ){
                        var _type = type;
                        type     = EventAliase[ _type ];
                        _handler = Dom[ _type ]( element, _handler, capture );
                        return;
                    }
                    type = type.toLowerCase();
                    Env.addEventListener( element, type, _handler, capture );
                } );
            }
        );

        Public.un = Public.removeEventListener = XFunction(
            String, Optional( Boolean ), Function, 
            function( type, capture, handler ){
                XList.forEach( this.elements, function( element ){
                    type = EventAliase[ type ] || type.toLowerCase();
                    Env.removeEventListener( element, type, handler, capture );
                } )
            }
        );

        Public.hover = XFunction( Function, Optional( Function ), function( enter, leave ){
            leave = leave || enter;
            XList.forEach( this.elements, function( element ){
                Dom.mouseEnter( element, enter );
                Dom.mouseLeave( element, leave );
            } );
        } );

        XList.forEach(
            [ "prepend", "append", "before", "after", "replaceWith" ],
            function( method ){

                Public[ method ] = XFunction( String, function( html ){
                    XList.forEach( this.elements, function( container ){
                        Dom[method]( container, Dom.create( html ) );
                    } );
                } );

                Public[ method ].define( Function, function( handler ){
                    var _this    = this;
                    XList.forEach( this.elements, function( container, index ){
                        var html = handler.apply( container, [ index, container.innerHTML ] );
                        Dom[method]( 
                            container, is( String, html ) ? Dom.create( html ) : html
                        )
                    } );
                } );

                Public[ method ].define( Object, function( elements ){
                    var 
                        df       = DOC.createDocumentFragment(),
                        elements = elements instanceof XDom ? elements.elements : elements
                    ;

                    XList.forEach( this.elements, function( container, index ){
                        elements = Dom[method]( container, elements );
                    } );
                } );
            }
        );
        
        Public.clone = function( tree ){
            var elements = [];
            XList.forEach( this.elements, function( element ){
                elements.push( element.cloneNode( tree ) );
            } );
            return new XDom( elements );
        };

        Public.empty = XFunction( Optional( Function ), function( filter ){
            XList.forEach( this.elements, function( element, index ){
                if( filter ? filter.call( element, index, element.innerHTML ) : true ){
                    Dom.removeChilds( element );
                }
            } );  
        } );

        Public.empty.define( Object, function( filter ){
            filter = is( String, filter ) ? Dom.query( filter ) : filter;
            filter = filter instanceof XDom ? filter.elements : filter;
            XList.forEach( this.elements, function( element, index ){
                if( filter instanceof Array ? XList.indexOf( filter, element ) !== -1 : element === filter ){
                    Dom.removeChilds( element );
                }
            } );
        } );

        Public.remove = XFunction( Optional( Function ), function( filter ){
            var elements = [];
            XList.forEach( this.elements, function( element, index ){
                if( filter ? filter.call( element, index, element.innerHTML ) : true ){
                    element.parentNode.removeChild( element );
                    element = null;
                }else{
                    elements.push( element );
                }
            } );
            this.elements = elements;
        } );

        Public.remove.define( Object, function( filter ){
            var 
                elements = [],
                filter   = is( String, filter ) ? Dom.query( filter ) : filter,
                filter   = filter instanceof XDom ? filter.elements : filter
            ;
            XList.forEach( this.elements, function( element ){
                if( filter instanceof Array ? XList.indexOf( filter, element ) !== -1 : element === filter ){
                    element.parentNode.removeChild( element );
                    element = null;
                }else{
                    elements.push( element );
                }
            } );
            this.elements = elements;
        } );

        Public.parent = XFunction( Optional( Function ), function( filter ){
            var parents = [];
            XList.forEach( this.elements, function( element, index ){
                if( !filter || filter.call( element, index, element.innerHTML ) ){
                    parents.push( element.parentNode );
                }
            } );
            return new XDom( parents );
        } );

        Public.parent.define( Object, function( filter ){
            var 
                parents = [],
                filter  = is( String, filter ) ? Dom.query( filter ) : filter,
                filter  = filter instanceof XDom ? filter.elements : filter
            ;
            XList.forEach( this.elements, function( element ){
                if( filter instanceof Array ? XList.indexOf( filter, element ) !== -1 : element === filter ){
                    parents.push( element.parentNode );
                }
            } );

            return new Dom( parents );
        } );

        Public.find = XFunction( String, function( selector ){
            var els = [];
            XList.forEach( this.elements, function( context ){
                els.push.apply( els, Dom.query( selector, context ) );
            } );
            return new XDom( XList.unique( els ) );
        } );

        Public.forEach = XFunction( Function, function( callback ){
            var 
                elements = this.elements.slice()
            ;   
            for( var index = 0, element = null; element = elements.shift(); index++ ){
                callback.call( element, index, element.innerHTML );
            }
        } );

        Public.slice = XFunction( Number, Optional( Number, Infinity ), function( start, end ){
            return new XDom( this.elements.slice( start, end ) );
        } );

        Public.unique = function(){
            return new XDom( XList.unique( this.elements ) );
        };

        Public.filter = XFunction( Function, function( callback ){
            var elements = [];
            XList.forEach( this.elements, function( element, index ){
                if( !callback.call( element, index, element.innerHTML ) ){
                    elements.push( element );
                }
            } );
            return new XDom( elements );
        } );


        Public.filter.define( Object, function( filter ){
            var 
                elements = [],
                filter   = is( String, filter ) ? Dom.query( filter ) : filter,
                filter   = filter instanceof XDom ? filter.elements : filter
            ;
            XList.forEach( this.elements, function( element ){
                if( filter instanceof Array ? XList.indexOf( filter, element ) === -1 : element !== filter ){
                    elements.push( element );
                }
            } );
            return new XDom( elements );
        } );


        Public.attr = XFunction( String, function( key ){
            var attrs = null;
            attrs = XList.map( this.elements, function( element ){
                return element.getAttribute( key );
            } );
            return attrs.length > 1 ? attrs : attrs[0];
        } );

        Public.attr.define( String, Function, function( key, callback ){
            XList.forEach( this.elements, function( element, index ){
                element.setAttribute(
                    key, callback.call( element, index, element.innerHTML )
                );
            } );
        } );

        Public.attr.define( String, Object, function( key, value ){
            XList.forEach( this.elements, function( element ){
                element.setAttribute( key, value );
            } );
        } );

        Public.removeAttr = function( key ){
            XList.forEach( this.elements, function( element ){
                element.removeAttribute( key );
            } );
        };

        Public.html = XFunction( function( html ){
            html = XList.map( this.elements, function( element ){
                return element.innerHTML;
            } );
            return html.length === 1 ? html[0] : html;
        } );

        Public.html.define( String, function( html ){
            html = XList.map( this.elements, function( element ){
                element.innerHTML = html;
                return element.innerHTML;
            } );
            return html.length === 1 ? html[0] : html;
        } );

        Public.value = XFunction( function(){
            var values = [];
            XList.forEach( this.elements, function( element ){
                values.push( element.value );
            } );
            return values.length === 1 ? values[0] : values;
        } );

        Public.value = XFunction( Function, function( handler ){
            var values = [];
            XList.forEach( this.elements, function( element, index ){
                values.push( handler.call( element, index, element.value, element.innerHTML ) );
            } );
            return values.length === 1 ? values[0] : values;
        } );

        
        Public.value = XFunction( Object, function( value ){
            XList.forEach( this.elements, function( element ){
                //values.push( element.value );
                element.value = value.toString();
            } );
            return value;
        } );        

        Public.css = XFunction( String, function( key ){
            var values = null;
            values = XList.map( this.elements, function( element ){
                return Dom.getStyle( element, key );
            } );
            return values.length === 1 ? values[0] : values;
        } );

        Public.css.define( Array, function( keys ){
            var values = null;
            values = XList.map( this.elements, function( element ){
                return Dom.getStyle.apply( Dom, [ element ].concat( keys ) );
            } );
            return values.length === 1 ? values[0] : values;
        } );
        
        Public.css.define( Cox.PlainObject, function( css ){
            XList.forEach( this.elements, function( element, index ){
                XObject.forEach( css, true, function( value, key ){
                    element.style[ key ] = !is( Function, value ) ? value : value.call( 
                        element, index, Dom.getStyle( element, key )
                    );
                } )
            } );
        } );     

        Public.css.define( String, Function, function( key, callback ){
            XList.forEach( this.elements, function( element, index ){
                element.style[ key ] = callback.call( 
                    element, index, Dom.getStyle( element, key ) 
                );
            } );
        } );

        Public.css.define( String, Object, function( key, value ){
            XList.forEach( this.elements, function( element ){
                element.style[ key ] = value.toString();
            } );
        } );

        Public.offset = function(){
            var pos = null;
            pos = XList.map( this.elements, function( element ){
                return Dom.getElementOffset( element );
            } );
            return pos.length === 1 ? pos[0] : pos;
        };

        Public.addClass = XFunction( Params( String ), function( classNames ){
            var elements = this.elements;
            for( var i = 0, l = elements.length; i < l; i++ ){
                for( var i2 = 0, l2 = classNames.length; i2 < l2; i2++ ){
                    Dom.addClass( elements[i], classNames[i2] );
                }
            }
        } );

        Public.addClass.define( Function, function( callback ){
            XList.forEach( this.elements, function( element, index ){
                Dom.addClass( element, callback.call( element, index, element.innerHTML ) );
            } )
        } );

        Public.removeClass = XFunction( Params( String ), function( classNames ){
            var elements = this.elements;
            for( var i = 0, l = elements.length; i < l; i++ ){
                for( var i2 = 0, l2 = classNames.length; i2 < l2; i2++ ){
                    Dom.removeClass( elements[i], classNames[i2] );
                }
            }
        } );

        Public.removeClass.define( Function, function( callback ){
            XList.forEach( this.elements, function( element, index ){
                Dom.removeClass( element, callback.call( element, index, element.innerHTML ) );
            } )
        } );


        Public.toggleClass = XFunction( String, function( className ){
            XList.forEach( this.elements, function( element ){
                Dom.toggleClass( element, className );
            } );
        } );

        Public.toggleClass.define( String, Boolean, function( className, toggle ){
            XList.forEach( this.elements, function( element ){
                Dom.toggleClass( element, className, toggle );
            } );
        } );

        Public.toggleClass.define( String, Function, function( className, toggle ){
            XList.forEach( this.elements, function( element, index ){
                Dom.toggleClass( element, className, toggle.call( element, index, element.innerHTML ) );
            } );
        } );

        Public.replaceClass = XFunction( 
            String, String, function( oldClass, newClass ){
                XList.forEach( this.elements, function( element ){
                    Dom.replaceClass( element, oldClass, newClass );
                } );
            }
        );

        Public.show = XFunction( 
            Optional( Number ), Optional( Function ),
            function( duration, callback ){
                var els = null;
                if( Dom.onFx === false || ( duration === 0 && !callback ) ){
                    this.css( {
                        "opacity" : function( index, value ){
                            return +value || 1;
                        },
                        "display" : function( index, value ){
                            return RE_INLINE_ELEMENT.test( this.tagName ) ? "inline" : "block";
                        }
                    } );

                    callback && this.forEach( callback );
                    return;
                }

                els = this.filter( function(){
                    return RE_DISPLAY.test( Dom.getStyle( this, "display" ) ) 
                        && Dom.getStyle( this, "opacity" ) === "1"
                    ;
                } );
                if( els.elements.length === 0 ){
                    callback && callback();
                    return;
                }
                els.css( {
                    "opacity" : 0,
                    "display" : function(){
                        return RE_INLINE_ELEMENT.test( this.tagName ) ? "inline" : "block";
                    }
                } );
                els.anima( 
                    duration,
                    { 
                        opacity : 1
                    },
                    callback || EMPTY_FUNCTION
                ); 
            }   
        );
    
        Public.hide = XFunction( 
            Optional( Number ), Optional( Function ),
            function( duration, callback ){                
                
                if( Dom.onFx === false || ( duration === 0 && !callback )  ){
                    this.css( "display", "none" );
                    callback && this.forEach( callback );
                    return;
                }

                this.anima( 
                    duration,
                    { opacity : 0 },
                    function(){
                        this.style.display = "none";
                        callback && callback.call( this );
                    } 
                )
            }
        );
    
        Public.anima = XFunction( 
            Optional( Number, 400 ), Cox.PlainObject, Optional( Function ), Optional( Function, ANIMA_DEFAULT_TRANSITION ),
            function( duration, option, callback, transition ){
                var 
                    clipInfos = []
                ;
                if( this._anima_task && this._anima_task.anima ){
                    this._anima_task.anima.exit();
                }

                duration = ~~duration || 400;

                XList.forEach( this.elements, function( element, index ){
                    var options = [];

                    XObject.forEach( option, true, function( value, key ){
                        options.push( {
                            key        : key,
                            from       : parseFloat( Dom.getStyle( element, key ) ),
                            to         : parseFloat( value ),
                            transition : transition
                        } );
                    } );

                    if( options.length === 0 ){
                        return false;
                    }

                    clipInfos.push( {
                        element : element,
                        options : options
                    } );
                } );

                if( clipInfos.length === 0 ){
                    return;
                }

                this._anima_task = {
                    clipInfos : clipInfos,
                    duration  : duration,
                    callback  : callback
                };

                animaCenter.push( this._anima_task );

                return this._anima_task.anima;
            } 
        );
        
        Public.anima.define( function(){
            return this._anima_task && this._anima_task.anima;
        } );

    
        Public.loaded = function(){
            var 
                handlers  = {},
                OK_STATE  = {
                    "loaded"   : true,
                    "complete" : true
                }
            ;
            //handlers[ 0 ]
            handlers[ "#document" ] = function( doc, handler ){
                if( doc === Cox.ownDocument ){
                    Use( Modules( module.id ), function(){
                        handler.call( doc );
                    } );
                }else{
                    var load = false;
                    function _handler(){
                        if( load ){
                            return;
                        }
                        if( doc.readyState && !( doc.readyState in OK_STATE ) ){
                            return;
                        }
                        handler.apply( this, arguments );
                        Env.removeEventListener( doc, "DOMContentLoaded", _handler );
                        Env.removeEventListener( doc, "readystatechange", _handler );
                        load = true;
                    }
                    Env.addEventListener( doc, "DOMContentLoaded", _handler, false );
                    Env.addEventListener( doc, "readystatechange", _handler );
                }
            };

            handlers[ "SCRIPT" ] = function( el, handler ){
                var load = false;
                function _handler(){
                    if( load ){
                        return;
                    }
                    if( el.readyState && !( el.readyState in OK_STATE ) ){
                        return;
                    }
                    Env.removeEventListener( el, "load", _handler, false );
                    Env.removeEventListener( el, "readystatechange", _handler );
                    load = true;
                    handler.apply( this, arguments );
                }
                Env.addEventListener( el, "load", _handler, false );
                Env.addEventListener( el, "readystatechange", _handler );
            };

            handlers[ "IMG" ] = function( el, handler ){
                Env.addEventListener( el, "load", function(){
                    handler.apply( this, arguments );
                    Env.removeEventListener( el, "load", arguments.callee );
                } );
            };

            return XFunction( Function, function( handler ){
                XList.forEach( this.elements, function( element ){
                    //console.log( element.nodeName );
                    handlers[ element.nodeName ]( element, handler );
                } );
            } ) 
        }();

    } );    


    Dom = XFunction( String, Optional( Object, DOC ), function( selector, context ){
        var 
            elements = [],
            context  = context instanceof XDom ? context.elements : context,
            context  = is( String, context ) ? Dom.query( context ) : context
        ;
        if( context instanceof Array ){
            XList.forEach( context, function( context ){
                elements = elements.concat( Dom.query( selector, context ) );
            } );
        }else{
            elements = Dom.query( selector, context );
        }
        return new XDom( elements );
    } );
    
    Dom.define( Params( Object ), function( elements ){
        return new XDom( 
            XList.reduce( elements, function( elements, els ){
                els = els instanceof XDom ? els.get() : els;
                els = is( Number, els.length ) ? els : [ els ];
                return elements.concat.apply( elements, els );
            }, [] )
        );
    } );

    Dom.query = function(){

        function getById( id, context ){
            context = context.getElementById instanceof Function ? context : DOC;
            return context.getElementById( id );
        };

        //因为 未考虑对IE9以下的浏览器作兼容所以 实现比较简单.hoho
        return function query( selector, context ){
            var 
                sleector  = XString.trim( selector ),
                oselector = selector,
                context   = context || DOC,
                selectors = selector.split( RE_MULTI_SELECTOR ),
                elements  = []
            ;
            while( selector = selectors.shift() ){
                var result = [];
                
                selector = XString.trim( selector );

                if( RE_SIMPLE_SELECTOR.test( selector ) ){
                    var result = [];

                    if( RE_ID_SELECTOR.test( selector ) ){
                        result = [ getById( selector.slice(1), context ) ];
                    }else if( RE_CLASS_SELECTOR.test( selector ) ){
                        result = context.getElementsByClassName( selector.slice(1) );
                    }else if( RE_TAG_SELECTOR.test( selector ) ){
                        result = context.getElementsByTagName( selector );
                    }
                }

                if( result.length === 0 ){
                    try{
                        result = context.querySelectorAll( selector );
                    }catch( e ){
                        result = [];
                    }
                }

                elements.push.apply( elements, result );
            }

            return elements;
        };
    }();

    Dom.create = XFunction( String, function( html ){
        var 
            container = null,
            elements  = null
        ;
        if( RE_TAG.test( html ) ){
            return DOC.createElement( html );
        }

        container = DOC.createElement( "DIV" );
        container.innerHTML = html;
        elements = container.childNodes;
        if( elements.length > 1 ){
            var 
                els  = [],
                el   = null
            ;
            while( el = elements[0] ){
                els.push( el );
                container.removeChild( el );
            };
            return els;
        }
        return elements[0];
    } );

    XList.forEach( [ "mouseEnter", "mouseLeave" ], function( type ){
        Dom[ type ] = [
            function( target, handler, capture ){
                function fix( event ){
                    var 
                        ctarget = event.currentTarget,
                        rtarget = event.relatedTarget
                    ;
                    if( !Dom.containersElement( ctarget, rtarget ) 
                     && ctarget !== rtarget
                    ){
                        handler.call( ctarget, event );
                    }
                }
                target.addEventListener( EventAliase[ type ], fix, !!capture );
                return fix;
            },
            function( target, handler ){
                function fix( event ){
                    handler.call( target, event );
                }
                target.attachEvent( "on" + type.toLowerCase(), fix );
                return fix;
            }
        ][ ~~( Env.name === "ie" ) ];
    } );

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

    Dom.prepend = function( container, elements ){
        var after = container.firstChild;
        if( elements instanceof Array ){
            for( var i = 0, l = elements.length; i < l; i++ ){
                if( after ){
                    container.insertBefore( elements[i], after );
                }else{
                    container.appendChild( elements[i] );
                }
            }
            container.insertBefore( df, container.firstChild );
        }else{
            if( after ){
                container.insertBefore( elements, container.firstChild );
            }else{
                container.appendChild( elements );
            }
        }

        return elements;
    };

    Dom.append = function( container, elements ){
        if( elements instanceof Array ){
            for( var i = 0, l = elements.length; i < l; i++ ){
                container.appendChild( elements[i] );
            }
        }else{
            container.appendChild( elements );
        }
        return elements;
    };

    Dom.before = function( container, elements ){
        var 
            parent   = container.parentNode,
            element  = elements
        ;
        
        if( elements instanceof Array ){
            for( var i = 0, l = elements.length; i < l; i++ ){
                parent.insertBefore( elements[i], container );
            }
        }else{
            parent.insertBefore( element, container );
        }
        
        parent.insertBefore( element, container );
        return elements;
    };

    Dom.after = function( container, elements ){
        var 
            parent   = container.parentNode,
            element  = elements
        ;
        
        if( elements instanceof Array ){
            for( var i = 0, l = elements.length; i < l; i++ ){
                if( parent.lastChild === container ){
                    parent.appendChild( elements[i] );
                }else{
                    parent.insertBefore( elements[i], container.nextSibling );
                }
                container = elements[i];
            }
        }else{
            if( parent.lastChild === container ){
                parent.appendChild( elements );
            }else{
                parent.insertBefore( elements, container.nextSibling );
            }    
        }

        
        return elements;
    };

    Dom.replaceWith = function( oldElement, newElement ){
        var 
            parent   = oldElement.parentNode
        ;

        if( newElement instanceof Array ){
            for( var i = 0, l = newElement.length; i < l; i++ ){
                parent.insertBefore( newElement[i], oldElement );
            }
        }else{
            parent.insertBefore( newElement, oldElement );            
        }
        
        parent.removeChild( oldElement );
        return newElement;
    };
    
    Dom.clone = function( element, tree ){
        return element.cloneNode( !!tree );
    };

    Dom.removeChilds = function( container ){
        var elements = container.childNodes;
        while( elements[0] ){
            container.removeChild( elements[0] );
        }
    };

    Dom.remove = function( element ){
        element.parentNode.remove( element );
        element = null;
    };

    Dom.parents = XFunction( Object, Optional( Number, Infinity ), function( child, level ){
        var 
            parents = [],
            level   = level === Infinity ? level : Math.abs( ~~level )
        ;

        while( ( child = child.parentNode ) && ( level === Infinity || level-- ) ){
            parents.unshift( child );
        }
        return parents;
    } );


    Dom.getElementOffset = function( element ){
        var 
            pos    = {},
            box    = null
        ;
        if( element.parentNode === null || element.style.display === "none" ){
            return null;
        }

        if( element.getBoundingClientRect ){
            box = element.getBoundingClientRect();
            return {
                x : box.left + Math.max( DOC_ROOT.scrollLeft, BODY.scrollLeft ),
                y : box.top + Math.max( DOC_ROOT.scrollTop, BODY.scrollTop )
            }
        }else if( DOC.getBoxObjectFor ){
            box   = DOC.getBoxObjectFor( element );
            pos.x = box.x + ( element.style.borderLeftWidth ? parseInt( element.style.borderLeftWidth ) : 0 );
            pos.y = box.x + ( element.style.borderTopWidth ? parseInt( element.style.borderTopWidth ) : 0 );
        }else{
            var parent = null;
            pos.x = element.offsetLeft;
            pos.y = element.offsetTop;
            if( element.offsetParent !== element ){
                parent = element;
                while( parent = parent.offsetParent ){
                    pos.x += parent.offsetLeft;
                    pos.y += parent.offsetTop;
                }
            }
            if( Env.name === "opera" || Env.name === "safari" 
             && element.style.position === "absolute" 
            ){
                pos.x -= BODY.offsetLeft;
                pos.y -= BODY.offsetTop
            }

            parent = element;

            while( parent = parent.parentNode
                && parent.tagNmae !== "BODY" 
                && parent.tagNmae !== "HTML"
            ){
                pos.x -= parent.scrollLeft;
                pos.y -= parent.scrollTop;

            }

            return pos;
        }
    };  


    Dom.addStyleSheet = XFunction( String, function( cssText ){
        if (document.createStyleSheet)
            document.createStyleSheet().cssText = cssText;
        else {
            var style         = document.createElement('style');
            style.type        = 'text/css';
            style.textContent = cssText;
            DOC_ROOT.firstChild.insertBefore( style, null );
        }
    } );

    Dom.once       = Dom.addOnceEventListener = function( target, type, handler, capture ){
        Env.addEventListener( target, type, function(){
            Env.removeEventListener( target, type, arguments.callee, capture );
            handler.apply( this, arguments );
        }, capture );  
    };

    Dom.on          = Dom.addEventListener    = Env.addEventListener;
    Dom.un          = Dom.removeEventListener = Env.removeEventListener;

    void function(){
        var 
            DURATION  = 600,
            anima     = new Animation( Animation.Transition.Quint.easeInOut ),
            proxy  = new Cox.EventSource,
            revent = null,
            sevent = null,
            timer1 = null,
            timer2 = null,
            S      = null
        ;

        /*BODY.scrollTop++;
        if( BODY.scrollTop !== 0 ){
            container = BODY;
            BODY.scrollTop--;
        }else{
            container = DOC_ROOT;
        }

        */

        S = XFunction( function(){
            return {
                left   : BODY.scrollLeft   || DOC_ROOT.scrollLeft, 
                top    : BODY.scrollTop    || DOC_ROOT.scrollTop,
                width  : BODY.scrollWidth  || DOC_ROOT.scrollWidth,
                height : BODY.scrollHeight || DOC_ROOT.scrollHeight
            }
        } );

        S.define( Number, Number, function( left, top ){
            DOC_ROOT.scrollLeft = BODY.scrollLeft = left;
            DOC_ROOT.scrollTop  = BODY.scrollTop  = top;
            return S();
        } );

        proxy.dispatchEvent( 
            revent = new Cox.Event( "resize" ),
            sevent = new Cox.Event( "scroll" )
        );

        Dom.on( window, "resize", function( event ){
            //if( timer1 ){
            //    clearTimeout( timer1 );
            //}
            //timer1 = setTimeout( function(){
                event.clientWidth  = DOC_ROOT.clientWidth;
                event.clientHeight = DOC_ROOT.clientHeight;
                proxy.fireEvent( "resize", [ event ], window );
            //}, 100 );
        } );
        
        Dom.on( window, "scroll", function( event ){
            //if( timer2 ){
            //    clearTimeout( timer2 );
            //}
            //timer2 = setTimeout( function(){
                var scroll = S();
                event.scrollTop    = scroll.top;
                event.scrollLeft   = scroll.left;
                event.scrollWidth  = scroll.width;
                event.scrollHeight = scroll.height;
                proxy.fireEvent( "scroll", [ event ], window );
            //}, 100 );
        } );

        Dom.resize = XFunction( Function, function( handler ){
            proxy.on( "resize", handler );
            revent.clientWidth  = DOC_ROOT.clientWidth;
            revent.clientHeight = DOC_ROOT.clientHeight;
            proxy.fireEvent( "resize", [ revent ], window );
        } );


        Dom.scroll = XFunction( Function, function( handler ){
            var scroll = S();
            proxy.on( "scroll", handler );
            sevent.scrollTop    = scroll.top;
            sevent.scrollLeft   = scroll.left;
            sevent.scrollWidth  = scroll.width;
            sevent.scrollHeight = scroll.height;
            proxy.fireEvent( "scroll", [ sevent ], window );
        } );

        
        Dom.EventProxy = proxy;

        Dom.scrollTo = XFunction( Optional( Number ), Number, Number, Optional( Function ), function( duration, left, top, callback ){
            var scroll = S();
            left = Math.min( scroll.width, left );
            top  = Math.min( scroll.height, top );
            //console.log( left, top );
            //console.log( container );
            anima.addClip( 
                duration || DURATION,
                [
                    { key : "scrollTop", from : scroll.top, to : top },
                    { key : "scrollLeft", from : scroll.left, to : left }
                ], 
                function( pos ){
                    S( pos.scrollLeft, pos.scrollTop )
                } 
            );

            anima.once( "done", function(){
                anima.removeAllClip();
                anima.un( "done" );
                callback && callback( left, top );
            } );
            anima.play();
        } );

        Dom.intersectRect = XFunction( Cox.PlainObject, Cox.PlainObject, function( rect1, rect2 ){
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
        } );

        Dom.intersectRect.define( Object, Object, function( rect1, rect2 ){
            var 
                rect1 = rect1 instanceof XDom ? rect1.get(0) : rect1,
                rect2 = rect2 instanceof XDom ? rect2.get(0) : rect2,
                pos1  = Dom.getElementOffset( rect1 ),
                pos2  = Dom.getElementOffset( rect2 ) 
            ;
            return Dom.intersectRect(
                {
                    left   : pos1.x,
                    top    : pos1.y,
                    width  : parseInt( Dom.getStyle( rect1, "width" ) ),
                    height : parseInt( Dom.getStyle( rect1, "height" ) )
                },
                {
                    left   : pos2.x,
                    top    : pos2.y,
                    width  : parseInt( Dom.getStyle( rect2, "width" ) ),
                    height : parseInt( Dom.getStyle( rect2, "height" ) )
                }
            );
        } );

        Dom.visibility = XFunction( Object, Optional( Object, DOC_ROOT ), function( element, container ){
            var
                element   = element instanceof XDom ? element.get(0) : element,
                container = container instanceof XDom ? container.get(0) : container,
                pos1      = Dom.getElementOffset( element ),
                pos2      = Dom.getElementOffset( container ),
                scroll    = {
                    left : container.scrollLeft,
                    top  : container.scrollTop
                }
            ;   
            
            if( container === BODY || container === DOC_ROOT ){
                scroll = S();
                if( Env.name === "ie" ){
                    pos2.x -= scroll.left;
                    pos2.y -= scroll.top;
                }
            }
            if( Dom.getStyle( element, "display" ) === "none" 
             || Dom.getStyle( element, "visibility" ) === "hidden"
             || Dom.getStyle( element, "opacity" ) === "0"
             || Dom.getStyle( container, "display" ) === "none"
             || Dom.getStyle( container, "visibility" ) === "hidden"
             || Dom.getStyle( container, "opacity" ) === "0"
            ){
                return false;
            }

            return Dom.intersectRect(
                {
                    left   : pos1.x - pos2.x,
                    top    : pos1.y - pos2.y,
                    width  : parseInt( Dom.getStyle( element, "width" ) ),
                    height : parseInt( Dom.getStyle( element, "height" ) )
                },
                {
                    left   : scroll.left,
                    top    : scroll.top,
                    width  : container.clientWidth,
                    height : container.clientHeight || ~~( container === BODY && DOC_ROOT.clientHeight ) 
                }
            );

        } );

    }();


    Dom.stopEventBubble = function( event ){
        if( event && event.stopPropagation ){
            event.stopPropagation()
        }else{
            window.event.cancelBubble = true;
        }
    }

    Dom.stopEventDefault = function( event ){
        if( event && event.preventDefault ){
            event.preventDefault();
        }else{
            window.event.returnValue = false;
        }
    }

    Dom.XDom        = XDom;
    Dom.onFx        = true;
    Dom.animaCenter = animaCenter;

    module.exports  = Dom;

    //Dom.
} );
