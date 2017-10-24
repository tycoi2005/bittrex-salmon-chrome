var salmonTop = null;
var queue = [];
var tangDelta = 0.1;
var priceDelta = 0.1;
var loopTime = 45000;
var loopTime2 = 60000 * 2 ;
var isNotifyTop = true;
var isNotifyPump = true;
var isNotifyDumpT = true;
var smallCoinVolume = 10;
var bigCoinVolume = 1000;
var isNotifySmallCoin = true;
var favoritecoins = [];
var volDelta =0.05;

chrome.storage.sync.get({
    priceDelta: 0.1,
    tangDelta: 0.1,
    isNotifyTop: true,
    isNotifyPump: true,
    isNotifyDumpT: true,
    smallCoinVolume: 10,
    bigCoinVolume: 1000,
    isNotifySmallCoin: true,
    favoritecoins: [],
    volDelta: 0.05
  }, function(items) {
    console.log("loaded item", items)
    priceDelta = items.priceDelta;
    tangDelta = items.tangDelta;
    isNotifyTop = items.isNotifyTop;
    isNotifyPump = items.isNotifyPump;
    isNotifyDumpT = items.isNotifyDumpT;
    smallCoinVolume = items.smallCoinVolume;
    bigCoinVolume = items.bigCoinVolume;
    isNotifySmallCoin = items.isNotifySmallCoin;
    favoritecoins = items.favoritecoins;
    volDelta = items.volDelta;
  });

chrome.storage.onChanged.addListener(function(changes, namespace) {
	console.log("options changed", changes);
	if(changes.tangDelta){
		tangDelta = changes.tangDelta.newValue;	
	}
	if(changes.priceDelta){
		priceDelta = changes.priceDelta.newValue;
	}
	if(changes.isNotifyTop) {
		isNotifyTop = changes.isNotifyTop.newValue;
	}
	if(changes.isNotifyPump) {
		isNotifyPump = changes.isNotifyPump.newValue;
	}

	if(changes.isNotifyDumpT) {
		isNotifyDumpT = changes.isNotifyDumpT.newValue;
	}
	
	if(changes.smallCoinVolume) {
		smallCoinVolume = changes.smallCoinVolume.newValue;
	}

	if(changes.bigCoinVolume) {
		bigCoinVolume = changes.bigCoinVolume.newValue;
	}

	if (changes.favoritecoins){
		favoritecoins = changes.favoritecoins.newValue;
	}
});

function notifyMe(title, body, link) {
  console.log(new Date(), title);
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification(title, {
      icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
      body: body,
    });

    notification.onclick = function () {
      window.open(link);      
    };

  }

}

var count =0 ;
const apiUrl = "https://www.bittrex.com/api/v1.1/public/getmarketsummaries";
const prefix = 'https://www.bittrex.com/Market/Index?MarketName=';

function format(number){
    return $.number( number, 2 )
}

function compareObject(a, b){
	var keyA = a.TangNumber,
        keyB = b.TangNumber;
    // Compare the 2 dates
    if(keyA < keyB) return 1;
    if(keyA > keyB) return -1;
    return 0;
}

function calcTangNumber(obj){
	obj.TangNumber = ((obj.High-obj.Last) - (obj.Last - obj.Low))/(obj.Last)

    //obj.TangNumber = ((obj.High-obj.Last))/(obj.Last)
    // obj.TangNumber = ((obj.High-obj.Last) - (obj.Last - obj.Low))/(obj.High-obj.Low) // coin giam dan deu
    // obj.TangNumber = -((obj.High-obj.Last) - (obj.Last - obj.Low))/(obj.High-obj.Low) // coin tang dan deu
	if (! /^BTC.*/.test(obj.MarketName)){
		obj.TangNumber = -100;
	}
}

