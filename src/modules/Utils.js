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


Define( "Utils", function( require, Utils ){
    Utils.dateFormat = ( function(){
        var 
            formats = {
                "Y"  : function( date ){ return date.getFullYear(); },
                "y"  : function( date ){ return date.getFullYear().toString().slice( -2 ); },
                "M"  : function( date ){ return ( "0" + ( date.getMonth() + 1 ) ).slice( -2 ); },
                "m"  : function( date ){ return date.getMonth() + 1; },
                "D"  : function( date ){ return ( "0" + date.getDate() ).slice( -2 ); },
                "d"  : function( date ){ return date.getDate(); },
                "H"  : function( date ){ return ( "0" + date.getHours() ).slice( -2 ); },
                "h"  : function( date ){ return date.getHours(); },
                "I"  : function( date ){ return ( "0" + date.getMinutes() ).slice( -2 ); },
                "i"  : function( date ){ return date.getMinutes(); },
                "S"  : function( date ){ return ( "0" + date.getSeconds() ).slice( -2 ); },
                "s"  : function( date ){ return date.getSeconds(); },
                "MM" : function( date ){ return ( "00" + date.getMilliseconds() ).slice( -3 ); },
                "mm" : function( date ){ return date.getMilliseconds() }
            },
            RE_FORMAT_SIGN = /\%[A-Za-z]+/g
        ;
        return function( date, format ){
            RE_FORMAT_SIGN.lastIndex = 0;
            data = is( String, date ) ? new Date( date ) : date;
            return format.replace( RE_FORMAT_SIGN, function( sign ){
                if( sign.slice( 1 ) in formats ){
                    return formats[ sign.slice( 1 ) ]( date );
                }else{
                    return sign;
                }
            } );
        };
    } )();

    Utils.UID = function(){
        var uid = new Date().getTime();
        return function( prefix ){
            return ( prefix || "" ) + uid++;
        }
    }();

} );