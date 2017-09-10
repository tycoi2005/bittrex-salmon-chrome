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
});
