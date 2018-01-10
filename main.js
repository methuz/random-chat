const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const debug = require('debug')('main')

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

const waitingList = []
const pairs = {}

function joinRoom(user1, user2, roomId) {
  io.sockets.connected[user1].emit('join room', roomId)
  pairs[user1] = {
    to: user2,
    room_id: roomId
  }
}

io.on('connection', (socket) => {
  socket.on('waiting', () => {
    waitingList.push(socket.id)
    debug(`User ${socket.id} is waiting`)

    debug('waitingList.length = ', JSON.stringify(waitingList.length, null, 4))
    if (waitingList.length > 1) {
      debug('connecting users')
      const user1 = waitingList.pop()
      const user2 = waitingList.pop()

      const sortedUsers = [user1, user2].sort()
      const roomId = `${sortedUsers[0]}_${sortedUsers[1]}`

      // In case that some user disconnect immediately after joining it might cause problem
      if (!io.sockets.connected[user1]) {
        waitingList.push(user2)
      } else if (!io.sockets.connected[user2]) {
        waitingList.push(user1)
      } else {
        joinRoom(user1, user2, roomId)
        joinRoom(user2, user1, roomId)
      }
    }
  })

  debug(`User ${socket.id} connected`)

  socket.on('disconnect', () => {
    debug(`user disconnected`)
	
	// If in waiting state
	for (let i = 0; i < waitingList.lengh; i++) {
		if (waitingList[i] === socket.id) {
			delete waitingList[i]
			return;
		}
	}

    // If in paired room
	const pairData = pairs[socket.id]
	// pairData will be missing if the second user also disconnect
	if (Object.hasOwnProperty(pairData, 'to')) {
  		io.sockets.connected[pairData.to].emit('another user left')
	}
  })

  socket.on('join room', (roomId) => {
    debug('join room', roomId)
    socket.join(roomId)
  })

  socket.on('private message', (data) => {
    debug('data = ', JSON.stringify(data, null, 4))
    socket.broadcast.to(data.room_id).emit('private message', data.message)
  })

  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg)
    debug('message: ' + msg)
  })
})

http.listen(3000, () => {
  debug('listening on port 3000')
})
