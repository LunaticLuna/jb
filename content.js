const NAME_IDX = 1
const LOWEST_IDX = 9
const INPUT_IDX = 0
const DEFAULT_IDX = 8
const ISLOWEST_IDX = 11
const waitTime = 5000 //5s
const itvTime = 1000//1s
let isBidding = false
let timer = null
let timerItv = null
let cdTimer = null
let rc_elem = null //clicked events
let sec = 0

window.addEventListener('beforeunload', function(e){
  e.preventDefault()
  chrome.storage.local.remove('entries', function(){
    var error = chrome.runtime.lastError;
    if (error) {
        console.error(error);
        return error
    }
  })
  clearInterval(timerItv)
  clearTimeout(timer)
  clearInterval(cdTimer)
  isBidding = false
  console.log('unload')
  alert('unload')
  return "unload"
})
document.addEventListener("DOMContentLoaded", function(){
  //delete items before we close web page
  
  //override popup confirm window
  //inject to original page
  var actualCode = '(' + function() {
    // var realConfirm = $.messager.confirm;
    $.messager.confirm = function(){
      console.log('switch')
      const [title, msg, fn]  = Array.from(arguments);
      console.log(title)
      console.log(msg)
      console.log(fn)
      fn(true)
      // $.messager.confirm = realConfirm
      return true; 
    }
    window.confirm = function(){return true}
  } + ')();';
  var script = document.createElement('script');
  script.textContent = actualCode;
  document.getElementsByTagName('head')[0].appendChild(script);
  // script.remove();

  //helper funcs
  function getTableLength(){
    const table_body = document.getElementsByClassName("datagrid-btable")[0]
    const rows = table_body.rows
    return table_body.rows.length
  }
  function getData(id){
    const table_body = document.getElementsByClassName("datagrid-btable")[0]
    const rows = table_body.rows
    const row = rows[id]
    let ans = {
      id,
    }
    ans.name = row.cells[NAME_IDX].childNodes[0].innerHTML
    // ans.lowest = row.cells[LOWEST_IDX].childNodes[0].innerHTML
    console.log(ans)
    return ans
  }
  function getDefault(id){
    const table_body = document.getElementsByClassName("datagrid-btable")[0]
    const rows = table_body.rows
    const row = rows[id]
    return row.cells[DEFAULT_IDX].childNodes[0].innerHTML
  }
  function getCurrLow(id){
    const table_body = document.getElementsByClassName("datagrid-btable")[0]
    const rows = table_body.rows
    const row = rows[id]
    return row.cells[LOWEST_IDX].childNodes[0].innerHTML
  }
  function getIsLowest(id){
    const table_body = document.getElementsByClassName("datagrid-btable")[0]
    const rows = table_body.rows
    const row = rows[id]
    return row.cells[ISLOWEST_IDX].childNodes[0].childNodes[0].innerHTML
  }
  function fillInput(id,val){
    const table_body = document.getElementsByClassName("datagrid-btable")[1]
    const rows = table_body.rows
    const input = rows[id].cells[INPUT_IDX].childNodes[0].childNodes[0]
    const currLow = getCurrLow(id)
    const dft = getDefault(id)
    console.log('currLow',currLow)
    console.log('dft',dft)
    if (!currLow){
      if (dft >= val){
        input.value = dft
      }
      // input.value = dft
    }else{
      //TODO: CHECK IF CURR LOW IS US
      const islowest = getIsLowest(id)
      // console.log(islowest)
      if ((islowest === '否')&&(parseFloat(currLow) - 0.01 > val)){
        // console.log('yes')
        input.value = parseFloat(currLow) - 0.01
      }
    }
    console.log(input)
  }
  function RemoveChinese(strValue) {  
    if(strValue!= null && strValue != ""){  
        var reg = /[\u4e00-\u9fa5]/g;   
       return strValue.replace(reg, " ");   
    }  
    else  
        return "";  
  } 
  function getCountDown(){
    const cd = document.getElementById('daoJiShi').innerHTML
    const time = RemoveChinese(cd).split(" ")
    const h = parseInt(time[0])
    const m = parseInt(time[1])
    const s = parseInt(time[2])
    const ts = h * 3600 +m * 60 + s 
    console.log(ts)
    sec = ts
    return ts * 1000
  }
  function checkCB(){
    const cb = document.querySelectorAll("input[type='checkbox']")[0]
    cb.checked = true
    console.log(cb)
  }
  function clickSubmitAll(){
    const btn = document.querySelectorAll("span[onclick='allBaoJia()']")[0]
    btn.click()
  }
  
  //event listeners
  document.addEventListener("mousedown", function(event){
    //right click
    console.log("event",event)
    if(event.button == 2) { 
      rc_elem = event.target;
    }
  }, true);

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.msg == "getClickedEl") {
      console.log(rc_elem)
      //parse which button it is
      if (rc_elem.innerHTML !== '提交报价'){
        sendResponse()
        return
      }
      const onclick = rc_elem.getAttribute('onclick')
      const id = onclick.split(',')[1].slice(0,-1)
      //respond to background
      const { name } = getData(id)
      const req = {
        msg: "addEntry",
        id,
        name,
      }
      sendResponse(req);
    }else if(request.msg === 'fillPrice'){
      isBidding = true
      const cd = getCountDown()
      sec = cd/1000
      cdTimer = setInterval(()=>{
        sec --
        if (sec === 0){
          clearInterval(cdTimer)
        }
      },1000)
      chrome.storage.local.get('entries',function(result){
        const entries = result.entries
        
        checkCB()
        console.log(entries)
        timer = setTimeout(()=>{
          timerItv = setInterval(()=>{
            for (const id in entries){
              const { lowestPrice } = entries[id]
              fillInput(id, lowestPrice)
            }
            clickSubmitAll()
          },itvTime)
        },cd - waitTime)
        setTimeout(()=>{
          clearInterval(timerItv)
        },cd)
        
      })
      const reply = {
        sec
      }
      sendResponse(reply)
    }else if (request.msg === 'getAllTableData'){
      const len = getTableLength()
      const entries = {}
      for (var i = 0 ; i < len; i++) {
        const { name } = getData(i)
        entries[i] = {
          id: i,
          name,
        }
      }
      sendResponse(entries)
    }else if (request.msg === 'cancelBidding'){
      console.log('clearTimer')
      clearInterval(timerItv)
      clearTimeout(timer)
      clearInterval(cdTimer)
      isBidding = false
    }else if (request.msg === 'isBidding'){
      const reply = {
        isBidding,
        sec
      }
      sendResponse(reply)
    }
  })
})