var port = 8000;
var ipAddr = '127.0.0.4';//'0.0.0.6';
var contactNodeIP = '127.0.0.4';
var timeout = 500;
var sendDelay = 100;
var dgram = require('dgram');
var fs = require('fs');

function gossipNode() {
  this.list = {};
  this.initSocket();
  this.initializeList();

  var self = this;
  setInterval(function() {
    self.gossip(ipAddr);
  }, sendDelay);

  this.events();
}

gossipNode.prototype = {

  initSocket: function () {
    this.sock = dgram.createSocket('udp4');
    this.sock.bind(port, ipAddr);
  },

  initializeList: function () {
    if(ipAddr != contactNodeIP) {
      this.gossip(contactNodeIP);
    }

    var time = this.getTime();
    this.updateList(ipAddr, time, 'Joined');
    this.writeToLog(ipAddr, time, 'Joined');
  },

  /* All event handling */
  events: function (onlyConnection) {
    var self = this;

    this.sock.on('message', function (msg, rinfo) {
      // var recieved = new Buffer(JSON.parse(msg), 'utf-8');
      console.log('recieved: ' + msg);
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
    var message = new Buffer(JSON.stringify(this.list), 'utf-8');
    this.sock.send(message, 0, message.length, port, ipAddr);
  },

  sendList: function (ip) {
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
  var GossipNode = new gossipNode();
}
