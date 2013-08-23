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

Define( "URI", Depend( "~/Cox/IO/Path" ), function( require, exports, module ){
    var
        RE_URI     = /^([^\?\#\s]*)(?:\?([^\#\s]*))?(?:\#([^\s]*))?$/,
        RE_WIN_SEP = /\\+/g,
        RE_DOT     = /^\.$/,
        Path       = require( "Path" ),
        URI        = null,
        Query      = null
    ;

    Query = Class( "Query", function( Static, Public ){

        Public.constructor = Overload(
            Optional( String, "" ), 
            function( params ){
                var 
                    _this   = this,
                    params  = params.split( "&" ),
                    _params = this._params = {}
                ;
                

                forEach( params, function( param ){
                    if( !param ) return;
                    param = param.split( "=" );
                    _params[ param[0] ] = decodeURI( param[1] );
                } );
            }
        );

        Public.constructor.define(
            Object,
            function( params ){
                var _params = this._params = {};
                forEach( params, function( value, key ){
                    _params[ key ] = decodeURI( value );
                } );
            }
        );

        Public.get = function( key ){
            return this._params[ key ];
        };

        Public.set = function( key, value ){
            if( value === null ){
                value = this.get( key );
                delete this._params[ key ];
            }else{
                this._params[ key ] = decodeURI( value );
            }

            return value;
        };

        Public.isEmpty = function(){
            return this.toString().length === 0;
        };

        Public.toString = function(){
            var params = [];

            forEach( this._params, function( value, key ){
                params.push( key + "=" + encodeURI( value ) );
            } );

            return params.join( "&" );
        };


    } );

    URI = Class( "URI", function( Static, Public ){

        Static.Query = Query;

        Public.constructor = function( uri ){
            var match     = uri.match( RE_URI );
            if( match ){
                this.path     = Path.dirname( match[1] );
                this.filename = Path.basename( match[1] );
                this.query    = new Query( match[2] || "" );
                this.anchor   = match[3] || "";
            }else{
                this.path     = "";
                this.filename = "";
                this.query    = new Query();
                this.anchor   = "";
            }
        };

        Public.toString = function(){
            var 
                query = this.query.toString()
            ;
            RE_WIN_SEP.lastIndex = 0;
            return Path.join( this.path, this.filename ).
                   replace( RE_WIN_SEP, "/" ).replace( RE_DOT, "" ) + 
                   ( query ? "?" + query : "" ) + 
                   ( this.anchor ? "#" + this.anchor : "" );
        };

    } );

    module.exports = URI;

} );
