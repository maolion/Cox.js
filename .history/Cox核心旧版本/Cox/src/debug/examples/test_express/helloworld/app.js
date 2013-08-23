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


var express = require( "express" );
var app = express();
app.listen( 11111 );
app.use( express.logger() );
app.use( express.static( __dirname + "/public" ) );
app.use( function( req, res ){
    console.log( req.get( "user-agent" ) );
    res.send( "Hello" );
} );
console.log( "start express server." );