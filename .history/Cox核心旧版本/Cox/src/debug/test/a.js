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


Define( "a", Modules( "./b" ), function( require, exports, module ){
    exports.name = "a";
    console.log( "a", require( "b" ).name );
} );
