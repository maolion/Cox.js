/**
 * < ${FILE} >
 * @DATE   ${MDATE}
 * @author ${author}
 * 
 */

Module( "module2", Depend("module1"), function( require, Public ){
    console.log( "invoke module2 define" );
    Public.name = "module2";
    console.log( "module2 require module1", require("module1").name );
} );