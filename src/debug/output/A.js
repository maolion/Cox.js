Define("A",Depend(["./B","./C"]),function(e,n){console.log(e("B")),console.log(e("C")),n.name="A"});