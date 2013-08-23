
public class test{
    public static void main( String args[] ){
        System.out.println("HI");
        test.test( A );     
    }
    static void test( x xx ){
        xx.test();
    }
}

interface x{
    public void test();
}


class A implements x{
    public void test(){
        System.out.println( "A,test" );
    }
}
class B implements x{
    public void test(){
        System.out.println( "B,test" );
    }
}
