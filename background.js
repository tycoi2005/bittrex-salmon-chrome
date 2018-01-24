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
  console.log(new Date(), title, body);
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification(title, {
      icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
      body: body,
    });
    NotifyQueue.addItem (title, link);
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
	//console.log("notifyItem item", item)
	if(gap){
		gap = gap* 100;
		gap = '' +$.number(gap,0) + '%';
	} else{
		gap = '-'
	}
	var title = type + " " + item.MarketName + " : "+ gap +" : " + format(item.TangNumber) + " : " + item.Ask ;
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
	if(newItem.Ask<=0) return;
	var delta = newItem.TangNumber - oldItem.TangNumber
	var priceChange = ((newItem.Ask - oldItem.Bid)/oldItem.Bid)
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
			console.log("gap ", priceChange, "new " , newItem.Ask, " old ", oldItem.Bid)
		} else if (priceChange/2 > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Ask, " old ", oldItem.Bid)
		} else if (delta > tangDelta/2 && isNotifyDumpT && priceChange/4 < -priceDelta){
			notifyItem("DT", newItem, priceChange)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Ask, " old ", oldItem.Bid)
		} 
		else if (deltaVol > volDeltaFix/2 && isCheckVol){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Ask, " old ", oldItem.Bid)
		}
	} else {
		if (priceChange < -priceDelta){
			notifyItem("DP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Ask, " old ", oldItem.Bid)
		} else if (priceChange > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, priceChange)
			console.log("gap ", priceChange, "new " , newItem.Ask, " old ", oldItem.Bid)
		} else if (delta > tangDelta && isNotifyDumpT && priceChange/2 < -priceDelta){
			notifyItem("DT", newItem, priceChange)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Ask, " old ", oldItem.Bid)
		} 
		else if (deltaVol > volDeltaFix && isCheckVol){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Ask, " old ", oldItem.Bid)
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
            chrome.browserAction.setBadgeText({text:lastCoin})
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
				var list = data;
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

var hitbtctickers = null;
var hitbtctickerUrl = "https://api.hitbtc.com/api/1/public/ticker";
function checkDumpHitbtc(){
	console.log("checkDumpHitbtc")
	$.get( hitbtctickerUrl, function( data ) {
		if (hitbtctickers == null){
			hitbtctickers = data;
		} else {
			for (var name in data){
				var oldItem = hitbtctickers[name];
				var newItem = data[name];
				checkDumpHitbtcItem(name, oldItem, newItem);
			}
			hitbtctickers = data;
		}
	})
}

function checkDumpHitbtcItem(name, oldItem, newItem){
	if (newItem.volume_quote < 5 || !/.*BTC$/.test(name)){
		return;
	}
	// fix bug 
	if (name == "ETHBTC" && newItem.ask == 0.034373) return;
	if (name == "DASHBTC" && newItem.ask == 0.066783) return;
	if (name == "KBRBTC" && newItem.ask == 0.0000039) return;
	if (name == "FYPBTC" && newItem.ask == 0.000096) return;

	var priceChange = (newItem.ask - oldItem.bid)/ oldItem.bid;
	var code = name.replace("BTC");
	if (favoritecoins.indexOf(code)>=0){
		priceChange = priceChange*2;
	}
	//console.log("checkdump ", name, "priceChange", priceChange, "priceDelta", priceDelta, "new " , newItem.ask, " old ", oldItem.bid)
	if (priceChange < -priceDelta){
		notifyItemHitbtc("DPHitbtc", name,  newItem, priceChange)
		console.log("hitbtc",name, "gap ", priceChange, "new " , newItem.ask, " old ", oldItem.bid)
	}
}

function notifyItemHitbtc(type, name, item, gap ){
	if(gap){
		gap = gap* 100;
		gap = '' +$.number(gap,0) + '%';
	} else{
		gap = '-'
	}
	var title = type + " " + name + " : "+ gap + " : " + item.ask ;
  	var body = title;
  	var link = hitbtcCoinPrefix + name;
  	notifyMe(title, body, link)
}

var binanceTickersUrl = "https://www.binance.com/api/v1/ticker/allBookTickers";
var binanceTickers = {};
function checkDumpBinance(){
	console.log("checkDumpBinance")
	$.get(binanceTickersUrl, function(data){
		var list = data;
		//console.log("result binance", list)
		for (var i=0; i< list.length; i++){
			var newItem = list[i];
			var oldItem = binanceTickers[newItem.symbol]
			binanceTickers[newItem.symbol] = newItem;
			if (oldItem){
				checkDumpBinanceItem(oldItem, newItem);
			}
		}
	})
}

function checkDumpBinanceItem(oldItem, newItem){
	if (newItem.bidQty < 1 || newItem.askPrice<=0 || !/.*BTC$/.test(newItem.symbol)){
		return;
	}
	var priceChange = (newItem.askPrice - oldItem.bidPrice)/ oldItem.bidPrice;
	var code = newItem.symbol.replace("BTC","");
	//console.log("code", code)
	if (favoritecoins.indexOf(code)>=0){
		priceChange = priceChange*2;
	}

	//console.log("binance",newItem.symbol, "gap ", priceChange, "new " , newItem.askPrice, " old ", oldItem.bidPrice)
	if (priceChange < -priceDelta){
		notifyItemBinance("DPBinance", newItem.symbol,  newItem, priceChange)
		console.log("binance",newItem.symbol, "gap ", priceChange, "new " , newItem.askPrice, " old ", oldItem.bidPrice)
	}
}

function notifyItemBinance(type, name, item, gap ){
	if(gap){
		gap = gap* 100;
		gap = '' +$.number(gap,0) + '%';
	} else{
		gap = '-'
	}
	var title = type + " " + name + " : "+ gap + " : " + item.askPrice ;
  	var body = title;
  	var link = binancePrefix + name;
  	notifyMe(title, body, link)
}

const upbitNotice = "https://upbit.com/service_center/notice"
const upbitNoticeApi = "https://api-manager.upbit.com/api/v1/notices?page=1&per_page=10"
var upbitLastNews = 0;
function checkNoticeUpbit() {
	$.get( upbitNoticeApi, function( data ) {
		if (data.success){
			var list = data.data.list;
			var last = list[0];
			if (upbitLastNews != last.id){
				upbitLastNews = last.id
				notifyMe("last Notice Upbit " + last.id, last.title, upbitNotice);
			}
		}
	});
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

	function doCheckDumpHitbtc(){
		checkDumpHitbtc();
		setTimeout(doCheckDumpHitbtc, loopTime);
	}
	setTimeout(doCheckDumpHitbtc, 350)

	function doCheckDumpBinance(){
		checkDumpBinance();
		setTimeout(doCheckDumpBinance, loopTime)
	}
	setTimeout(doCheckDumpBinance, 400)

	function doCheckUpbit(){
		checkNoticeUpbit();
		setTimeout(doCheckUpbit, loopTime)
	}
	setTimeout(doCheckUpbit, 500);
	// wss://stream2.binance.com:9443/ws/!ticker@arr binance socket api
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



