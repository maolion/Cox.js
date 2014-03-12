Define("A",Depend(["./B","./C"]),function(e,n){console.log(e("B")),console.log(e("C")),n.name="A"});
;Define("B",Depend(["./A","./C"]),function(e,n){n.name="B"});