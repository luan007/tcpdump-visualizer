'use strict';
const net = require('net');
const fs = require('fs');
const http = require('http');
const request = require('request');
const socketio = require('socket.io');

var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// io.on('connection', function(){ /* … */ });

app.use(require('express').static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendfile(__dirname + "/index.html");
});
app.get("/main.js", (req, res) => {
    res.sendfile(__dirname + "/main.js");
});


server.listen(3000);

var retrying = false;
var prevsrc = undefined;

var hostlist = fs.readdirSync(__dirname + "/hosts");
console.log(hostlist);

const macreg = /(..:..:..:..:..:..) .+ > .+, IPv4, length \d+: (.+) > (.+): tcp/;

function grabfavico(host) {
    host = host.toLowerCase();
    if(hostlist.indexOf(host) >= 0) { return; }
    console.log("GRAB " + host);
    var file = fs.createWriteStream(__dirname + "/hosts/" + host.toString() + ".ico", {flags : "w+"});
    var request = http.get(`http://${host}/favicon.ico`, function(response) {
        response.pipe(file);
    });
    hostlist.push(host);
}

function parse(line) {
    if(line.indexOf("Host:") == 0 && prevsrc) {
        //host
        var host = line.split("Host: ")[1].trim();
        console.log(prevsrc.mac + " [" + prevsrc.src + "] -> " + prevsrc.protocol + "://" + host);
        // grabfavico(host);
        io.emit("host", {
            src: prevsrc,
            host: host    
        });
    }
    else {
        // console.log(line);
        try {
            var match = macreg.exec(line);
            var mac = match[1].trim();
            var src = match[2].substring(0, match[2].lastIndexOf(".")).trim();
            var dst = match[3].substring(0, match[3].lastIndexOf(".")).trim();
            var dstprotocol = match[3].substring(match[3].lastIndexOf(".") + 1).trim().trim();
            prevsrc = {
                mac: mac,
                src: src,
                dst: dst,
                protocol: dstprotocol === "www" ? "http" : dstprotocol
            };
            io.emit("access", prevsrc);
        } catch(e) {
            
        }
    }
}

function connect() {
    console.log("connecting");
    retrying = false;
    var client = net.connect(8888, "192.168.1.1", (socket) => {
        console.log("connected!");
        var t = "";
        client.on("data", function(d){
            t+=d.toString();
            if(t.indexOf("\n") >= 0) {
                var lines = t.split("\n");
                t = lines[lines.length - 1];
                for(var i = 0; i < lines.length - 1; i++) {
                    if(lines[i].trim() == "") continue;
                    parse(lines[i]);
                }
            }
        });
    });
    client.on("error", function (e) {
        console.log(e);
        retry();
    });
    client.on("end", function () {
        retry();
    });
}

function retry() {
    if (retrying) return;
    retrying = true;
    console.log("retrying in 3 sec");
    setTimeout(connect, 3000);
}

connect();