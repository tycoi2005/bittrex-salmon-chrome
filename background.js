var salmonTop = null;
var queue = [];
var tangDelta = 0.1;
var priceDelta = 0.1;
var loopTime = 30000;
var loopTime30 = 60000 * 30 ;
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
  console.log(title);
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
	  if(queue.length > 0) {
	  	var lastMap = queue[queue.length-1];
	  	for (var key in map){
	  		// only monitor BTC-* markets
	  		if (!/^BTC-/.test(key))
	  			continue;
	  		var oldItem = lastMap[key];
	  		var newItem = map[key]
	  		if (oldItem && newItem){
	  			checkItem(oldItem, newItem, key)
	  		}
	  	}
	  }
	  queue.push(map);
	  if (queue.length > 5){
	  	queue.shift();
	  } 
	});
}

function checkItem(oldItem, newItem, key){
	var delta = newItem.TangNumber - oldItem.TangNumber
	var deltaPrice = ((newItem.Last - oldItem.Last)/oldItem.Last)
	var isSmallcoin = newItem.BaseVolume <= smallCoinVolume;
	var isVerySmallcoin = newItem.BaseVolume <= smallCoinVolume/2;
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

	if (isSmallcoin && !isNotifySmallCoin){
		return;
	}

	if (isBigCoin || isFavoriteCoin){
	if (deltaPrice/2 < -priceDelta){
			notifyItem("DP", newItem, deltaPrice)
			console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (deltaPrice/2 > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, deltaPrice)
			console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (delta > tangDelta/2 && isNotifyDumpT){
			notifyItem("DT", newItem, deltaPrice)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		} else if (deltaVol > volDeltaFix/2){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		}
	} else {
		if (deltaPrice < -priceDelta){
			notifyItem("DP", newItem, deltaPrice)
			console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (deltaPrice > priceDelta && isNotifyPump){
			notifyItem("PP", newItem, deltaPrice)
			console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
		} else if (delta > tangDelta && isNotifyDumpT){
			notifyItem("DT", newItem, deltaPrice)
			console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		} else if (deltaVol > volDeltaFix){
			notifyItem("Vol", newItem, deltaVol)
			console.log("gap ", delta, "new " , newItem.BaseVolume, " old ", oldItem.BaseVolume)
			console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
		}
	}

}
const apiCurrenciesUrl = "https://www.bittrex.com/api/v1.1/public/getcurrencies";
var lastCoin = "";
var balancePrefix = "https://www.bittrex.com/Balance?search=";
function checkNewCoin(){
	console.log("checkNewCoin")
	$.get( apiCurrenciesUrl, function( data ) {
		var coins = "";
		var list = data.result;
		var last = list[list.length-1];
		var name = last.Currency;
		var url = balancePrefix + name;
		if (lastCoin != name){
			lastCoin = name;
			notifyMe("LastCoin " + name, "LastCoin " + name , url)
		}
	});
}

function scheduler(){
	function doCheck(){
		console.log("count ",count, ", tangDelta ", tangDelta, ", priceDelta ", priceDelta, ", isNotifyTop ", isNotifyTop, ", isNotifyPump ", isNotifyPump, " , 		 ", isNotifyDumpT);
		count ++;
		showTop();
		setTimeout(doCheck, loopTime);
	}
	setTimeout(doCheck, 10);

	function doCheckNewCoin(){
		checkNewCoin();
		setTimeout(doCheckNewCoin, loopTime30)
	}
	setTimeout(doCheckNewCoin, 100);	
}

scheduler();

function doWebsocket(){
	// // use websocket with signalR
	// var websockets_baseurl = 'wss://socket.bittrex.com/signalr'
	// var websockets_hubs = ['CoreHub']
	// var connection = $.connection(websockets_baseurl, websockets_hubs);
	// console.log("connection", connection)
	// connection.received(function(data) {
	//     console.log("websocket return ", data);
	// });
	// $.support.cors = true;
	// connection.start();	
	// connection.start({ transport: ['webSockets'] });

	//set the connection url.
	$.connection.hub.url = 'https://socket.bittrex.com/signalr';
	$.connection.hub.start( { transport: ['webSockets', 'longPolling'] }).done(function(){
		var connection = $.connection.hub.proxies.corehub.connection
		// $.connection.hub.transport.send(connection, {"H":"corehub","M":"SubscribeToUserDeltas","A":[],"I":0})
		// $.connection.hub.transport.send(connection, {"H":"corehub","M":"SubscribeToExchangeDeltas","A":[],"I":2})
		// $.connection.hub.transport.send(connection, {"H":"corehub","M":"QueryBalanceState","A":[],"I":1})	
		// $.connection.hub.transport.send(connection, {"H":"corehub","M":"QueryExchangeState","A":[],"I":0})
		$.connection.hub.transport.send(connection, {"H":"corehub","M":"QuerySummaryState","A":[],"I":0})	
		$.connection.socket.onmessage = function(data){
			console.log("data", data);
		}
	});
}

//doWebsocket()



