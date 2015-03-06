var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

 app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/chat.html');
});

io.sockets.on('connection', function(socket){
	console.log('connected!!');
	socket.on('here', function(){
		socket.broadcast.emit('here');
	});
	socket.on('message', function(msg){
		io.emit('message', msg);
	});
    socket.on('clear', function () {
        io.emit('clearing');
    })
});

http.listen( server_port, server_ip_address, function(){
    console.log('Listening:*');
});