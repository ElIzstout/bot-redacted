const https = require('https');
const ws = require('ws');
const fs = require('fs');
const cheerio = require('cheerio');

//<-------------------options----------------------------------->
var wsconnectionstate;
const options= makeJSON("./options.json");
const getendpointoptions = options.endpointoptions;
const identify = options.identify;
var heartbeat = options.heartbeat;
var endpoint;
var gateway; 
const cheese = makeJSON('cheeses.json');
var cheesedescript= "failed";
const feet={
    "content":"<:feett:846199035403436042>"
}
var resumeopts = {
    "op": 6,
    "d": {
      "token": "",
      "session_id": "",
      "seq": 1
    }
}
var randch='';
var churl;
var isconnected;
var cheesedescriptjs;
//<------------ws garbage--------------------------------------->

const getendpoint = https.request(getendpointoptions,(wsendres)=>{handleWsEnd(wsendres)}); 
getendpoint.end();

function handleWsEnd(wsendresponse){ //gets data from WS endpointresponse
    let tempdata = "";
    wsendresponse.on('data',(wsdata)=>{
        console.log(wsdata);
        if(wsdata !== undefined){
            console.log("notfianl   "+wsdata.toString())
            tempdata += wsdata.toString(); 
            
        }
        console.log("fianl   " + tempdata);
    });

    wsendresponse.on('end',()=>{
        console.log('ws endpoint request ended');
        endpoint= JSON.parse(tempdata.toString());
        console.log('received endpoint: \n'+JSON.stringify(endpoint));
        createwebsocket(endpoint,false);
    });

} 

function createwebsocket(endpoint,doresume){
    let endpointurl = endpoint.url +="/?v=9&encoding=json";
    gateway= new ws(endpointurl);
    gateway.on('open',()=>{
        wsconnectionstate=true;
        if(doresume==true){
            gateway.send(JSON.stringify(resumeopts),()=>{console.log("attempting resume")});
        }
    })
    gateway.on('close',()=>{
        wsconnectionstate = false;
    });
    gateway.on('message',(GWmessage)=>GWmessagehandler(GWmessage));
    gateway.on('pong',(d)=>{console.log('pong'+JSON.stringify(JSON.parse(d)))});
}

function GWmessagehandler(GWmessage){
    let ms=JSON.parse(GWmessage);
    
    if(ms.op==0 && ms.t=="resumed"){
        console.log(" RESUME SUCCESSFULL");
    }
    if(ms.op==0 && ms.t=="ready"){
        console.log("### op:"+ms.op+" ID:"+ms.d.session_id+" ###");
        resumeopts.d.session_id= ms.d.session_id

    }
    if(ms.op==0){//incoming server message
        resumeopts.d.seq=ms.s; //for resume
        heartbeat.d= ms.s;     //for HB
        console.log('sequence change to: '+heartbeat.d);
        mainloop(ms.d,ms.t);

    }
    if(ms.op==1){// E-Pong
        console.log('EMERGENCY PONG');
        gateway.send(JSON.stringify(heartbeat),()=>console.log("ping"));

    }
    if(ms.op==10){//didlypach 
        gateway.send(JSON.stringify(identify));
        console.log(JSON.stringify(ms));
        timeheartbeat(ms.d.heartbeat_interval);
    }
    if(ms.op==11){//pong
        isconnected=true;
        console.log('pongd');

    }
    
}
function timeheartbeat(time){
    setTimeout(()=>{
        gateway.send(JSON.stringify(heartbeat),()=>console.log("ping"));
        isconnected=false;
        setTimeout(()=>{
            if(isconnected==false){
                console.log("############ gateway disconected ###############");
                try{
                    if(wsconnectionstate==true){
                        gateway.terminate();
                        console.log("terminated");
                    }
                    else{
                        console.log("error: WS is closed already");
                    }
                }
                catch(err){
                    console.log("error in termination:");
                    console.log(err)
                }
                
                try{
                    if(wsconnectionstate==true){
                    createwebsocket(endpoint,true);
                    console.log("successfull in regular resuming");
                    }
                    else{
                        throw "error:noresume"
                    }
                }catch(err){
                    console.log('attempting failed:');
                    if(wsconnectionstate==true){
                        gateway.terminate();
                        console.log("gateway terminated");
                    }
                    console.log(err);
                    console.log("force resuming in 10 seconds");
                    setTimeout(()=>{  
                        createwebsocket(endpoint,false);
                    },100000);
                }
            }
        },2000)
        timeheartbeat(time);
    },time);
    
}
//<--------------------------bot functs------------>

