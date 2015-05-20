$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms

    // Initialize varibles
    var $window = $(window);
    var $usernameInput = $('#usernameInput'); // Input for username
    //var $roomInput = $('.roomInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $("#inputMessage"); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    var $chatRoomInput = $('#chatRoomList'); // The input for chatroom selection i.e dropdown
    var $setChatRoom = $('#setChatRoom'); //The trigger/button for setting chatroom

    // Prompt for setting a username
    var c_username;
    var c_room = 'lobby'; //default chat room
    var c_usernameColor = getusernameColor();
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    //starts
    var socket = io();

    // Sets the client's username
    function setusername() {
        c_username = cleanInput($usernameInput.val().trim());

        // If the username is valid
        if (c_username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('add user', {
                username: c_username,
                usernamecolor: c_usernameColor,
                room: c_room
            });
        }
    }

    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        log(message);
    }



    // Sends a chat message
    function sendMessage() {
        var Message = $inputMessage.val();
        // Prevent markup from being injected into the message
        Message = cleanInput(Message);
        Timestamp = getTimeStamp();
        // if there is a non-empty message and a socket connection
        if (Message && connected) {
            $inputMessage.val('');
            addChatMessage({
                username: c_username,
                usernamecolor: c_usernameColor,
                message: Message,
                timestamp: Timestamp,
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', {
                message: Message,
                timestamp: Timestamp
            });
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(data.username + ':')
            .css('color', data.usernamecolor);
        var $messageTimeDiv = $('<span class="messageTime">')
            .text(data.timestamp);
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($messageTimeDiv, $usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }

    // Updates the typing event
    function updateTyping() {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function() {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function(i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getusernameColor() {
        // Compute random color
        // use Wes Johnson's implementation of Martin Ankerl's method
        var color = new RColor;
        return color.get(true);
    }

    // Gets the timestamp of the message
    function getTimeStamp() {
        //var time = Math.floor(Date.now() / 1000);
        var date = new Date(Date.now());
        var h = addZero(date.getHours());
        var m = addZero(date.getMinutes());
        var s = addZero(date.getSeconds());
        return '[' + h + ':' + m + ':' + s + ']';
    }

    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function clearMessage() {
        $messages.empty();
    }
    // Keyboard events

    $window.keydown(function(event) {
        // Auto-focus the current input when a key is typed
        // TODO: remove this later since we will have more than one place asking for input
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }

        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (c_username) {
                //this is the chat page
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                //this is the login page
                setusername();
            }
        }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.click(function() {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function() {
        $inputMessage.focus();
    });

    //update client room choices
    /*$setChatRoom.click(function() {
        c_room = $chatRoomInput.val();
        clearMessage();
        socket.emit('change room', c_room);
    });*/
	$('.chatRoom').on('click', function() {
		c_room = $(this).data("id");
        clearMessage();
        socket.emit('change room', c_room);
	});

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('enter room', function(data) {

        connected = true;
        // Display the welcome message
        var message = "Welcome to Socket.IO Chat – " + data.room;
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(data) {
        addChatMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function(data) {
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function(data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function(data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function(data) {
        removeChatTyping(data);
    });
});