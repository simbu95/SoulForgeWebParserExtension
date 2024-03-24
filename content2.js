/* eslint-disable no-proto */
/* eslint-disable accessor-pairs */
/* eslint-disable no-global-assign */

/* wsHook.js
 * https://github.com/skepticfx/wshook
 * Reference: http://www.w3.org/TR/2011/WD-websockets-20110419/#websocket
 */

var wsHook={};!function(){function t(t){this.bubbles=t.bubbles||!1,this.cancelBubble=t.cancelBubble||!1,this.cancelable=t.cancelable||!1,this.currentTarget=t.currentTarget||null,this.data=t.data||null,this.defaultPrevented=t.defaultPrevented||!1,this.eventPhase=t.eventPhase||0,this.lastEventId=t.lastEventId||"",this.origin=t.origin||"",this.path=t.path||[],this.ports=t.parts||[],this.returnValue=t.returnValue||!0,this.source=t.source||null,this.srcElement=t.srcElement||null,this.target=t.target||null,this.timeStamp=t.timeStamp||null,this.type=t.type||"message",this.__proto__=t.__proto__||MessageEvent.__proto__}var e=wsHook.before=function(t,e,n){return t},n=wsHook.after=function(t,e,n){return t},s=wsHook.modifyUrl=function(t){return t};wsHook.resetHooks=function(){wsHook.before=e,wsHook.after=n,wsHook.modifyUrl=s};var r=WebSocket;WebSocket=function(e,n){e=wsHook.modifyUrl(e)||e,this.url=e,this.protocols=n;var s,o=(s=this.protocols?new r(e,n):new r(e)).send;return s.send=function(t){arguments[0]=wsHook.before(t,s.url,s)||t,o.apply(this,arguments)},s._addEventListener=s.addEventListener,s.addEventListener=function(){var e,n=this;return"message"===arguments[0]&&(arguments[1]=(e=arguments[1],function r(){arguments[0]=wsHook.after(new t(arguments[0]),s.url,s),null!==arguments[0]&&e.apply(n,arguments)})),s._addEventListener.apply(this,arguments)},Object.defineProperty(s,"onmessage",{set:function(){var e=this,n=arguments[0],r=function(){arguments[0]=wsHook.after(new t(arguments[0]),s.url,s),null!==arguments[0]&&n.apply(e,arguments)};s._addEventListener.apply(this,["message",r,!1])}}),s}}();

// Make sure your program calls `wsClient.onmessage` event handler somewhere.
wsHook.after = function(messageEvent, url, wsObject) {
	try {
		parseData(messageEvent)//console.log("Received message from " + url + " : " + messageEvent.data);
	} catch (error) {
        console.error(error);
		// Expected output: ReferenceError: nonExistentFunction is not defined
		// (Note: the exact output may be browser-dependent)
	}
    return messageEvent;
}

LocationDataArray = {};
HitData = [];
lastBlob = null;

function parseData(message) {
	if (message['data'].length <= 1) {
		return
	}
	data_json = JSON.parse(message['data'])
	if(!data_json['data']) {
		return
	}
	sub_data = data_json['data']
	//if type(sub_data) is not dict:
	//	return

	// sometimes the data comes with another level of nesting, so we unnest
	if (sub_data['code'] && sub_data['data']){// and type(sub_data['data']) is dict:
		sub_data = sub_data['data']
	}

	if (sub_data['spacing']!= undefined && sub_data['id'] != undefined) {
		parse_as_node_obj(sub_data);
	}
    
    if (sub_data['type']!= undefined && sub_data['type'] == "s" && sub_data['floaties'] != undefined) {
		HitData.push(sub_data['floaties']);
	}
}
async function hash(string) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', string);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

function parse_as_node_obj(message_data){
	location_id = message_data['id'];
	if(!LocationDataArray[location_id] && message_data['indoors'] == undefined){ // Maybe add indoors to data, and somehow like to structures? seems like a pain. 
		const myRequest = new Request(`/api/locationGFX/${location_id}`);
		fetch(myRequest)
		.then((response) => response.blob())
		.then((myBlob) => {
            lastBlob = myBlob;
            var a = new FileReader();
            a.readAsArrayBuffer(myBlob);
            a.onloadend = function () {
                let hashPromise = hash(a.result);// it outputs a promise
                hashPromise.then((hash) => {
                    fetch("https://149.76.213.199/SubmitNodeData", { 
                        method: "POST",
                        body: JSON.stringify({"id" : location_id, "hash": hash}),
                        headers: {
                            "Content-type": "application/json; charset=UTF-8",
                        }
                    }).then(response => response.json())
                    .then(data => {
                        if(data == "NEED"){
                            let formData = new FormData();
                            formData.append("ufile", lastBlob, location_id + '.jpg');   
                            fetch("https://149.76.213.199/uploadLink", { 
                                method: "POST",
                                body: formData
                            })
                        }
                    })
                });
            };
		});
	}
	LocationDataArray[location_id] = {'PATHS' : message_data['paths']};
}