function mainloop(data,type){
    if(type=="INTERACTION_CREATE"){
        console.log(data.data);

        // for /cheesegen
        if(data.data.id=="855464356360093726"){
            randch='';
            randch += randint(1,1831);
            fs.writeFileSync('cheesenum.txt',randch);
            churl=cheese[randch];
            console.log(randch+": "+churl);
            getcheese(churl,data);
            let rescontent={
                "content":randch+": "+churl
            };
            sendinteractionresponse(data,rescontent);
        }

        // for /cheese
        if(data.data.id=="855443203666346064"){
            //get stuff
            randch=fs.readFileSync('cheesenum.txt');
            churl=cheese[randch];
            console.log(randch+": "+churl);
            getcheese(churl,data);
            
            sendinteractionresponse(data,cheesedescriptjs);
        }
    }
    
    
    if(data.author&&data.author.id!=='740951821350207508'){ //prevents self responses
        //for feet
        if(data.author.id=='312972740569202700'){
            console.log(data.content);
            sendmessage(data.channel_id,feet);
        }
       
        
    }
}

function getcheese(url,data){

    var cheeserequest = https.request(url,(res)=>{
        let maindata;
        res.on('data',(d)=>{
            maindata+=d;
        });
        res.on('end',()=>{
            let $ = cheerio.load(maindata);
            let cheeseoftheday = $('h1').text();
            if($(".description").text()!==null){
                cheesedescript = $(".description").text();
            }
            let cheesedescriptstring='['+cheeseoftheday+']('+url+')\n'+cheesedescript;
            cheesedescriptjs ={
                "content":"",
                "tts":false,
                "embeds":[{
                    "title":"cheese of the day: "+cheeseoftheday,
                    "description":cheesedescriptstring
                }]
            }
            
        });
    });
    cheeserequest.end();
    
}
//responses
function sendinteractionresponse(data,responsecontent){
    //create response
    var interactionresponse={
        "type": 4,
        "data": {
            "content": "fuck you"
        }
    }
    if(responsecontent !==undefined){
        interactionresponse.data=responsecontent;
        console.log("interactions res:");
        console.log(JSON.stringify(interactionresponse));
    }
    interactionresponse= JSON.stringify(interactionresponse);
    console.log(interactionresponse.length);
    //options for https req
    let options = {
        "method":"POST",
        "hostname":"discord.com",
        "path":"/api/interactions/"+data.id+"/"+data.token+"/callback",
        "headers":{
            "Authorization":"",
            "Content-Type": "application/json",
            
        }
    }
    
    const createinteraction = https.request(options,(res)=>{
        console.log(res.statusCode)
        if(res.statusCode==400){
            res.on('data',(d)=>{
                console.log(d.toString());

            })
        }
    });
    
    createinteraction.write(interactionresponse);
    createinteraction.end();
}
function sendmessage(channel,content){

    let messageurl= "/api/channels"+"/"+channel+"/messages";
    let messagecontent=content;

    messagecontent=JSON.stringify(messagecontent);
    let messageopts ={
        "method":"POST",
        "hostname":"discord.com",
        "path":messageurl,
        "headers":{
            "Authorization":"",
            "content-Type": "application/json",
            "content-length":messagecontent.length
        }
    }
    
    let message= https.request(messageopts);
    message.write(messagecontent);
    message.end();
}

//<---------------------------util------------------>
function randint(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
function makeJSON(path){
    let rawd = fs.readFileSync(path);
    return JSON.parse(rawd);
}

