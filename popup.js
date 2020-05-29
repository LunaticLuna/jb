const PRICE_IDX = 2
let cd = 0
let timer = null
document.addEventListener("DOMContentLoaded", function(){
  console.log('finish Loading')
  // chrome.storage.local.get('lowest', function(budget){
  //   if (budget.lowest){
  //     document.getElementById("lowest").textContent = budget.lowest
  //   }
  // })
  //bind start/stop
  // const switchBtn = document.getElementById('switch')
  // switchBtn.addEventListener('click', (e) => {
  //   console.log('click switch')
  //   const text = switchBtn.value
  //   if (text === '开始竞价'){
  //     switchBtn.value = '停止竞价'
  //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //       chrome.tabs.sendMessage(tabs[0].id, {isBidding: true})
  //     })
  //   }else{
  //     switchBtn.value = '开始竞价'
  //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //       chrome.tabs.sendMessage(tabs[0].id, {isBidding: false})
  //     })
  //   }
  // })

  function addTableRow(tb,id,name,lowest){
    const row= document.createElement("tr")
    //make lowest price input box
    console.log(lowest)
    const td_price = document.createElement("td");
    if (lowest !== undefined){
      
      const price = document.createElement('div')
      price.id = `input${id}`
      price.innerHTML = lowest
      td_price.appendChild(price)
    }
    const td_input = document.createElement("td");
    const input = document.createElement('input')
    input.type = 'number'
    input.className = 'num-input'
    input.setAttribute('id',`input${id}`)
    td_input.appendChild(input)
    //make delete button
    const td_dl = document.createElement("td");
    const dl = document.createElement('input')
    dl.type = 'submit'
    dl.value = '删除此项'
    dl.setAttribute('id',`submit${id}`)
    dl.onclick = () => deleteRow(id)
    td_dl.appendChild(dl)
    //add to row
    const td_id = document.createElement("td")
    td_id.innerHTML = parseInt(id) + 1
    const td_name = document.createElement("td")
    td_name.innerHTML = name
    row.appendChild(td_id)
    row.appendChild(td_name)
    if (lowest  !== undefined){
      row.appendChild(td_price)
    }else{
      row.appendChild(td_input)
    }
    row.appendChild(td_dl)
    tb.appendChild(row)
  }
  function deleteRow(id){
    chrome.storage.local.get('entries',function(results){
      const entries = results.entries
      delete entries[id]
      chrome.storage.local.set({'entries':entries})
    })
  }
  function submitLowestPrice(){
    chrome.storage.local.get('entries', function(result){
      const entries = result.entries
      for (const id in entries){
        const newLow = document.getElementById(`input${id}`).innerHTML || document.getElementById(`input${id}`).value
        entries[id].lowestPrice = newLow
      }
      chrome.storage.local.set({'entries':entries})
      console.log(entries)
    })
  }
  function toggleInputText(req){
    const tb = document.getElementById('table-body')
    const rows = tb.rows
    console.log(rows)
    if (req === 'text'){
      for (var i = 0; i < rows.length; i++) {
        const td = rows[i].cells[PRICE_IDX]
        const input = td.childNodes[0]
        if (input.tagName === 'DIV'){
          continue
        }
        const id = input.id
        const val = input.value
        //new node
        const newNode = document.createElement('div')
        newNode.innerHTML = val
        newNode.id = input.id
        td.innerHTML = ''
        console.log('td:',td)
        console.log('newnode:',newNode)
        td.appendChild(newNode)
      }
    }else if (req === 'input'){
      for (var i = 0; i < rows.length; i++) {
        const td = rows[i].cells[PRICE_IDX]
        const text = td.childNodes[0]
        console.log(text.innerHTML)
        if (text.tagName === 'INPUT'){
          continue
        }
        const id = text.id
        const val = parseFloat(text.innerHTML)
        //new node
        const input = document.createElement('input')
        input.type = 'number'
        input.className = 'num-input'
        input.id = id
        input.setAttribute('value',val)
        console.log(input)
        td.innerHTML = ''
        td.appendChild(input)
      }
    }
  }
  function setCountDown(){
    timer = setInterval(()=>{
      cd --
      const e = document.getElementById('countDown')
      e.innerHTML = cd
      if (cd === 0){
        clearInterval(timer)
      }
    },1000)
  }
  function fillPagePrice(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {msg:"fillPrice"}, function(res){
        console.log('sent message')
        cd = res.sec
        setCountDown()
        
      })
    })
  }
  function cancelBidding(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {msg:"cancelBidding"}, function(res){
        console.log('cancel Bidding')
        clearInterval(timer)
        toggleInputText('input')
      })
    })
  }

  //bind lowest price change
  // const submitBtn = document.getElementById("submit")
  // submitBtn.addEventListener("click", (e) => {
  //   console.log('click submit')
  //   if (submitBtn.value === '提交报价'){
  //     submitLowestPrice()
  //     toggleInputText('text')
  //     submitBtn.value = '修改报价'
  //   }else{
  //     toggleInputText('input')
  //     submitBtn.value = '提交报价'
  //   }
  // })
  //show entries on popup when open
  chrome.storage.local.get('entries',function(results){
    console.log('storage')
    const entries = results.entries
    const tb = document.getElementById('table-body')
    for (const id in entries){
      const { name, lowestPrice } = entries[id]
      addTableRow(tb, id, name, lowestPrice)
    }
  })
  //is current page bidding?
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {msg:"isBidding"}, function(res){
      const { isBidding, sec } = res
      if (isBidding){
        bidBtn.value = '取消竞价'
        cd = sec
        setCountDown()
      }
    })
  })
  //bind start bidding
  const bidBtn = document.getElementById('bidding')
  bidBtn.addEventListener('click', ()=>{
    console.log('click bidding')
    if (bidBtn.value === '开始竞价'){
      submitLowestPrice()
      toggleInputText('text')
      fillPagePrice()
      bidBtn.value = '取消竞价'
    }else if(bidBtn.value === '取消竞价'){
      cancelBidding()
      bidBtn.value = '开始竞价'
    }
    
  })
  //bind add All
  const addAllBtn = document.getElementById('addAll')
  addAll.addEventListener('click', ()=>{
    console.log('add all')
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {msg:"getAllTableData"}, function(entries) {
        chrome.runtime.sendMessage({msg:"changeEntries", entries:entries},function(response){

        })
      })
    }) 
  })
  //add entries to popup 
  chrome.storage.onChanged.addListener(function(changes, namespace){
    console.log("listen")
    for (const key in changes){
      if (key === 'entries'){
        chrome.storage.local.get('entries',function(results){
          console.log('storage')
          const entries = results.entries
          const tb = document.getElementById('table-body')
          tb.innerHTML = ''
          for (const id in entries){
            console.log(entries)
            addTableRow(tb, id, entries[id].name, entries[id].lowestPrice)
          }
        })
      }
    }
  })
})