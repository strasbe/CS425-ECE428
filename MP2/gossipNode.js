var dgram = require('dgram');
var fs = require('fs');
var _ = require('underscore');

var sendPort = 8000;
var receivePort = sendPort + 1;
var contactNodeIP = '127.0.0.4';
var ipAddr = '127.0.0.5';
var timeout = 500;
var sendDelay = 100;
var ackMsg = new Buffer('ACK', 'utf-8');

function gossipNode() {
  this.list = {};
  this.initSockets();
  this.initializeList();

  var self = this;
  setInterval(function() {
    var currNodeIpAddr = self.getRandomIpAddr();
    if(currNodeIpAddr !== 0) {
      self.gossip(currNodeIpAddr);
    }
  }, sendDelay);

  this.events();
}

gossipNode.prototype = {

  initSockets: function () {
    this.sendSocket = dgram.createSocket('udp4');
    this.receiveSocket = dgram.createSocket('udp4');
    this.sendSocket.bind(sendPort, ipAddr);
    this.receiveSocket.bind(receivePort, ipAddr);
  },

  initializeList: function () {
    var time = this.getTime();

    this.updateNode(ipAddr, time, 'Joined');
    if(ipAddr != contactNodeIP) {
      /* Will keep trying to talk to contactNodeIP in beginning */
      this.updateNode(contactNodeIP, 0, 0);
    }

  },

  /* All event handling */
  events: function () {
    var self = this;

    this.receiveSocket.on('message', function (msg, rinfo) {
      if(msg.toString() !== ackMsg.toString()) {
        var recieved = JSON.parse(msg);
        self.updateList(recieved);

        /* Respond to all messages saying that list was recieved */
        self.sendSocket.send(ackMsg, 0, ackMsg.length, receivePort, rinfo.address);
      }

    });

  },

  writeToLog: function (ip, time, status) {
    var filename = 'machine.' + ipAddr + '.log';
    var logMessage = ip + '/' + time + ': ' + status + '\n';
    fs.appendFileSync(filename, logMessage);
  },

  getTime: function () {
    return new Date().getTime();
  },

  gossip: function (ip) {
    var self = this;
    var msg = new Buffer(JSON.stringify(this.list), 'utf-8');
    this.sendSocket.send(msg, 0, msg.length, receivePort, ip);
  },

  getRandomIpAddr: function () {
    var keys = Object.keys(this.list);
    keys = _.without(keys, ipAddr);
    var randIp = keys[Math.floor(keys.length * Math.random())];

    /* Don't gossip with self */
    if(!randIp) {
      randIp = 0;
    }
    return randIp;
    },

  updateNode: function(ip, time, status) {
    if(!(ip in this.list)) {
      this.list[ip] = { 'startTime': time, 'status': status };

      /* Don't log anything for contactNodeIP before recieving info from it */
      if( status !== 0) {
        this.writeToLog(ip, time, status);
      }
    }
    else if(this.list[ip].startTime < time) {
      this.list[ip].startTime = time;
      this.list[ip].status = status;

      /* Don't log anything for contactNodeIP before recieving info from it */
      if(status !== 0) {
        this.writeToLog(ip, time, status);
      }
    }
  },

  updateList: function (recievedList) {
    for(var ip in recievedList) {
      this.updateNode(ip, recievedList[ip].startTime, recievedList[ip].status);
    }
  },

  disconnect: function () {
    this.sendSocket.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var GossipNode = new gossipNode();
}
