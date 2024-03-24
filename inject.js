//let el = document.createElement("script");
//el.src = chrome.runtime.getURL("wshook.js");
//document.documentElement.appendChild(el);

let ell = document.createElement("script");
ell.src = chrome.runtime.getURL("content2.js");
document.documentElement.appendChild(ell);
