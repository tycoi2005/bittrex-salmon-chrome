const apiCurrenciesUrl = "https://bittrex.com/api/v1.1/public/getcurrencies";
var binancePrefix = "https://www.binance.com/trade.html?symbol="
const binanceCoinsUrl = "https://www.binance.com/api/v1/ticker/allPrices";
const upbitNotice = "https://upbit.com/service_center/notice"
const upbitNoticeApi = "https://api-manager.upbit.com/api/v1/notices?page=1&per_page=10"
const upbitNewsPagePrefix = "https://upbit.com/service_center/notice?id="

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


	$.get( upbitNoticeApi, function( data ) {
		if (data.success){
			var list = data.data.list;
			var coins ="";
			for (var i=0; i< 3; i ++){
				var item = list[i];
				console.log("item", item)
				var url = upbitNewsPagePrefix + item.id;
				var title = item.id + " " + item.title;
				coins += "<a href='"+url+"' style='width:100px'>"+title+"             </a> <span>_______</span>"
			}
			$("#newsUpbit").html(coins);
		}
	});
    
});