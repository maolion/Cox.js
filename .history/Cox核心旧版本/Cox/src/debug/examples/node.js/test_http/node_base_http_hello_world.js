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
var 
    ip = "127.0.0.1",
    port = "11111",
    http = require( "http" ),
    server = http.createServer( function( req, res ){
        res.writeHead( 200, { "Content-Type" : "text/plain" } );

        res.end( "Hello,World" );

    } )
;
server.listen( port, ip );
console.log( "Server runing at http://" + ip + ":" + port );