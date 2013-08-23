/**
 * @DATE   2012/11/12
 * @author maolion.j@gmail.com
 * 函数重载
 */

var slice,
    EMPTY_FUNCTION,
    STRING_LENGTH_SROT_UP, 
    RE_FUNC_SIGN, RE_LINE_END_CHAR;
slice            = Array.prototype.slice;
EMPTY_FUNCTION   = function(){};

RE_FUNC_SIGN     =  /function\s*(\w+)*\s*(\([^\)]*\))/;
RE_LINE_END_CHAR = /\r\n|\n|\n\r/g;
STRING_LENGTH_SROT_UP = function( a, b ){
    return a.length > b.length;
}


if( !Object.create ){
    Object.create = (function(){
        function bridge(){};
        return function(proto){
            bridge.prototype = proto;
            return new bridge;
        }
    })();
}

function extend( dest, source, override ){
    dest = dest || {};
    override = !!override;
    for( var key in source ){
        if( override ){
            dest[key] = source[key];
        }else if( !dest.hasOwnProperty(key) ){
            dest[key] = source[key];
        }
    }
    return dest;
}

function is(object, type) {
    if ( object === null || object === undefined || !type ){
        return false;
    }

    return (
        ( typeof type === "function" && object instanceof type ) ||
        ( typeof type.__isInstance__ === "function" && type.__isInstance__( object ) ) ||
        ( typeof type === "function" && new object.constructor instanceof type )
    );
}

function isType(type) {
    return (
        typeof type == "function" ||
        typeof type == "object" && typeof type.__isInstance__ === "function"
    );
}

function isTypeMark(TypeMark) {
    return (
        typeof TypeMark == "object" &&
        !!TypeMark && typeof TypeMark.__TYPE__ == "function"
    );
}

function TypeMark( type ){
    var info;
    if( typeof type != "function" ){
        return false;
    }
    info = RE_FUNC_SIGN.exec( type.toString() );

    type.__NAME__ = info[1] || "";
    type.prototype.__TYPE__ = type;
    type.prototype.__NAME__ = type.__NAME__;
    
    info = info[1] || "TypeMark" + info[2];
    type.toString = function(){
        return info;
    }
    return type;
}
function getTypeName( type ){
    var name;
    if( !isType(type) && !isTypeMark(type) ){
        throw Error( "getTypeName( type ): 传递给 type参数的值只允许为类型引用." );
    }
    name = type.__NAME__ || type.constructor.__NAME__ || "";

    if( !name && typeof type === "function" ){
        name = type.name;
    }

    return name;
}
var Params = TypeMark(function Params( type ){
    var obj;
    if( !isType(type) ){
        throw Error( "Params( type ): 传递给 type参数的值只允许为类型引用." );
    }
    obj = Object.create( Params.prototype );
    obj.type = type;
    return obj;
});
Params.prototype.equals = function( obj ){
    if( this === obj ){ return true; }
    return obj instanceof Params && this.type === obj.type;
}
var Option = TypeMark(function Option( type, defaultValue ){
    var obj;
    if( !isType(type) ){
        throw Error( "Option( type, defualtValue ): 传递给 type参数的值只允许为类型引用." );
    }

    if( arguments.length === 1 ){
        switch( type ){
            case Number:
            //case Integer:
                defaultValue = 0;
                break;
            case String:
                defaultValue = "";
                break;
            case Boolean:
                defaultValue = false;
                break;
            case Object:
                defaultValue = {};
                break;
            case Array:
                defaultValue = [];
                break;
            default:
                defaultValue = null;
        }
    }else{
        if( !is( defaultValue, type ) ){
            throw Error( "Option( type, defaultValue ): 传递给defaultValue参数的值类型不跟传递给type参数的类型匹配.");
        }
    }

    obj = Object.create( Option.prototype );
    obj.type = type;
    obj.defaultValue = defaultValue;
    obj.__NAME__ = obj.__NAME__ + "( " + getTypeName( type ) + ", `" + defaultValue + "` )";
    return obj;
});
Option.prototype.equals = function( obj ){
    if( this === obj ){ return true; }
    return obj instanceof Option && this.type === obj.type;
}
function __signature_check_types__( types, error ){
    var option_index_start;
    if( !( types instanceof Array ) ){
        return false;
    }
    for( var i =0, l = types.length; i < l; i++ ){
        var type = types[i];

        if( isTypeMark( type ) ){
            switch( type.__TYPE__ ){
                case Params:
                    if( i != l - 1 ){
                        throw( error + ": Params( type ) 类型参数允许排列在参数列表最后一位." );
                    }
                break;
            }
        }else if( !isType(type) ){
            if( error ){
                throw Error( error + ": 列表中存在不被接受的类型值的列表项(索引:"+ i +")" );
            }
            return false; 
        }
    }
    return true;
}
 
function Signature( types ){
    var length, obj;
    if( arguments.length != 1 || !( types instanceof Array ) ){
        types = slice.call( arguments );
    }

    obj = Object.create( Signature.prototype );

    __signature_check_types__( types, "Signature( types )" );
    obj.optionPositions = [];
    obj.argumentsMinLength = 0;
    for( var i = 0, l = types.length; i < l; i++ ){
        var type;
        type = types[i];
        if( isTypeMark( type ) ){
            if( type.__TYPE__ === Option ){
                obj.optionPositions.push( i );
            }
        }else{
            obj.argumentsMinLength++;
        }

    }

    obj.types = types;
    obj.length = types.length;

    return obj;
};

