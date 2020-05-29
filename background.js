const contextMenuItem = {
  "id": "addBidding",
  "title": "add item in bidding",
  "contexts":["all"],
}
// const entires = {}
chrome.contextMenus.create(contextMenuItem)

function addToEntry(id, name){
  chrome.storage.local.get('entries', function(result){
    let entries = result.entries
    if (!entries){
      entries = {}
    }
    entries[id] = {
      name,
      id
    }
    chrome.storage.local.set({'entries':entries})
  })
}

chrome.contextMenus.onClicked.addListener(function(clickData){
  if (clickData.menuItemId === "addBidding"){
    console.log(clickData)
    let elem = null
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {msg:"getClickedEl"}, function(clickedEl) {
        console.log(tabs[0].id)
        console.log(clickedEl)
        if (!clickedEl){
          //not the buton we want
          return
        }
        const { id, name } = clickedEl
        // elem = clickedEl.id
        addToEnty(id, name)
      });
    });
  }
})
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.msg === 'changeEntries'){
    chrome.storage.local.set({'entries':request.entries})
  }
})

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
//   console.log(request)
//   if ( request.msg === 'addEntry'){

//     const { id, name, lowest } = request
//     chrome.storage.local.get('entries',function(result){
//       console.log(result)
//       const entries = result
//     })
//     sendResponse()
//   }
// })

