const request = require('supertest');
const io = require('../node_modules/socket.io-client')
const async = require('async')
const assert = require('assert')
const sinon = require('sinon')
const expect = require('chai').expect;
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
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
    server = require('../server');
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

  describe('Socket.io', function() {
	console.log(config.port)
	let sender, receiver;

	beforeEach(function(done) {
      sender = io(`http://localhost:${config.port}/`, ioOptions)
      receiver = io(`http://localhost:${config.port}/`, ioOptions)
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


    afterEach(function(done) {
      sender.disconnect()
      receiver.disconnect()
      done()
    })
  })
});
