var count =0 ;
const apiUrl = "https://www.bittrex.com/api/v1.1/public/getmarketsummaries";
const prefix = 'https://www.bittrex.com/Market/Index?MarketName=';

$(document).ready(function(){
    count ++
	scheduler()
	//$("#counter").html(globaldata.count);
});

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

function showTop(){
	$.get( apiUrl, function( data ) {
	  for( var i in data.result ) {
	    var result = data.result[i];
	    calcTangNumber(result);
	  }
	  var list = data.result;
	  list.sort(compareObject);
	  var htmlStr = "<tr><th>ID</th><th>Market</th><th>TangNumber</th><th>Volume</th><th>Last</th><</tr>"
	  for (var i =0; i< 30; i++){
	  	var item = list[i]
	  	htmlStr += "<tr><td>"+i+"</td><td><a href='"+prefix + item.MarketName+"'>"+item.MarketName.replace("BTC-","")+"</a></td><td>"+format(item.TangNumber)+"</td><td>"+format(item.BaseVolume)+"</td><td>"+item.Last+"</td></tr>"
	  }	  
	  $("#counter").html(count);
	  $("#table").html(htmlStr);
	});

}

function scheduler(){

	function doCheck(){
		console.log("count",count);
		count ++;
		showTop();
		setTimeout(doCheck, 60000);
	}
	setTimeout(doCheck, 2000);
}