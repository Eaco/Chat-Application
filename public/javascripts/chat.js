 $(document).ready(function(){
  var socket = io.connect("/");

  socket.emit('here');
  $('form').submit(function(){
    socket.emit('message', $('#m').val());
    $('#m').val('');
    return false;
      }
  );
 $('#send').click(function () {
         socket.emit('clear');
     }
 );
     socket.on('message', function(msg){
        $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
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