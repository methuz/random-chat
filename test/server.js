const request = require('supertest');
const io = require('../node_modules/socket.io-client')
const async = require('async')
const assert = require('assert')
const fs = require('fs');
const path = require('path');
const sinon = require('sinon')
const expect = require('chai').expect;
const yaml = require('js-yaml');
const _ = require('underscore');

let config
try {
  config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/../config.yml'), 'utf8'));
} catch (e) {
  console.log(e);
}
const ioOptions = {
  transports: ['websocket']
}

describe('Random Chat', function() {
  var server;
  before(function() {
    const http = require('../server');
    server = http.listen(config.testport, () => {
      console.log(`listening on port ${config.testport}`)
    })
  });
  after(function() {
    server.close();
  });

  describe('Path', function() {
    it('responds to /', function testSlash(done) {
      request(server)
        .get('/')
        .expect(200, done);
    });
  })

  describe('Simple random', function() {
    let sender,
      receiver;

    beforeEach(function(done) {
      sender = io(`http://localhost:${config.testport}/`, ioOptions)
      receiver = io(`http://localhost:${config.testport}/`, ioOptions)
      done()
    })
    it('should connect to server', function(done) {
      sender.emit('waiting');
      receiver.emit('waiting');
      sender.on('join_room', function() {
        done()
      })
    })

    it('should connect to the same room', function(done) {
      let senderSpy = sinon.spy();
      let receiverSpy = sinon.spy();

      sender.on('join_room', senderSpy)
      receiver.on('join_room', receiverSpy)

      sender.emit('waiting');
      receiver.emit('waiting');

      setTimeout(function() {
        sinon.assert.calledOnce(senderSpy);
        sinon.assert.calledOnce(receiverSpy);
        assert(_.isEqual(senderSpy.args[0], receiverSpy.args[0]))
        done()
      }, 500)
    })

    it('should send private direct message', function(done) {
      const privateMessage = 'secret'

      receiver.on('private_message', function(message) {
        assert(privateMessage === message)
        done()
      })

      sender.on('join_room', function(_roomId) {
        sender.emit('join_room_ack', _roomId)

        setTimeout(function() {
          sender.emit('private_message', {
            room_id: _roomId,
            message: privateMessage
          })
        }, 1000)
      })

      receiver.on('join_room', function(_roomId) {
        receiver.emit('join_room_ack', _roomId)
      })

      sender.emit('waiting');
      receiver.emit('waiting');

    })

    it('should get pair_has_left event', function(done) {
      receiver.on('pair_has_left', function() {
        done()
      })

      receiver.on('join_room', function(_roomId) {
        receiver.emit('join_room_ack', _roomId)
      })

      sender.on('join_room', function(_roomId) {
        sender.emit('join_room_ack', _roomId)

        setTimeout(function() {
          sender.disconnect()
        }, 500)
      })

      sender.emit('waiting');
      receiver.emit('waiting');
    })

    afterEach(function(done) {
      sender.disconnect()
      receiver.disconnect()
      done()
    })
  })
  describe('Complex random chat', function() {
    let sender,
      receiver;

    before(function(done) {
      sender1 = io(`http://localhost:${config.testport}/`, ioOptions)
      receiver1 = io(`http://localhost:${config.testport}/`, ioOptions)
      sender2 = io(`http://localhost:${config.testport}/`, ioOptions)
      receiver2 = io(`http://localhost:${config.testport}/`, ioOptions)
      done()
    })
    it('Sender 1 should send message to reciever 2 after sender 2 and receiver1 left', function(done) {

      const privateMessage = 'secret'

      receiver2.on('private_message', function(message) {
        assert(privateMessage === message)
        done()
      })

      sender1.on('join_room', function(_roomId) {
        sender1.emit('join_room_ack', _roomId)
        setTimeout(function() {
          sender1.emit('private_message', {
            room_id: _roomId,
            message: privateMessage
          })
        }, 500)
      })

      sender2.on('join_room', function(_roomId) {
        sender2.emit('join_room_ack', _roomId)
        setTimeout(function() {
          sender2.disconnect()
        }, 500)
      })
      receiver1.on('join_room', function(_roomId) {
        receiver1.emit('join_room_ack', _roomId)
        setTimeout(function() {
          receiver1.disconnect()
        }, 500)
      })

      receiver2.on('join_room', function(_roomId) {
        receiver2.emit('join_room_ack', _roomId)
      })

      sender1.on('pair_has_left', function() {
        sender1.emit('waiting')
      })
      receiver2.on('pair_has_left', function() {
        receiver2.emit('waiting')
      })

      sender1.emit('waiting');
      receiver1.emit('waiting');
      sender2.emit('waiting');
      receiver2.emit('waiting');
    })

    after(function(done) {
      sender1.disconnect()
      receiver2.disconnect()
      done()
    })
  })
});
