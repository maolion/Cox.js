#Cox.js JavaScript Framework

----------------------------------------------------------------------------
Cox.js 它是在标准原生 JavaScript 基础之上对 JavaScript 使用的扩展
 
###License (授权许可)

(The MIT License)

Copyright (c) 2012-2013, Cox, 江宜玮 <maolion.j@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining  
a copy of this software and associated documentation files (the  
'Software'), to deal in the Software without restriction, including  
without limitation the rights to use, copy, modify, merge, publish,  
distribute, sublicense, and/or sell copies of the Software, and to  
permit persons to whom the Software is furnished to do so, subject to  
the following conditions:  

The above copyright notice and this permission notice shall be  
included in all copies or substantial portions of the Software.  

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,  
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF  
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,  
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE  
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  

----------------------------------------------------------------------------

###Cox.js 使用帮助

    //使用git拷贝副本到本地
    git clone https://github.com/maolion/Cox.js.git
    git clone http://git.oschina.net/Joye/cox-js.git

    //在浏览器环境加载Cox.js
    <script src="Cox.js"></script>

    //在Node.js环境加载Cox.js
    var Cox = require( "Cox.js" );

#####高级函数

高级函数支持参数类型的定义，支持可选参数和可变参数，同时也支持重载

    //XFunction
    var F1 = XFunction( function(){
        //..
    } );

    F1.define( String, function( s1 ){
        //....
    } );

    F1.define( 
        String, Optional( String ), Boolean, Optional( Number ), Params( Object ),
        function( a1, a2, a3, a4, a5 ){
            //...
        }
    );

    F1();
    F1( "Hello" );
    F1( "A", "B", true, 1, [], {}, 0, true, "abc" );
    F1( "A", true, {}, 0, "cba" );

#####面向对象工具
    
    var I1 = Interface( "I1", function( Static, Public ){
        //...
    } );

    var I2 = Interface( "I2", function( Static, Public ){
        Static.m1 = Function;
        //类似声明函数签名
        Public.constructor = [
            ParamTypeTable(),
            ParamTypeTable( String ),
            ParamTypeTable( Params( Object ) )
        ];
        Public.m1 = ParamTypeTable( String );
    } );

    var I3 = Interface( "I3", Extends( I1, I2 ), function( Static, Public ){
        //...
    } );

    var C1 = Class( "C1", Abstract, function( Static, Public ){
        Static.m1 = function(){
            console.log( "(C1).m1" );
        };
        Public.m1 = Function;
    } );

    var C2 = Class( "C2", Extends( C1 ), Implements( I1 ), function( Static, Public ){
        Public.constructor = XFunction( function(){
            console.log( "(C2).constructor()" );
        } );
        Public.constructor.define( String, function( v1 ){
            console.log( "(C2).constructor( \"" + v1 + "\" )" );
        } );
        Public.constructor.define( Params( Object ), function( objs ){
            console.log( "(C2).constructor( ["+ objs +"] )" );
        } );
        Public.m1 = function(){
            //...
        };
    } );

    var C3 = Class( Extends( C2 ), Implements( I1, I2, I3 ), function C3( Static, Public ){
        Public.constructor.define( function(){
            this.Super( "constructor" );
            console.log( "(C3).constructor()" );
        } );
        Public.constructor.define( String, function( v1 ){
            console.log( "(C3).constructor( \"" + v1 + "\" )" );
        } );
        Public.constructor.define( Params( Object ), function( objs ){
            console.log( "(C3).constructor( ["+ objs +"] )" );
        } );

        Public.m1 = XFunction( String, function( a1 ){
            this.Super( "m1" );
            console.log( "(C3).m1( \""+ a1 + "\" )" );
        } );

    } );

    console.log( is( C3, new C3 ) ); // true
    console.log( is( C3, new C3( "a" ) ) ); // true
    console.log( is( C3, new C3( "a", 1, true ) ) ); // true
    console.log( is( C2, new C3 ) );// true
    console.log( is( I1, new C3 ) );//true
    //...
    new C2();

    new C3().m1( "a" );

#####异步模块定义（管理）工具

    //main.js
    Use( Modules( "./A", "./C" ), function( require ){
        var 
            A = require( "A" ),
            C = require( "./C" )
        ;
        //...
    } );


    //A.js
    Define( "A", Depend( "./B", "./C" ), function( require, A ){
        var 
            B = require( "B" ),
            C = require( "C" )
        ;
        A.xx = "...";
        //...
    } );

    //B.js
    Define( "B", Depend( "./A", "./C" ), function( require, B ){
        //...
    } );

    //C.js
    //....

#####事件&异步编程工具
    
    //事件工具
    var o1 = new Cox.EventSource();
    o1.dispatchEvent(
        new Cox.Event( "e1" ),
        new Cox.Event( "e2" )
    );  

    o1.on( "e1", function(){
        //...
    } );

    o1.once( "e1", function( a1, a2 ){
        //...
    } );

    o1.fireEvent( "e1", [1, 2] );
    o1.fireEvent( "e1" );
    o1.fireEvent( "e1", o1 );
    o1.un( "e1" );
    //...


    //异步编写工具

    var d1 = new Deferred();

    d1.then( 
        function(){
            //....
        },
        function(){
            //....
        }
    );
    d1.then(
        function( v, err, end ){
            //err( "还可这样发出错误信息，转执行失败的回调函数,hoho...." );
            console.log( "下面哥好累" );
            end();
        }
    );
    d1.then(
        function(){
            console.log( "被忽略" );
        }
    );
    d1.resolved();

    var 
        d1 = new Deferred(),
        d2 = new Deferred(),
        d3 = new Deferred(),
        ds = new DeferredList( d1, d2, d3 )
    ;
    ds.done( function(){
        console.log( "ds.done" );
    } );
    ds.then( function(){
        console.log( "ds.ok" )
    } );

    setTimeout( function(){
        d1.resolved();
        setTimeout( function(){
            d2.resolved();
            setTimeout( function(){
                d3.resolved();
            }, 0 );
        }, 500 )
    }, 1000 );

*以上仅简单列出框架主要的接口工具的使用方式，暂未提供完整的API，详细内容请查看框架源代码*

----------------------------------------------------------------------------

###Cox.js 版本日志
####1.2.0
-   修复核心接口中被发现的新BUG

####1.1.0
-   加入了依赖jQuery框架的一些工具模块
-   Cox.js核心模块已兼容IE6+

####1.0.0 <span style="color:blue; font-size:0.5em" >*正式版*</span>
-   优化早期版本中实现的大部分功能模块

####0.\*.\* <span style="color:red; font-size:0.5em" >*测式版*</span>
-   为框架基础模块实现了 单元测试工具，函数重载机制，面向对象机制，异步模块
    定义（管理）工具
    ...

---------------------------------------------------------------------------- 

-   Date 2013/4/27
-   Version 1.0.0 
-   Author 江宜玮 <maolion.j@gmail.com>
-   Cox.js 技术支持 QQ群：259351004
