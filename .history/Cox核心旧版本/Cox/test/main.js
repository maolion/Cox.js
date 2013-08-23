/**
 * < main.js >
 * @DATE   2012/11/29
 * @author maolion.j@gmail.com
 * 
 */


//
Define( "module2", Depend( "module1", "@module1.m1" ), function( require, exports ){
    console.log( "invoke @module2" );
    exports.name = "@module2";
    require("module1").say();
    require("module2").print("maolion");
} );

Use( a = Module( "module1.js", "@module1.m1", "@module1.m2", "@module2" ), function( require ){
    console.log( "invoke Main" );
    var b = require( "module1" );
    var x = require( "@module2" );
    var c = require( "@module1.m1" );
    var d = require( "@module1.m2" );
    var x = require( "module2" );

    x.print( "joye" );
    //console.log(x.name);
} );




