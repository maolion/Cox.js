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

Define( "A", Depend( [ "./B", "./C" ] ), function( require, A ){
    console.log(require("B"));
    console.log(require("C"));
    A.name = "A";
} );