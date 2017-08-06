function save_options() {
  var priceDelta = document.getElementById('priceDelta').value;
  var tangDelta = document.getElementById('tangDelta').value;
  var isNotifyTop = document.getElementById('isNotifyTop').checked ;

  if (priceDelta < 0.05) priceDelta = 0.05
  if (tangDelta < 0.05) tangDelta = 0.05
  chrome.storage.sync.set({
    priceDelta: priceDelta,
    tangDelta: tangDelta,
    isNotifyTop: isNotifyTop,
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
  }, function(items) {
    console.log("loaded item", items)
    document.getElementById('priceDelta').value = items.priceDelta;
    document.getElementById('tangDelta').value = items.tangDelta;
    document.getElementById('isNotifyTop').checked = items.isNotifyTop;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);