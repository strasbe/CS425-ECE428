var port = 8000;
var ipAddr = '0.0.0.5';
var contactNodeIP = '127.0.0.4';

var hostName = 'localhost';

var dgram = require('dgram');

function gossipNode() {
  this.initSocket();
  this.initialize();
  // this.events();
}

gossipNode.prototype = {
  initSocket: function () {
    this.socket = dgram.createSocket('udp4');
    this.socket.bind(port, ipAddr);
  },

  initializeList: function () {
    if(ipAddr != contactNodeIP) {
      gossip(contactNodeIP);
    }

    writeToLog(ipAddr, getTime(), 'Joined');

  },

  /* All event handling */
  events: function (onlyConnection) {
    var self = this;

    this.socket.on('message', function (msg, rinfo) {
      console.log('recieved: ' + msg + from + rinfo.address + ':' + rinfo.port);
    });

    /* Node attempting to talk to crashed */
    this.socket.on('error', function (err) {

      /* Machine Attempted to talk to has crashed */
      if (err.code === 'ECONNREFUSED' || err.code === 'EPIPE') {

      }

    });
  },

  writeToLog: function (ip, time, status) {

  },

  getTime: function () {

  },

  gossip: function (ip) {

  },

  sendList: function (ip) {

  },

  updateList: function(ip, time, status) {

  },

  disconnect: function () {
    this.socket.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var gossipNode = new gossipNode();
}
