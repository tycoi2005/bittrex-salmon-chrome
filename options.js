function save_options() {
  var priceDelta = document.getElementById('priceDelta').value;
  var tangDelta = document.getElementById('tangDelta').value;
  var isNotifyTop = document.getElementById('isNotifyTop').checked ;
  var isNotifyPump = document.getElementById('isNotifyPump').checked ;
  var isNotifyDumpT = document.getElementById('isNotifyDumpT').checked ;
  var smallCoinVolume = document.getElementById('smallCoinVolume').value;
  var bigCoinVolume = document.getElementById('bigCoinVolume').value;
  var isNotifySmallCoin = document.getElementById('isNotifySmallCoin').checked ;
  var lotsize = document.getElementById('lotsize').value;
  var favoritecoins = document.getElementById('favoritecoins').value;
  if (favoritecoins){
    favoritecoins = favoritecoins.split(",")
  } else {
    favoritecoins = []
  }
  var isAutoFillLot = document.getElementById('isAutoFillLot').checked ;
  if (priceDelta < 0.05) priceDelta = 0.05
  if (tangDelta < 0.05) tangDelta = 0.05
  chrome.storage.sync.set({
    priceDelta: priceDelta,
    tangDelta: tangDelta,
    isNotifyTop: isNotifyTop,
    isNotifyPump: isNotifyPump,
    isNotifyDumpT: isNotifyDumpT,
    smallCoinVolume: smallCoinVolume,
    bigCoinVolume: bigCoinVolume,
    isNotifySmallCoin: isNotifySmallCoin,
    lotsize: lotsize,
    isAutoFillLot: isAutoFillLot,
    favoritecoins: favoritecoins,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    priceDelta: 0.1,
    tangDelta: 0.1,
    isNotifyTop: true,
    isNotifyPump: true,
    isNotifyDumpT: true,
    smallCoinVolume: 10,
    bigCoinVolume: 1000,
    isNotifySmallCoin: true,
    lotsize: 0.1,
    isAutoFillLot: true,
    favoritecoins: [],
  }, function(items) {
    console.log("loaded item", items)
    document.getElementById('priceDelta').value = items.priceDelta;
    document.getElementById('tangDelta').value = items.tangDelta;
    document.getElementById('isNotifyTop').checked = items.isNotifyTop;
    document.getElementById('isNotifyPump').checked = items.isNotifyPump;
    document.getElementById('isNotifyDumpT').checked = items.isNotifyDumpT;
    document.getElementById('smallCoinVolume').value = items.smallCoinVolume;
    document.getElementById('bigCoinVolume').value = items.bigCoinVolume;
    document.getElementById('isNotifySmallCoin').checked = items.isNotifySmallCoin;
    document.getElementById('lotsize').value = items.lotsize;
    document.getElementById('isAutoFillLot').checked = items.isAutoFillLot;
    document.getElementById('favoritecoins').value = items.favoritecoins.join(",");
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);