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

Define( "Path", Depend( "~/Cox/Env" ), function( require, Path, module ){
    var
        RE_DIR_NAME  = /^[\\\/](?=[^\\\/]*$)|.*(?=[\\\/])/,
        RE_BASE_NAME = /(?!.*[\\\/])?[^\\\/]*[\\\/]?$/,
        RE_PATH_ROOT = /^[\\\/]|^[A-Za-z]:|^\w+:\/{2,3}[^\/]*(?::\d+)?/,
        RE_URL_SIGN  = /^(?:https?|file):\/{2,3}/i,
        RE_EXT_NAME  = /\.[^.\\\/]*$|$/,
        RE_SEP       = /[\\\/]/

    ;

    Path.SEP = require( "Env" ).platform.match( /^win/ ) ? "\\" : "/";

    Path.dirname = function( path ){
        var match = path.match( RE_DIR_NAME );
        return match && match[0] || ".";
    };

    Path.basename = function( path ){
        return path.match( RE_BASE_NAME )[0];
    };

    Path.normalize = function( path ){
        var 
            root = path.match( RE_PATH_ROOT ),
            sep  = root && RE_URL_SIGN.test( path ) ? "/" : Path.SEP,
            path = ( root ? path.slice( root[0].length ) : path ).split( RE_SEP ),
            last = -1,
            n    = 0
        ;
        forEach( path, function( item, index ){
            switch( item ){
                case "":
                case ".":
                break;
                case "..":
                    if( !root && last < 0 ){
                        path[ n++ ] = item;
                    }else{
                        last--;
                        n > 0 && n--;
                    }
                break;
                default:
                    path[ ( last = n++ ) ] = item;
                break;
            }
        } );
        if( root ){
            root = root[ 0 ];
            root = "\\/".indexOf( root ) !== -1 ? "" : root;
            path.unshift( root );
            n++;
        }
        path.length = n;
        return path.join( sep ) || ".";
    };

    Path.join = function( paths ){
        return Path.normalize( Array.prototype.join.call( arguments, Path.SEP ) );
    };

    Path.extname = function( path ){
        return path.match( RE_EXT_NAME )[0];
    };

} );
