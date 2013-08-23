/**
 * < ${FILE} >
 * @DATE   ${MDATE}
 * @author ${author}
 * 
 */
console.log( "#module1#" );
Define( "module1",function( require, mpub, mpri ){
    console.log( "invoke module1 define" );
} );


/*
1.根模块的定义
    一个模块的定义（调用Module函数）不是由Module函数触发, 它就是根模块。

2.远程模块
    一个模块的定义（调用Module函数)的调用由Module函数触发从服务器上加载的模块， 它就是远程模块。

3.本地模块
    一个模块的定义（调用Module函数)的调用不是由Module函数触发， 它就是本地模块。

4.模块ID
    一个模块的定义（调用Module函数)的调用由Module函数触发从服务器上加载的模块，它的ID必须要和他的文件名相同，如果没有给定ID值。就使用他的文件路径

    一个模块的定义（调用Module函数)的调用不是由Module函数触， 他的ID没有任何限制，可有可无

5.依赖模块路径 
    当前文档节点中 查找 根节点是否是通过 script标签来加载的。如果是 就获取加载路径，那么依赖模块路径 的根目录就是从根模块文件所在目录。

    如果未找到。就从当前的文档 URL来解析出依赖模块的根目录

    依赖模块值中可以使用路径标识符(${...})
*/