function notifyItem(type, item, gap ){
	if(gap){
		gap = gap* 100;
		gap = '' +$.number(gap,0) + '%';
	} else{
		gap = '-'
	}
	var title = type + " " + item.MarketName + " : "+ gap +" : " + format(item.TangNumber) + " : " + item.Last ;
  	var body = title;
  	var link = prefix + item.MarketName;
  	notifyMe(title, body, link)
}

function showTop(){
	$.get( apiUrl, function( data ) {
	  for( var i in data.result ) {
	    var result = data.result[i];
	    calcTangNumber(result);
	  }
	  var list = data.result;
	  list.sort(compareObject);

	  var topItem = list[0]
	  if (topItem.MarketName != salmonTop && isNotifyTop){
	  	salmonTop = topItem.MarketName;
	  	notifyItem("TOP",topItem);
	  }
	  // put data to map
	  var map = {}
	  for (var i in list){
	  	var item = list[i]
	  	map[item.MarketName] = item;
	  }
	  // check time frame 1 minute
	  if(queue.length > 0) {
	  	var lastMap = queue[queue.length-1];
	  	for (var key in map){
	  		// only monitor BTC-* markets
	  		if (!/^BTC-/.test(key))
	  			continue;
	  		var oldItem = lastMap[key];
	  		var newItem = map[key]
	  		if (oldItem && newItem){
	  			checkItem(oldItem, newItem, key, true)
	  		}
	  	}
	  }
	  // check time frame 5 minutes
	  if(queue.length > 4) {
	  	var lastMap = queue[0];
	  	for (var key in map){
	  		// only monitor BTC-* markets
	  		if (!/^BTC-/.test(key))
	  			continue;
	  		var oldItem = lastMap[key];
	  		var newItem = map[key]
	  		if (oldItem && newItem){
	  			checkItem(oldItem, newItem, key, true)
	  		}
	  	}
	  }
	  queue.push(map);
	  if (queue.length > 5){
	  	queue.shift();
	  } 
	});
}

