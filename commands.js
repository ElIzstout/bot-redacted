const https = require('https');
const ws = require('ws');
const fs = require('fs');
const cheerio = require('cheerio');

function createcommand(guild){
    var testcommand = makeJSON('./commands/commands.json');
    testcommand = JSON.stringify(testcommand);
    const options = {
            "method":"POST",
            "hostname":"discord.com",
            "path":"/api/applications/740951821350207508/guilds/"+guild+"/commands",
            "headers":{
                "Authorization":"",
                "content-Type": "application/json",
                "content-length":testcommand.length
            }
        }

    const sendcommands = https.request(options, (res)=>{
        console.log("res");
        console.log(res.statusCode);
    });
    console.log("here");
    sendcommands.write(testcommand,(err)=>{console.log(err)});
    sendcommands.end();
}
function deletecommand(guild,id){
    var adddata;
    const options = {
        "method":"DELETE",
        "hostname":"discord.com",
        "path":"/api/applications/740951821350207508/guilds/"+guild+"/commands/"+id,
        "headers":{
            "Authorization":"",
        }
    }
    const deletecomm = https.request(options, (res)=>{
        console.log(res.statusCode);
    });
    deletecomm.end(()=>{
        
    });
}
function getcommands(guild){
    var adddata;
    const options = {
        "method":"GET",
        "hostname":"discord.com",
        "path":"/api/applications/740951821350207508/guilds/"+guild+"/commands",
        "headers":{
            "Authorization":"",
        }
    }
    const getcomms = https.request(options, (res)=>{
        console.log(res.statusCode);
        res.on("data", (d) => {
           console.log(d.toString());
          });
        console.log(adddata);
    });
    getcomms.end(()=>{
        
    });
}
function modifyperms(guild,id,role,allow){
    var permissions={
        "permissions": [
            {
                "id": role,
                "type": 1,
                "permission": allow
            }
        ]
    }
    permissions=JSON.stringify(permissions);
    const options = {
        "method":"PUT",
        "hostname":"discord.com",
        "path":"/api/applications/740951821350207508/guilds/"+guild+"/commands/"+id+"/permissions",
        "headers":{
            "Authorization":"",
            "content-Type": "application/json",
            "content-length":permissions.length
        }
    }
    
    const modcommmand = https.request(options, (res)=>{
        console.log(res.statusCode);
    });
    modcommmand.write(permissions);
    modcommmand.end(()=>{
        });
}
//getcommands("846164529686773770");
//deletecommand("846164529686773770","855463315043909652");
//createcommand("846164529686773770");


//util
function makeJSON(path){
    let rawd = fs.readFileSync(path);
    return JSON.parse(rawd);
}