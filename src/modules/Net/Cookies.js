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
 * 实现参考相关资料
 * http://www.cnblogs.com/Darren_code/archive/2011/11/24/Cookie.html
 */

Define( "Cookies", function( require, Cookies ){
    var
        RE_SEPARATE   = "; ",
        cache         = {},
        originCookies = ""
    ;

    function parse( cookie ){
        cache = {};
        XList.forEach( cookie.split( RE_SEPARATE ), function( cookie ){
            cookie = cookie.split( "=" );
            cache[ cookie[0] ] = unescape( cookie[1] );
        } );
        originCookies = document.cookie;
        return cache;
    }

    Cookies.get = function( key ){
        if( document.cookie !== originCookies ){
            parse( document.cookie );
        }
        return cache[ key ];
    };

    function updateCookie( key, value, expires, path, domain ){
        if( expires instanceof Date ){
            expires = expires.toGMTString();
        }else if( +expires && is( Number, +expires ) ){
            var date = new Date;
            date.setTime( +expires );
            expires = date.toGMTString();
        }else{
            expires = 0;
        }
        document.cookie  = key + "=" + escape( value.toString() ) + 
                           "; path=" + path + 
                           "; domain=" + domain +
                           "; expires=" + expires
        ;
        
        parse( document.cookie );
    }

    Cookies.set = XFunction(
        String, Object, Optional( Number ), Optional( String ), Optional( String ),
        updateCookie
    );

    Cookies.set.define(
        String, Object, Date, Optional( String ), Optional( String ),
        function( key, value, expires, path, domain ){
            updateCookie(
                key, 
                value,
                expires,
                path,
                domain
            );
        }
    );
    

    Cookies.set.define(
        String, Object, Cox.PlainObject,
        function( key, value, options ){
            updateCookie( 
                key, 
                value, 
                options.expires,
                options.path,
                options.domain || "" 
            );
        }
    );

    Cookies.remove = XFunction( 
        String, Optional( String ), Optional( String ), 
        function( key, path, domain ){
            updateCookie( key, "", new Date - 1, path, domain );
        }
    );

} ); 