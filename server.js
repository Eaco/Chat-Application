#!/bin/env node
 // Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var mongoose = require('mongoose');
var connectionString = connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
process.env.OPENSHIFT_APP_NAME;

mongoose.connect(connectionString);

var Message = mongoose.model('Message', { User: String, content: String});

server.listen(server_port, server_ip_address, function() {
    console.log('Server listening at port %d at address %s', server_port, server_ip_address);

});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// users which are currently connected to the application/chat room
var usernames = {}; //dont find much use
var numUsers = {};

io.on('connection', function(socket) {
    var addedUser = false;
    //console.log(socket);

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(user) {
        console.log(user);

        // we store the user info in the socket session for this client
        socket.username = user.username;
        socket.usernamecolor = user.usernamecolor;
        socket.room = user.room;

        socket.join(socket.room);
        console.log(numUsers[socket.room]);
        numUsers[socket.room] = ++numUsers[socket.room] || 1;
        console.log(numUsers[socket.room]);
        addedUser = true;

        socket.emit('enter room', {
            numUsers: numUsers[socket.room],
            room: socket.room
        });
        // echo globally (all clients) that a person has connected
        socket.to(socket.room).emit('user joined', {
            username: socket.username,
            usernamecolor: socket.usernameColor,
            numUsers: numUsers[socket.room]
        });
    });
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function(data) {
        console.log(data);
        // we tell the client to execute 'new message'
        var message = new Message({user:socket.username, content:data.message});
        message.save(function (err) {
            if (err) // ...
                console.log('Failed to save message in DB, sending to room...' + err);
        });
        socket.to(socket.room).emit('new message', {
            username: socket.username,
            usernamecolor: socket.usernamecolor,
            message: data.message,
            timestamp: data.timestamp
        });
    });
    // when the client emits 'set room', this listens and executes
    socket.on('change room', function(room) {
        //console.log(room);
        socket.leave(socket.room);
        numUsers[socket.room] = --numUsers[socket.room];
        //tell others in old room xx left
        socket.to(socket.room).emit('user left', {
            username: socket.username,
            numUsers: numUsers[socket.room]
        });

        socket.room = room;
        socket.join(room);
        numUsers[socket.room] = ++numUsers[socket.room] || 1;
        //tell xx info about the new room
        socket.emit('enter room', {
            numUsers: numUsers[socket.room],
            room: socket.room
        });
        //tell others in new room xx join
        socket.to(socket.room).emit('user joined', {
            username: socket.username,
            usernamecolor: socket.usernameColor,
            numUsers: numUsers[socket.room]
        });

    });
    // when the client emits 'typing', we to(socket.room) it to others
    socket.on('typing', function() {
        socket.to(socket.room).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we to(socket.room) it to others
    socket.on('stop typing', function() {
        socket.to(socket.room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        console.log("user left");
        // remove the username from global usernames list
        if (addedUser) {
            //delete usernames[socket.username];
            numUsers[socket.room] = --numUsers[socket.room];

            // echo globally that this client has left
            socket.to(socket.room).emit('user left', {
                username: socket.username,
                numUsers: numUsers[socket.room]
            });
        }
    });
});