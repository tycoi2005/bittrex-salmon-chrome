const apiCurrenciesUrl = "https://www.bittrex.com/api/v1.1/public/getcurrencies";
var binancePrefix = "https://www.binance.com/trade.html?symbol="
const binanceCoinsUrl = "https://www.binance.com/api/v1/ticker/allPrices";

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

	$.get( binanceCoinsUrl, function( data ) {
		var coins = "";
		var list = data;
		for (var i=list.length -1; i> list.length -5; i --){
			var item = list[i];
			var url = binancePrefix + item.symbol;
			coins += "<a href='"+url+"' style='width:100px'>"+item.symbol+"             </a> <span>_______</span>"
		}
		$("#newsbinance").html(coins);
	});
    
});