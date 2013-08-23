

var x = require("./a"); 
console.log( "b module" );
console.log( x.n ); 
exports.x = x;
console.log( x );


