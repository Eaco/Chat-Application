var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
    user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
    password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
    database : 'nodesocketapp',\
    socket   : process.env.OPENSHIFT_MYSQL_DB_SOCKET,
    port     : process.env.OPENSHIFT_MYSQL_DB_PORT
});
connection.connect(function(err, conn) {
    if(err) {
        console.log('MySQL connection error: ', err);
        process.exit(1);
    }

});


 app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/chat.html');
});

io.sockets.on('connection', function(socket){
	console.log('connected!!');
    connection.query('SELECT Message FROM `Messages`', function(err, msg){
        for(i = 0; i < msg.length; i++){
            socket.emit('message', msg[i].Message);
        }
    });
	socket.on('newuser', function(){
		socket.broadcast.emit('newuser');
	});
	socket.on('message', function(msg){
		io.emit('message', msg);
		sqlMessage(msg);
	});
    socket.on('clear', function () {
        io.emit('clearing');
        clearSql();
    })
});

function sqlMessage(msg) {
    msg.replace("'", "\'");
    msg.replace("\\", "\\\\")
    connection.query('INSERT INTO `Messages`(`Time`, `Message`) VALUES ( NOW(), \'' + msg + '\')', function(err, rows, fields){
        if(err) throw err;
    });
}

function clearSql(){
    connection.query('DELETE FROM `Messages` WHERE 1', function(err, rows, fields){
        if(err) throw err;
    });
}

http.listen( server_port, server_ip_address, function(){
    console.log('Listening:*');
    connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields){
        if(err) throw err;

        console.log(rows[0].solution);
    });
});