function checkItem(oldItem, newItem, key, isCheckVol){
	// prevent notify delisted coin
	if (delist.indexOf(key)>=0){
		return;
	}
	var delta = newItem.TangNumber - oldItem.TangNumber
	var priceChange = ((newItem.Last - oldItem.Last)/oldItem.Last)
	var isSmallcoin = newItem.BaseVolume <= smallCoinVolume;
	var isVerySmallcoin = newItem.BaseVolume <= smallCoinVolume/2;
	var isSuperSmallcoin = newItem.BaseVolume <= smallCoinVolume/4;
	var isSuperSuperSmallcoin = newItem.BaseVolume <= smallCoinVolume/8;
	var isBigCoin = newItem.BaseVolume >= bigCoinVolume;
	var coinName = key.replace('BTC-','')
	var isFavoriteCoin = favoritecoins.indexOf(coinName) >=0;

	var deltaVol = (newItem.BaseVolume - oldItem.BaseVolume)/oldItem.BaseVolume;
	var volDeltaFix = volDelta;
	if (isSmallcoin){
		volDeltaFix = volDeltaFix*2;
	}

	if (isVerySmallcoin){
		volDeltaFix = volDeltaFix*2;	
	}

	if (isSuperSmallcoin){
		volDeltaFix = volDeltaFix*2;	
	}
	if (isSuperSuperSmallcoin){
		volDeltaFix = volDeltaFix*2;	
	}

	if (isSmallcoin && !isNotifySmallCoin){
		return;
	}

	if (isBigCoin || isFavoriteCoin){
		if (priceChange/2 < -priceDelta){
			notifyItem("DP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (priceChange/2 > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (delta > tangDelta/2 && isNotifyDumpT && priceChange/4 < -priceDelta){
			notifyItem("DT", newItem, priceChange)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		} 
		else if (deltaVol > volDeltaFix/2 && isCheckVol){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		}
	} else {
		if (priceChange < -priceDelta){
			notifyItem("DP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (priceChange > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (delta > tangDelta && isNotifyDumpT && priceChange/2 < -priceDelta){
			notifyItem("DT", newItem, priceChange)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		} 
		else if (deltaVol > volDeltaFix && isCheckVol){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		}
	}

}
const binanceCoinsUrl = "https://www.binance.com/api/v1/ticker/allPrices";
var lastCoin = "";
var balancePrefix = "https://www.bittrex.com/Balance?search=";
var binancePrefix = "https://www.binance.com/trade.html?symbol="
var lastCoinBinance = ""
var hitbtcCoinUrl = "https://api.hitbtc.com/api/1/public/symbols"
var hitbtcCoinPrefix = "https://hitbtc.com/exchange/";
var lastHitbtccoin = "";
var listHitbtc = {}

const currencyUrl = "https://www.bittrex.com/api/v1.1/public/getcurrencies"
const marketsUrl = "https://www.bittrex.com/api/v1.1/public/getmarkets";
var delist = []

function checkNewCoin(){
	console.log("checkNewCoin")


	$.get( currencyUrl, function( data ) {
		var coins = "";
		var list = data.result;
		var last = list[list.length-1];
		var name = last.Currency;
		var url = balancePrefix + name;
		console.log("lastcoin", lastCoin, "name", name)
		if (lastCoin != name) {
			lastCoin = name;
			notifyMe("LastCoin Bittrex " + name, "LastCoin " + name , url)
		}

		$.get( marketsUrl, function( data ) {
			var coins = "";
			var list = data.result;
			var last = list[list.length-1];
			var name = last.MarketName;
			var url = balancePrefix + name;

			olddelist = delist;
			delist = []
			for (var i =0; i< list.length; i++){
				var coin = list[i]
				if (coin.Notice && coin.Notice.indexOf('delete')>=0){
					delist.push(coin.MarketName);
					if (olddelist.indexOf(coin.MarketName)<0){
						var urlDelist = balancePrefix + coin.MarketName
                        notifyMe("NewDelist Bittrex " + coin.MarketName, "Delist " + coin.MarketName , urlDelist)
					}
				}
			}
			console.log("delisted coin:", delist);

			// $.get( hitbtcCoinUrl, function( data ) {
			// 	console.log("data", data)
			// 	var list = data.symbols;
			// 	var last = list[list.length-1]
            //
			// 	if (lastHitbtccoin != last.symbol){
			// 		lastHitbtccoin = last.symbol;
			// 		notifyMe("LastCoin hitbtc ", lastHitbtccoin, hitbtcCoinPrefix + lastHitbtccoin)
			// 	}
			// });

			$.get( binanceCoinsUrl, function( data ) {
				var coins = "";
				var list = JSON.parse(data);
				var last = list[list.length-1];
				console.log("last", last)
				var name = last.symbol;
				var url = binancePrefix + name;
				if (lastCoinBinance != name){
					lastCoinBinance = name;
					notifyMe("LastCoin binance " + name, "LastCoin " + name , url)
				}
			});
		});

	})

	

	
}
const etherDeltaTickerUrl = "https://api.etherdelta.com/returnTicker";
const etherDeltaPrefix = "https://etherdelta.com/#";
var notifieds = {}
function checkEtherDelta(){
	console.log("checkEtherDelta")
	$.get( etherDeltaTickerUrl, function( data ) {
		//console.log("etherDeltaTickerUrl data", data, typeof data)
		for (var name in data){
			var item = data[name];
			//ex {"ETH_AVT":{"tokenAddr":"0x0d88ed6e74bbfd96b831231638b66c05571e824f",
			// "quoteVolume":224930.199,"baseVolume":2206.554,"last":0.010032682,"percentChange":0.3742,
			// "bid":0.00900002,"ask":0.00953}
			var coinsymbol = name.replace("ETH_","") + "-ETH"
			var url = etherDeltaPrefix + coinsymbol;
			var bid = item.bid; // buy order
			var ask = item.ask; // sell order
			var profitLevel = bid/ask;
			if (profitLevel > 2 && bid>0 && ask>0){
				var lastbid = notifieds[name];
				if (lastbid != bid){
					notifieds[name] = bid;
					notifyMe("profit etherdelta "+profitLevel+" : " + name, "Coin " + name , url)
				}
				
			}
		}
	})
}


function scheduler(){	

	function doCheck(){
		//console.log("count ",count, ", tangDelta ", tangDelta, ", priceDelta ", priceDelta, ", isNotifyTop ", isNotifyTop, ", isNotifyPump ", isNotifyPump, " , 		 ", isNotifyDumpT);
		count ++;
		showTop();
		setTimeout(doCheck, loopTime);
	}
	setTimeout(doCheck, 10);

	function doCheckNewCoin(){
		checkNewCoin();
		setTimeout(doCheckNewCoin, loopTime2)
	}

	setTimeout(doCheckNewCoin, 100);	
	setTimeout(doWebsocket, 200);

	function docheckEtherDelta(){
		checkEtherDelta();
		setTimeout(docheckEtherDelta, loopTime)
	}
	setTimeout(docheckEtherDelta, 300);
}

scheduler();


var Summaries = {};
var isSumaryReady = false;
function doWebsocket(){
	// // use websocket with signalR
	var i = $.connection.coreHub;
	i.client.updateSummaryState = function(n) {
        // need to code more here
        if (!isSumaryReady){
        	console.log("updateSummaryState n", n)
        	return;
        }

        var Deltas = n.Deltas;
        for (var i in Deltas){
        	var item = Deltas[i];
        	var key = item.MarketName;
        	if (!/^BTC-/.test(key))
	  			continue;
        	var oldItem = Summaries[key];
        	checkItem(oldItem, item, key, false);
        	Summaries[key]=item;
        }
    };
    i.client.updateFloodState = function(n) {
        console.log("updateFloodState n", n)
    };
    i.client.updateExchangeState = function(n) {
        console.log("updateExchangeState n", n)
    };
    i.client.stopClient = function() {
        $.connection.hub.stop()
    };
    i.client.refresh = function() {
        market.server.refresh()
    };
    $.connection.hub.connectionSlow(function() {
        console.log("websocket slow");
        //f("Slow");
        $("#event-store").trigger({
            type: "socket-slow"
        })
    });
    $.connection.hub.reconnecting(function() {
        console.log("websocket reconnecting");
        //f("Reconnecting");
        $("#event-store").trigger({
            type: "socket-reconnecting"
        })
    });
    $.connection.hub.reconnected(function() {
        console.log("websocket reconnected");
        //f("Connected");
        $("#event-store").trigger({
            type: "socket-connected"
        })
    });
    // $.connection.hub.disconnected(function() {
    //     console.log("websocket disconnected");
    //     f("Disconnected");
    //     $("#event-store").trigger({
    //         type: "socket-disconnected"
    //     });
    //     u(!1);
    //     setTimeout(function() {
    //         $.connection.hub.start().done(g);
    //         console.log("reconnect websockets")
    //     }, 5e3)
    // })
	$.connection.hub.url = "https://socket.bittrex.com/signalr";
	$.connection.hub.start().done(function(){
        i.server.querySummaryState().then(function(b,d,e){
        	// b is event, b.Nounce: number, b.Summaries: array has items:
        	// ~ get market summary 
        	for (var index=0; index<b.Summaries.length; index++){
        		var item = b.Summaries[index];
        		Summaries[item.MarketName] = item;
        	}
        	isSumaryReady = true;
        	console.log("Summaries",Summaries)
        })
	}).fail(function (reason) {
        console.log("SignalR connection failed: " + reason);
        setTimeout(doWebsocket, 60000);
    });;
}

//doWebsocket()



