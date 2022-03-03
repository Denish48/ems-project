
var http = require('http');
var ip = require('ip');
var express = require('express');
var WSS = require('ws').Server;

var app = express().use(express.static('public'));
var server = http.createServer(app);

server.listen(8383, ip.address());

var wss = new WSS({ port: 7070 });
wss.on('connection', function (socket) {
     socket.on('error', function(err) {
    console.log('Websocket error!: ' + err);
  });

	console.log("Active Client " + wss.clients.length);
	// console.log('Opened Connection');

	// var json = JSON.stringify({ message: 'Gotcha' });
	// socket.send(json);
	// console.log('Sent: ' + json);
try{
	socket.on('message', function (message) {
		// console.log('Received: ' + message);

		wss.clients.forEach(function each(client) {
			// var json = JSON.stringify({ message: 'Something changed' });
			if(client.readyState != client.OPEN){
                console.log('Client state is ' + client.readyState);
            }
            else{
                // this.clients[i].send(data);
                client.send(message);
            }
// 			client.send(message);
			
			// console.log('Sent: ' + message);
		});
// 		console.log("Active Client " + wss.clients.length);

	});

	socket.on('close', function () {
		// console.log("Active Client " + wss.clients.length);
		// console.log('Closed Connection');
	});
}
catch(err)
{
    console.log(err.message);
}

});

var broadcast = function () {
	var json = JSON.stringify({
		message: 'Hello hello!'
	});

	wss.clients.forEach(function each(client) {
		client.send(json);
		// console.log('Sent: ' + json);
	});
}
// setInterval(broadcast, 3000);
