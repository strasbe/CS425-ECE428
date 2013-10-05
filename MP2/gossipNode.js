var port = 8000;
var ipAddr = '0.0.0.6';
var contactNodeIP = '127.0.0.4';
var timeout = 500;
var sendDelay = 100;

var dgram = require('dgram');
var fs = require('fs');

function gossipNode() {
  this.initSocket();
  this.initializeList();
  this.list = {};
  var self = this;

  setInterval(function() {
    self.gossip(ipAddr);
  }, sendDelay);

  this.initialize();

  this.events();
}

gossipNode.prototype = {

  initSocket: function () {
    this.sock = dgram.createSocket('udp4');
    this.sock.bind(port, ipAddr);
  },

  initializeList: function () {
    if(ipAddr != contactNodeIP) {
      // this.gossip(contactNodeIP);
    }

    this.writeToLog(ipAddr, this.getTime(), 'Joined');

  },

  /* All event handling */
  events: function (onlyConnection) {
    var self = this;

    this.sock.on('message', function (msg, rinfo) {
      console.log('recieved: ' + msg + from + rinfo.address + ':' + rinfo.port);
    });

    /* Node attempting to talk to crashed */
    this.sock.on('timeout', function () {
      console.log('Timed Out');
    });
  },

  writeToLog: function (ip, time, status) {
    fs.writeFile("machine.ipAddress", ""+ip+"/"+time+": " + status, function(err) {
        if(err) {
            console.log(err);
        }
    });
  },

  getTime: function () {
    return new Date().getTime();
  },

  gossip: function (ip) {
    var message = new Buffer('hello2');
    this.sock.send(message,0,message.length,port, contactNodeIP, function(err, bytes) {
    });
  },

  sendList: function (ip) {
    console.log('sendList');
  },

  updateList: function(ip, time, status) {
    if(!(ip in this.list)){
      this.list[ip] = {'startTime': time, 'status': status};
    }
    if(this.list[ip].startTime <= time){
      this.list[ip].startTime = time;
      this.list[ip].status = status;
    }
  },

  disconnect: function () {
    this.sock.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var gossipNode = new gossipNode();
}
