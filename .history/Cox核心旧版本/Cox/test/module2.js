/**
 * < module2.js >
 * @DATE   2012/11/29
 * @author maolion.j@gmail.com
 * 
 */
Define( "module2", function( require, exports, module2 ){
    console.log( "invoke module2" );
    exports.print = function( str ){
        console.log( "Hello, " + str );
    }
});