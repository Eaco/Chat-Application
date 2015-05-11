// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : process.env.OPENSHIFT_MYSQL_DB_HOST||'localhost',
    user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME||'root',
    password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD||'',
    database : 'SocketChat',
    socket   : process.env.OPENSHIFT_MYSQL_DB_SOCKET,
    port     : process.env.OPENSHIFT_MYSQL_DB_PORT||3306
});

connection.connect(function(err, conn) {
    if(err) {
        console.log('MySQL connection error: ', err);
        process.exit(1);
    }

});

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields){
        if(err) throw err;
        console.log(rows[0].solution);
    });

server.listen( server_port, server_ip_address, function(){
    console.log('Server listening at port %d at address %s', server_port, server_ip_address);

});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    console.log(data);
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      usernamecolor: socket.usernamecolor,
      message: data.message,
      timestamp: data.timestamp
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (user) {
    console.log(user);
    // we store the username in the socket session for this client
    socket.username = user.username;
    socket.usernamecolor = user.usernamecolor;
    // add the client's username to the global list
    usernames[user.username] = user.username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      usernamecolor: socket.usernameColor,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
