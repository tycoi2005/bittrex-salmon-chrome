var lotsize = 0.1;
var isAutoFillLot = true;
chrome.storage.sync.get({
    lotsize: 0.1,
    isAutoFillLot: true,
  }, function(items) {
    console.log("loaded item", items)
    lotsize = items.lotsize;
    isAutoFillLot = items.isAutoFillLot;
});

/*
$(document).ready(function(){

    // not work right now
    console.log("content ready....")
    if (isAutoFillLot){
        console.log("inject lotsize ", lotsize)
        $('[name=total_Buy]').val(lotsize)

        function injectAsk(){
            var ask = $($('.market-stats').children()[4]).find('.base-market').find('span')[0].innerText;
            ask = parseFloat(ask)*1.05; // increase 5%;
            if (ask>0){
                console.log("inject ask= ask + 5% == ", ask)
                $('[name=price_Buy]').val(ask);
            } else {
                console.log("injectAsk failed, retrying...")
                setTimeout(injectAsk, 100)
            }

            
        }

        injectAsk();
        
    }
});
*/
