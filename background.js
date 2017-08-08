var salmonTop = null;
var queue = [];
var tangDelta = 0.1;
var priceDelta = 0.1;
var loopTime = 60000;
var loopTime30 = loopTime * 30 ;
var isNotifyTop = true;
var isNotifyPump = true;
var isNotifyDumpT = true;

chrome.storage.sync.get({
    priceDelta: 0.1,
    tangDelta: 0.1,
    isNotifyTop: true,
    isNotifyPump: true,
    isNotifyDumpT: true,
  }, function(items) {
    console.log("loaded item", items)
    priceDelta = items.priceDelta;
    tangDelta = items.tangDelta;
    isNotifyTop = items.isNotifyTop;
    isNotifyPump = items.isNotifyPump;
    isNotifyDumpT = items.isNotifyDumpT;
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
const apiUrl = "https://bittrex.com/api/v1.1/public/getmarketsummaries";
const prefix = 'https://bittrex.com/Market/Index?MarketName=';

$(document).ready(function(){
    count ++
	scheduler()
	//$("#counter").html(globaldata.count);
});

function format(number){
	console.log("number",number)
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

function notifyItem(type, item){
	var title = type + " " + item.MarketName + " : " + format(item.TangNumber) + " : " + item.Last;
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
	  			var delta = newItem.TangNumber - oldItem.TangNumber
  				if (delta > tangDelta && isNotifyDumpT){
  					notifyItem("DumpT", newItem)
  					console.log("gap ", delta, "new " , newItem.TangNumber, " old ", oldItem.TangNumber)
  					console.log("price ", "new " , newItem.Last, " old ", oldItem.Last)
  				}

  				var deltaPrice = (-(newItem.Last - oldItem.Last)/oldItem.Last)
  				if (deltaPrice > priceDelta){
  					notifyItem("DumpP", newItem)
  					console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
  				}

  				var deltaPrice = ((newItem.Last - oldItem.Last)/oldItem.Last)
  				if (deltaPrice > priceDelta && isNotifyPump){
  					notifyItem("PumpP", newItem)
  					console.log("gap ", deltaPrice, "new " , newItem.Last, " old ", oldItem.Last)
  				}
	  		}
	  	}
	  }
	  queue.push(map);
	  if (queue.length > 5){
	  	queue.shift();
	  } 
	});
}

const apiCurrenciesUrl = "https://bittrex.com/api/v1.1/public/getcurrencies";
var lastCoin = "";
var balancePrefix = "https://bittrex.com/Balance?search=";
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
		console.log("count ",count, ", tangDelta ", tangDelta, ", priceDelta ", priceDelta, ", isNotifyTop ", isNotifyTop, ", isNotifyPump ", isNotifyPump, " , isNotifyDumpT ", isNotifyDumpT);
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