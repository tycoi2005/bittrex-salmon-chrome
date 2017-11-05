function reloadExtension(){
	console.log("reload extension ----------------------")
	chrome.runtime.reload()
}
function callBackgroundPage(){
	chrome.tabs.create({url: chrome.extension.getURL('background.html')});
}
$(function() {
    console.log( "ready!" );
    $('#reloadbtn').click(reloadExtension)
    $('#btn').click(callBackgroundPage)

    chrome.storage.sync.get({
    	notifyList: []
    }, function (items){
    	var list = items.notifyList
    	console.log(new Date(), list);
    	var html = "<hr/>"
    	for (var i=list.length-1; i>=0;i--){
    		var item = list[i];
    		console.log(i," ", item)
    		html += '<a href="'+item.link+'">'+item.title+'</a> <hr/>'
    	}
    	$("#notifyList").html(html);
    })
});
