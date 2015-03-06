$(document).ready(function() {
	var socket = io.connect("/");

	socket.emit('here');
	$('form').submit(function(){
		socket.emit('message', $('#m').val());
		$('#m').val('');
		return false;
	});
	$('#butt').click(function () {
		socket.emit('clear');
	});
	socket.on('message', function(msg){
		var chat = document.getElementById("chatbox");
		if (chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 4) chat.scrollTop = chat.scrollHeight - chat.clientHeight;
		
		$('#chatbox').append($('<p>').text(msg));
	});
	socket.on('here', function(){
		$('#chatbox').append($('<p>USER CONNECTED</p>'));
	});
	socket.on('clearing', function () {
		$('#chatbox').empty();
	});
	return false
});