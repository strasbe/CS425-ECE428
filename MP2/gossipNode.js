var dgram = require('dgram');
var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');
var EventEmitter = require('events').EventEmitter;

var exitCmd = '/^exit.*/';
var sendPort = 8000;
var receivePort = sendPort + 1;
var contactNodeIP = '127.0.0.4';
var ipAddr = process.argv[2];
var timeout = 100;
var sendDelay = 10;
var currNodeIpAddr;
var intervalTimer;
var filename = 'machine.' + ipAddr + '.log';

function gossipNode() {
  this.eventEmitter = new EventEmitter();
  this.list = {};
  this.ipList = {};
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
    fs.writeFileSync(filename, '');//delete this line
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
        self.gossip(currNodeIpAddr, function () {
          self.exit();
        });
    });

    this.receiveSocket.on('message', function (msg, rinfo) {
        var recieved = JSON.parse(msg);
        self.updateList(recieved);
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
    if(status === 0) {
      status = 'Left';
    }
    else if (status === 1) {
      status = 'Crashed';
    }

    var localTime = this.getTime();
    var logMessage = ip + '/' + time + ': ' + status + ' at ' + localTime + '\n';
    fs.appendFileSync(filename, logMessage);
  },

  getTime: function () {
    return new Date().getTime();
  },

  gossip: function (ip, cb) {
    cb = cb || (function () {});
    if(ip !== 0) {
      var self = this;
      var msg = new Buffer(JSON.stringify(this.list), 'utf-8');
      this.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
    }
  },

  getRandomIpAddr: function () {
    var keys = Object.keys(this.list);
    keys = _.without(keys, ipAddr);
    var randIp;

    /* If node is gone, don't try to gossip with it */
    do {
      randIp = keys[Math.floor(keys.length * Math.random())];
    } while(randIp && this.list[randIp].status !== 'Joined' &&
            this.list[randIp].status !== 0 &&
            this.list[randIp].status !== 1);

    /* Don't gossip with self */
    if(!randIp) {
      randIp = 0;
    }
    return randIp;
  },

  updateNode: function(ip, time, status) {
    /* New IP address */
    if(!(ip in this.list)) {
      this.list[ip] = { 'startTime': time, 'status': status };

      /* Don't log anything for contactNodeIP before recieving info from it */
      if(time !== 0) {
        this.writeToLog(ip, time, status);
      }
    } /* Reincarnation of previously used IP */
    else if(this.list[ip].startTime < time) {
      this.list[ip].startTime = time;
      this.list[ip].status = status;

      /* Don't log anything for contactNodeIP before recieving info from it */
      if(status !== 0 || status !== 1) {
        this.writeToLog(ip, time, status);
      }
    } /* Update Current IP Machine */
    else if(this.list[ip].startTime === time && status !== 'Joined') {
      if(this.list[ip].status !== status) {
        if(status === 'Left' || status === 0) {
          this.list[ip].status = 0;
        }
        else if (status === 'Crashed' || status === 1) {
          this.list[ip].status = 1;
        }
        if(time !== 0) {
          this.writeToLog(ip, time, status);
        }
      }
    }
  },

  updateList: function (recievedList) {
    for(var ip in recievedList) {
      if(ip !== ipAddr) {
        this.updateNode(ip, recievedList[ip].startTime, recievedList[ip].status);
        if(!(ip in this.ipList)) {
          this.ipList[ip] = { 'timer':setTimeout(this.connectionTimedOut(ip), timeout) };
        }
        else {
          clearTimeout(this.ipList[ip].timer);
          this.ipList[ip].timer = setTimeout(this.connectionTimedOut(ip), timeout);
        }
      }
    }
  },

  connectionTimedOut: function (ip) {
    var self = this;
    return function () {
      self.updateNode(ip, self.list[ip].startTime, 'Crashed');
    };
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
