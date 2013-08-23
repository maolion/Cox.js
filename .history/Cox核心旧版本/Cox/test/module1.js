/**
 * < module1.js >
 * @DATE   2012/11/29
 * @author maolion.j@gmail.com
 * 
 */
 
Define( "module1" , Depend( "@module2", "module2" ), function( require, exports, module1 ){
    console.log( "invoke module1" );
    require("module2").print( "World" );
    exports.say = function(){
        console.log( "Hi! " + require( "@module2" ).name );
    }
});

Define( "module1.m1", function( require, exports, m1 ){
    console.log( "invoke module1.m1" );
});

Define( "module1.m2", function( require, exports, m2 ){
    console.log( "invoke module1.m2" );
});