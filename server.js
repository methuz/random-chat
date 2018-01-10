const express = require('express')
const app = require('express')()
const debug = require('debug')('main')
const fs = require('fs')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const yaml = require('js-yaml')

let config

app.use('/static', express.static('static'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

const waitingList = []
const pairs = {}

function getRoomId (user1, user2) {
  const sortedUsers = [user1, user2].sort()
  return `${sortedUsers[0]}_${sortedUsers[1]}`
}

function joinRoom (user1, user2, roomId) {
  io.sockets.connected[user1].emit('join_room', roomId, user2, user1)
  pairs[user1] = user2
}

io.on('connection', (socket) => {
  /**
   * waiting event triggered from clients to inform server that it's free to join another chat
   * on these situations
   * 1. Newly opened windows
   * 2. It's participant in chat room has left
   * This event will put socket.id to waiting list and check if there are any other available person to chat to if so it will generate roomId then send to client via join_room event for confirmation
   */
  socket.on('waiting', () => {
    waitingList.push(socket.id)
    debug(`User ${socket.id} is waiting`)

    debug('waitingList.length = ', JSON.stringify(waitingList.length, null, 4))
    if (waitingList.length > 1) {
      debug('connecting users')
      const user1 = waitingList.pop()
      const user2 = waitingList.pop()

      const roomId = getRoomId(user1, user2)

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

  /**
   * when user disconnected the server will determined 2 conditions
   * 1. if it's in waiting list, remove it
   * 2. if it's in a conversation, inform it's pair that it has left
   * then remove it from any cache
   */
  socket.on('disconnect', () => {
    debug(`user disconnected`)

    // If left user was in waiting state
    for (let i = 0; i < waitingList.lengh; i++) {
      if (waitingList[i] === socket.id) {
        delete waitingList[i]
        return
      }
    }

    // If left user was in paired room
    const pairUser = pairs[socket.id]

    // pairUser will be missing if the second user also disconnect
    if (pairUser) {
      socket.broadcast.to(getRoomId(socket.id, pairUser)).emit('pair_has_left')
      delete (pairs[pairUser])
    }

    delete (pairs[socket.id])
  })

  /**
   * This is ack signal from client to join a room
   */
  socket.on('join_room_ack', (roomId) => {
    debug('join room', roomId)
    socket.join(roomId)
  })

  /**
   * Private message event to send message to the room it is currently joining
   */
  socket.on('private_message', (data) => {
    debug('data = ', JSON.stringify(data, null, 4))
    socket.broadcast.to(data.room_id).emit('private_message', data.message)
  })
})

// Helpers

/**
 * generate room id for 2 users
 * @param {String} user1 
 * @param {String} user2
 * @return {Number} roomId
 */
function getRoomId (user1, user2) {
  const sortedUsers = [user1, user2].sort()
  return `${sortedUsers[0]}_${sortedUsers[1]}`
}

/**
 * Emit join_room event to user 1 and add to pair list
 * @param {String} user1 
 * @param {String} user2
 * @param {String} roomId
 * @return {Number} roomId
 */
function joinRoom (user1, user2, roomId) {
  io.sockets.connected[user1].emit('join_room', roomId)
  pairs[user1] = user2
}

module.exports = http
