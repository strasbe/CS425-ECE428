var port = 8000;
var hostName = 'localhost';

var dgram = require('dgram');

function gossipNode() {
  this.initialize();
  this.initSocket();
  this.events();
}

gossipNode.prototype = {
  initialize: function () {

  },

  initSocket: function () {
    this.socket = dgram.createSocket('udp4');
    this.socket.bind(port);
  },

  /* All event handling */
  events: function (onlyConnection) {
    var self = this;

    this.socket.on('data', function (data) {
      data = data.toString('utf-8');
    });

    /* Node attempting to talk to crashed */
    this.socket.on('error', function (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'EPIPE') {
      }

    });
  },

  disconnect: function () {
    this.socket.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var gossipNode = new gossipNode();
}
