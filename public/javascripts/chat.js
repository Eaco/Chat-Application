 $(document).ready(function(){
  var socket = io.connect("http://chat-bengineering.rhcloud.com:8000");

  socket.emit('here');
  $('form').submit(function(){
    socket.emit('message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('message', function(msg){
      $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
    $('#chatbox').append($('<li>').text(msg));
  });
  socket.on('here', function(){
    $('#chatbox').append($('<li>USER CONNECTED</li>'));
  });
  return false
});