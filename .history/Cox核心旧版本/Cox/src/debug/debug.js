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

require( "./Cox.base.js" );

new (
    Class( Single, function( Static, Public ){
        var 
            Fs      = require( "fs" ),
            Path    = require( "path" ),
            Spawn   = require( "child_process" ).spawn,
            root    = __dirname,
            runjs   = Path.join( root, "./Cox.base.js" ),
            app     = null,
            filters = [
                /(?:\/|\\)logs$/,
                /(?:\/|\\)public/,
                /(?:\/|\\)statics/,
                /(?:\/|\\)temples/,
                /\.*\.sublime-/,
                /index\.test\.js/,
                /(?:\/|\\)debug\.js/,
                /(?:\/|\\)ERROR\.log/,
                /app2\.js/
            ],
            watchconfig = {
                persistent : true, 
                interval   : 50
            },
            watchers = {}
        ;


        app = Class( Single, function( Static, Public ){
            var 
                child_process = null,
                appname       = Path.basename( runjs ),
                running       = false,
                STDOUT        = process.stdout;
                dataHandler   = function( data ){
                    if( data ){
                        STDOUT.write( data, "utf8" );
                    }
                },
                exitHandler = function( ){
                    console.log( "退出程序", appname );
                    running = false;
                }
            ;


            Static.run = function(){
                Static.exit();
                if( !running ){
                    running = true;
                    setTimeout( function(){
                        child_process = Spawn( "node", [ "--debug",  runjs ] ); 
                        child_process.stdout.on( "data", dataHandler );
                        child_process.stderr.on( "data", dataHandler );
                        child_process.on( "exit", exitHandler );
                        console.log( "已运行程序", appname, child_process.pid );
                    }, 500 );
                }
            }

            Static.exit = function(){
                if( child_process ){
                    try{
                        console.log( "退出程序", appname, child_process.pid );
                        process.kill( child_process.pid );
                    }catch( e ){
                        //....
                    }
                    child_process = null;
                    running = false;
                }
            };
            Public.run  = Static.run;
            Public.exit = Static.exit;
        } );

        function watch( path, isdir ){
            var 
                type = isdir ? "目录" : "文件",
                watcher = Fs.watchFile( 
                    path, 
                    watchconfig, 
                    function( cur, prev ){                        
                        if( cur.mtime.getTime() === 0 ){
                            Fs.unwatchFile( path );
                            delete watchers[ path ];
                            console.log( type, path, "被删除" );
                        }else{
                            console.log( type, path, "被改变" );
                            if( isdir ){
                                Fs.unwatchFile( path );
                                console.log( type, path, "重置监听" );
                                addWatch( path );
                            }
                        }

                        app.run();

                    } 
                );

            watchers = watcher;
        }

        function addWatch( root ){
            var 
                queue = [ root ],
                files = null
            ;
            while( root = queue.pop() ){
                files = Fs.readdirSync( root ).filter( function( name ){
                    var path = Path.join( root, name );
                    return !( path in watchers )  
                        && !filters.some( function( re ){
                                return re.test( path );
                            } );
                } ); 

                files.forEach( function( name ){
                    var
                        path = Path.join( root, name ),
                        stat = Fs.statSync( path )
                    ;

                    if( stat.isFile() ){
                        watch( path, false );
                    }else{
                        queue.push( path );
                    }

                } );
                //console.log( root );
                watch( root, true );
            }
        }

        Public.constructor = function(){
            addWatch( root );
            app.run();
        };


    } )
);
