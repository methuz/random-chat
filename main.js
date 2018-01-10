const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

io.on('connection', function (socket) {
  console.log('a user connected')
  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', msg)
    console.log('message: ' + msg)
  })
})

http.listen(3000, function () {
  console.log('listening on *:3000')
})
