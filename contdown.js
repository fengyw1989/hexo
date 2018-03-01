self.onmessage = function(event){
    var num = event.data;

    var T = setInterval(function(){

        self.postMessage(--num);
        if(num <= 0){
            clearInterval(T);
            self.close();
        }

    }, 1000);
}
