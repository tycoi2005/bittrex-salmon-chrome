var NotifyQueue={}
NotifyQueue.maxLength =20;
NotifyQueue.datalist = []

NotifyQueue.addItem = function(title, link){
	var item = {title: title, link: link};
	NotifyQueue.datalist.push(item);
	if (NotifyQueue.datalist.length > NotifyQueue.maxLength){
		NotifyQueue.datalist.shift();
	}

	chrome.storage.sync.set({
    	notifyList: NotifyQueue.datalist
    })
}

NotifyQueue.getNotifyList = function (cb){
	var notifyList = null;
	chrome.storage.sync.get({
    	notifyList: []
    }, function (items){
    	notifyList = items.notifyList
    	cb(notifyList);
    })
}