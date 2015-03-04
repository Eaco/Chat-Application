var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

 app.use(express.static(__dirname + '/public'));

app.use('/static', express.static(__dirname + '/public'));
app.use("/scripts", express.static(__dirname + '/public/javascripts'));
app.use("/images",  express.static(__dirname + '/public/images'));

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
});


http.listen(3000, function(){
	console.log('listening on *:3000')
});