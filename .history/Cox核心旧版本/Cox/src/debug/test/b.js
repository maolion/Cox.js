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

//var a = require( "a" );
//console.log( require.resolve( "a" ) );

//console.dir( require );
Define( "b", Modules( "./a" ), function( require, exports, module ){
    exports.name = "b";
    console.log( "b", require( "a" ).name );
} );


