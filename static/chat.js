var myId;
var receiverId;
var roomId;
$(function() {
  var socket = io();

  socket.emit('waiting');
  $('#send').click(sendMessage);
  $('#m').on('keypress', function(e) {
    if (e.which === 13) sendMessage()
  })
  socket.on('join_room', function(_roomId, _myId, _receiverId) {
    console.log(_roomId)
    myId = _myId
    receiverId = _receiverId
    roomId = _roomId
    console.log(roomId)
    $('#messages').append(getJoinChatHTML(receiverId))
    $('#m').prop('disabled', false)
    socket.emit('join_room_ack', _roomId)
    console.log('join room', _roomId)
  });

  socket.on('private_message', function(message) {
    $('#messages').append(getChatHTML(message, 'left'));
    scrollToBottom();
  });

  socket.on('reconnect', function(client) {
    console.log('reconnect');
    socket.emit('waiting');
    $('#m').prop('disabled', true)
  })

  socket.on('pair_has_left', function() {
    console.log('pair has left, waiting');
    socket.emit('waiting');
    $('#m').prop('disabled', true)
    $('#messages').append(getLeftChatHTML(receiverId))
  })

  function scrollToBottom() {
    $('#divText').scrollTop($('#divText')[0].scrollHeight);
  }

  function getJoinChatHTML(userId) {
    return '<li><div class="leave-chat"><p>user: ' + userId + ' has join chat.</p></div></li>';
  }
  function getLeftChatHTML(userId) {
    return '<li><div class="join-chat"><p>user: ' + userId + ' has left chat.</p></div></li>';
  }
  function getChatHTML(text, position) {
    return '<li><div class="' + position + '-chat"><p>' + text + '</p> <span>' + moment().format('hh:mm a') + '</span></div></li>';
  }
  function sendMessage() {
    //Append to one's own chat log
    var message = $('#m').val()
    if (message === '') return
    console.log('send to roomId = ', JSON.stringify(roomId, null, 4));
    socket.emit('private_message', {
      room_id: roomId,
      message: message
    });
    $('#messages').append(getChatHTML(message, 'right'));
    scrollToBottom();
    // Reset
    $('#m').val('');
    return false;
  }
});