Signature.prototype.equals = function( osign ){
    var sign;
    sign = this.types;

    if( osign === this ){ return true; }

    if( osign instanceof Signature ){
        osign = osign.types;
    }

    if( !(  osign instanceof Array ) || sign.length != osign.length ){
        return false;
    }
    for( var i=0, l = sign.length; i< l; i++ ){
        var s1, s2;
        s1 = sign[i];
        s2 = osign[i];
        if( s1 === s2 ){
            continue;
        }
        if( isTypeMark( s1 ) && isTypeMark( s2 ) && s1.__TYPE__ === s2.__TYPE__ && s1.equals( s2 ) ){
            continue;
        }else{
            return false;
        }
    }
    return true;
}

Signature.prototype.match = function(){
    var types, args, dest_args, require_length, args_length, op_pos;
    types = this.types;

    args = slice.call( arguments );
    args_length = args.length;
    dest_args = [];
    op_pos = this.optionPositions.slice();
    require_length = this.argumentsMinLength;


    if( args_length < this.argumentsMinLength ){
        return false;
    }
    __lv1: for( 
    var i = 0, tindex = 0, olength = args_length, tlength = types.length; tindex < tlength || i < args_length; i++ ){
        var item, typ
        type = types[tindex];
        item = args[i];
        olength = args_length - i;

        if( tindex > tlength - 1 ){
            return false;
        }

        if( isTypeMark(type) ){

            switch( type.__TYPE__ ){
                case Option: 
                    var index, length, ntype;
       
                    for( index = 0, length = op_pos.length; index < length; index++ ){
                        type = types[tindex++];
                        ntype = types[tindex];
                        item = args[i];
                        if( 
                        ( olength < 1 || olength <= require_length ) || 
                        ( ntype && ntype.__TYPE__ != Option && ntype.__TYPE__ != Params && is( item, ntype ) && !is( args[ i + 1 ], ntype ) ) || 
                        !is( item, type.type ) 
                        ){
                            dest_args.push( type.defaultValue );
                        }else{
                            dest_args.push( item );
                            olength--;
                            i++;
                        }
                        if( !ntype || ntype.__TYPE__ != Option ){
                            index++;
                            break;
                        }
                    }
                    op_pos.splice( 0, index );
                    i = args_length - olength - 1;
                break;
                case Params:
                    var va_args = [];
                    while( olength-- > 0 ){
                        item = args[i++];
                        if( item && !is( item, type.type ) ){
                            return false;
                        }
                        va_args.push( item );
                    }
                    dest_args.push( va_args );
                break __lv1;
                            }
        }else if( is( item, type ) ){
            dest_args.push( item );
            require_length--;
            tindex++;
        }else{
            return false;
        }
    }
    return dest_args;
}
Signature.prototype.__isInstance__ = function( func ){
    if( typeof func != "function" || typeof func.defined != "function" ){
        return false;
    }
    return func.defined( this );
}
Signature.prototype.toString = function( name ){
    var types, typenames;
    types = this.types;
    typenames = [];
    for( var i=0, l = types.length; i < l ; i++ ){
        typenames.push( getTypeName( types[i] ) );
    }
    return ( name || "function" ) + "( " + typenames.join( ", " ) + " );";
}
Signature.__isInstance__ = __signature_check_types__;

function Define( types, func ){
    var functions = [];
    function function_(){
        var args, invoke;
        for( var i =0, l = functions.length; i < l; i++ ){
            var sign = functions[i].sign;
 
            if( args = sign.match.apply( sign, arguments ) ){
                invoke = functions[i].func;
                break;
            }
        } 
        if( !invoke ){
            throw Error( 
                "该函数的重载列表("+ 
                    function_.toString().replace( RE_LINE_END_CHAR, "  " ) +
                ")未找到与传递的参数列表 `( "+ 
                    slice.call( arguments ).join(", ") + 
                " )` 相匹配的重载" 
            )
        }

        return invoke.apply( this, args );   
    }
    function_.Define = function( types, func ){
        var sign, args;
        args = slice.call( arguments);
        types = args.slice( 0, args.length - 1 );
        func = args[ args.length - 1 ];
        if( typeof func != "function" ){
            throw Error( "Define( types, func ): 参数列表最后一个参数必须是Function类型实例." );
        }
        if( types.length === 1 && is( types[0], Signature ) ){
            sign = types[0];
        }else{
            sign = Signature( types );
        }
        if( function_.defined( sign ) ){
            throw Error( sign + " 已经在该函数重载列表( "+ function_.toString().replace( RE_LINE_END_CHAR, "  " ) +" )中被定义" );
        }
        functions.push( { sign : sign, func : func } );
        return function_;
    }
    function_.defined = function( sign ){
        for( var i=0, l = functions.length; i < l ; i++ ){
            var item = functions[i].sign;
            if( item.equals( sign ) ){
                return true;
            }
        }
        return false;
    }
    function_.toString = function(){
        var signinfos, sign;
        signinfos = [];
        for( var i=0, l = functions.length; i < l ; i++ ){
            signinfos.push( functions[i].sign.toString() );          
        }
        signinfos.sort( STRING_LENGTH_SROT_UP );
        return signinfos.join("\n");
    }

    function_.Define.apply( function_, slice.call( arguments ) );
    return function_;
}
test = function(){ console.log( arguments ); } 
f = Define( test );
f.Define( String, test );
f.Define( Option( String ), String, test );
f.Define( String, Option( String, "World" ), Number, test );
f.Define( String, Option( Date ), Option( String, "Lala...." ), test );
f.Define( String, Params(Object), test );

f( );
f( "HELLO" );
f( "hELLO", "wORLD" );
f( "Hello", 0 );
f( "Hello", "maolion", 1  );
f( "PPP", new Date() );
f( "这只是测试版本", new Date(2012, 11, 13), "m", "a", "o", "L", "i", "n", 0, Function )

