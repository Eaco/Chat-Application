$(document).ready(function() {
	var socket = io.connect("/");

	socket.emit('here');
	$('form').submit(function(){
		if ($('#m').val().length > 0) socket.emit('message', $('#m').val());
		$('#m').val('');
	});
	$('#send').click(function () {
		socket.emit('clear');
	});
	socket.on('message', function(msg){
		var chat = document.getElementById("chatbox");
		var isAtBottom = (chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 4);
		
		$('#chatbox').append($('<div>').html($('<p>').text(msg)));
		
		if (isAtBottom) chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	});
	socket.on('here', function(){
		$('#chatbox').append($('<p>USER CONNECTED</p>'));
	});
	socket.on('clearing', function () {
		$('#chatbox').empty();
	});
	return false
});