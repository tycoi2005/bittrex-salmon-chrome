const apiCurrenciesUrl = "https://www.bittrex.com/api/v1.1/public/getcurrencies";

$(document).ready(function(){
	console.log("check coins-------------------")
	$.get( apiCurrenciesUrl, function( data ) {
		var coins = "";
		var list = data.result;
		for (var i=list.length -1; i> list.length -5; i --){
			var item = list[i];
			var url = prefix + 'BTC-'+item.Currency;
			coins += "<a href='"+url+"' style='width:100px'>"+item.Currency+"             </a> <span>_______</span>"
		}
		$("#news").html(coins);
	});
    
});