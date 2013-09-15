var util = require('util'),
    net = require('net'),
    EventEmitter = require('events').EventEmitter;

function MockMaster(port) {
	var self = this;
  this.port = port;
  var server = net.createServer(function (connection) {
    connection.on('data', function (data) {
      self.emit('Slave Data', data);
    });
  });

  server.listen(port, function () {
    self.emit('Listening');
  });
};

util.inherits(MockMaster, EventEmitter);

module.exports = MockMaster;
