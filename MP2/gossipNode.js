var dgram = require('dgram');
var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');
var EventEmitter = require('events').EventEmitter;

var exitCmd = '/^exit.*/';
var sendPort = 8000;
var receivePort = sendPort + 1;
var contactNodeIP = '127.0.0.4';
var ipAddr = '127.0.0.5';
var timeout = 500;
var sendDelay = 100;
var ackMsg = new Buffer('ACK', 'utf-8');
var currNodeIpAddr;
var intervalTimer;

function gossipNode() {
  this.eventEmitter = new EventEmitter();
  this.list = {};
  this.initialize();
  this.initSockets();
  this.initializeList();

  var self = this;
  intervalTimer = setInterval(function() {
    currNodeIpAddr = self.getRandomIpAddr();
    self.gossip(currNodeIpAddr);
  }, sendDelay);

  this.events();
}

gossipNode.prototype = {

  initialize: function () {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.rl.prompt('>');
  },

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

    /* Node Voluntarily leaves */
    this.eventEmitter.on('exit', function () {
        self.updateNode(ipAddr, self.list[ipAddr].startTime, 'Left');
        self.gossip(currNodeIpAddr);
        self.exit();

    });

    this.receiveSocket.on('message', function (msg, rinfo) {
      if(msg.toString() !== ackMsg.toString()) {
        var recieved = JSON.parse(msg);
        self.updateList(recieved);

        /* Respond to all messages saying that list was recieved */
        self.sendSocket.send(ackMsg, 0, ackMsg.length, receivePort, rinfo.address);
      }

    });

    this.rl.on('line', function (cmd) {
      self.receivedCmd(cmd);
    });

  },

  receivedCmd: function (cmd) {
    if(exitCmd.match(cmd)) {
      this.eventEmitter.emit('exit');
    }
    else {
      this.rl.prompt('>');
    }
  },

  writeToLog: function (ip, time, status) {
    var localTime = this.getTime();
    var filename = 'machine.' + ipAddr + '.log';
    var logMessage = ip + '/' + time + ': ' + status + ' at ' + localTime + '\n';
    fs.appendFileSync(filename, logMessage);
  },

  getTime: function () {
    return new Date().getTime();
  },

  gossip: function (ip) {
    if(ip !== 0) {
      var self = this;
      var msg = new Buffer(JSON.stringify(this.list), 'utf-8');
      this.sendSocket.send(msg, 0, msg.length, receivePort, ip);
    }
  },

  getRandomIpAddr: function () {
    var keys = Object.keys(this.list);
    keys = _.without(keys, ipAddr);
    var randIp;

    /* If node is gone, don't try to gossip with it */
    do {
      randIp = keys[Math.floor(keys.length * Math.random())];
    } while(list[randIp].status !== 'Joined');

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
    else if(this.list[ip].startTime <= time) {
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

  exit: function () {
    intervalTimer.unref();
    clearInterval(intervalTimer);
    this.sendSocket.close();
    this.receiveSocket.close();
    this.rl.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var GossipNode = new gossipNode();
}
