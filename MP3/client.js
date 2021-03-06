var dgram = require('dgram');
var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');
var os = require('os');
var EventEmitter = require('events').EventEmitter;
var movieFile = "./movies.list"

var exitRegEx = /^exit.*/;
var insertRegEx = /^insert(?:\s([a-zA-Z0-9]+))(?:\s([a-zA-Z0-9]+))(?:\s([a-zA-Z0-9]+))?/;
var lookupRegEx = /^lookup(?:\s([a-zA-Z0-9]+))(?:\s([a-zA-Z0-9]+))?/;
var updateRegEx = /^update(?:\s([a-zA-Z0-9]+))(?:\s([a-zA-Z0-9]+))(?:\s([a-zA-Z0-9]+))?/;
var deleteRegEx = /^delete (.*)/;
var showRegEx = /^show.*/;
var foundRegEx = /^found(.*)/;
var movieRegEx = /^movie.*/;
var oneRegEx = /.*(ONE).*/;
var allRegEx = /.*(ALL).*/;
var quarRegEx = /.*(QUORUM).*/;
var foundCounter = 0;


var sendPort = 8000;
var receivePort = sendPort + 1;
var contactNodeIP = '127.0.0.1';
var ipAddr = process.argv[2];//os.networkInterfaces().eth0[0].address;
var timeout = 5000;
var sendDelay = 100;
var currNodeIpAddr;
var intervalTimer;
var filename = 'machine.' + ipAddr + '.log';

var numMachines;

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

    this.updateNode(ipAddr, time, 'Contact', -1);
    if(ipAddr != contactNodeIP) {
      /* Will keep trying to talk to contactNodeIP in beginning */
      this.updateNode(contactNodeIP, 0, 0, 0);
    }

  },

  readMovieFile: function(){
    var self = this;
    var tmp = 0;
    fs.readFile(movieFile, 'utf8', function(err, data){
      if(err){
        return console.log(err);
      }
      var lineByLine = data.split("\n");
      lineByLine.forEach(function(line){
        tmp++;
        var title = line.split("\"");
        var wordSplit = null;
        if(title[1]){
          wordSplit = title[1].split(" ");
        }
        if(tmp > 590200 && tmp < 590200) {
          if(wordSplit !== null){
            wordSplit.forEach(function(word){
              console.log(word);
              self.eventEmitter.emit('insert', title[1], word);
            });
        }
        }
      });
    });
  },

  /* All event handling */
  events: function () {
    var self = this;

    /* Node Voluntarily leaves */
    this.eventEmitter.on('exit', function () {
      for( var ip in self.ipList) {
        clearTimeout(self.ipList[ip].timer);
      }
      self.exit();
    });

    this.eventEmitter.on('insert', function (key, value, cb) {
      cb = cb || (function () {});

      keys = Object.keys(self.list);

      keys.forEach(function(ip) {
        if(self.list[ip].status === 'Joined') {
          var msg = new Buffer(JSON.stringify('insert ' + key + ' ' + value), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
        }
      });
    });

    this.eventEmitter.on('lookup', function (key, concurrency, cb) {
      cb = cb || (function () {});

      var numMachines = 0;
      keys.forEach(function(ip) {
        if(self.list[ip].status === 'Joined') {
          numMachines++;
        }
      });

      if( (match = oneRegEx.exec(concurrency)) || !concurrency) {
        foundCounter = 1;
        var destMachine = self.hashingFunc(key);
        var destIp = 0;
          keys = Object.keys(self.list);
          keys.forEach(function(ip) {
                if(self.list[ip].machineNum === destMachine) {
                  destIp = ip;
                }
          });
          var msg = new Buffer(JSON.stringify('lookup ' + key), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, destIp, cb);
      }
      else if(match = allRegEx.exec(concurrency)) {
        foundCounter = numMachines;
        var destMachine = self.hashingFunc(key);
        var destIp = 0;
        keys = Object.keys(self.list);
        keys.forEach(function(ip) {
          var msg = new Buffer(JSON.stringify('lookup ' + key), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
        });
        
      }
      else if(match = quarRegEx.exec(concurrency)) {
        foundCounter = numMachines;
        var destMachine = self.hashingFunc(key);
        var destIp = 0;
        keys = Object.keys(self.list);
        keys.forEach(function(ip) {
          var msg = new Buffer(JSON.stringify('lookup ' + key), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
        });
      }
    });

    this.eventEmitter.on('update', function (key, value, cb) {
      cb = cb || (function () {});
      keys = Object.keys(self.list);

      keys.forEach(function(ip) {
        if(self.list[ip].status === 'Joined') {
          var msg = new Buffer(JSON.stringify('update ' + key + ' ' + value), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
        }
      });
    });

    this.eventEmitter.on('delete', function (key, cb) {
      cb = cb || (function () {});
      keys = Object.keys(self.list);

      keys.forEach(function(ip) {
        if(self.list[ip].status === 'Joined') {
          var msg = new Buffer(JSON.stringify('delete ' + key), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, ip, cb);
        }
      });
    });

    this.eventEmitter.on('show', function () {
      self.show();
    });

    this.eventEmitter.on('join', function (newMachine, oldMachine, cb) {
      cb = cb || (function () {});
      if(oldMachine) {
        if(self.list[oldMachine].status === 'Joined') {
          var msg = new Buffer(JSON.stringify('join ' + newMachine), 'utf-8');
          self.sendSocket.send(msg, 0, msg.length, receivePort, oldMachine, cb);
        }
      }
    });

    this.receiveSocket.on('message', function (msg, rinfo) {
        var received = JSON.parse(msg);
        self.checkCmd(received);
        if(!(rinfo.address in self.ipList)) {
          self.ipList[rinfo.address] = { 'timer':setTimeout(self.connectionTimedOut(rinfo.address), timeout) };
        }
        else {
          clearTimeout(self.ipList[rinfo.address].timer);
          self.ipList[rinfo.address].timer = setTimeout(self.connectionTimedOut(rinfo.address), timeout);
        }

        self.updateList(received);
    });

    this.rl.on('line', function (cmd) {
      self.receivedCmd(cmd);
    });



  },

  receivedCmd: function (cmd) {
    if (exitRegEx.test(cmd)) {
      this.eventEmitter.emit('exit');
      return;
    }
    else {
      this.checkCmd(cmd);
      this.rl.prompt('>');
    }
  },

  checkCmd: function (cmd) {
    var match = null;
    if (match = insertRegEx.exec(cmd)) {
      this.eventEmitter.emit('insert', match[1], match[2]);
    }
    else if (match = lookupRegEx.exec(cmd)) {
      this.eventEmitter.emit('lookup', match[1], match[2]);
    }
    else if (match = updateRegEx.exec(cmd)) {
      this.eventEmitter.emit('update', match[1], match[2]);
    }
    else if (match = deleteRegEx.exec(cmd)) {
      this.eventEmitter.emit('delete', match[1]);
    }
    else if(match = showRegEx.exec(cmd)) {
      this.eventEmitter.emit('show');
    }
    else if(match = foundRegEx.exec(cmd)) {
      foundCounter--;
      if(foundCounter === 0) {
        var list = match[1].split(",");
        list.forEach(function(title) {
          console.log(title);
        });
      }
    }
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
            this.list[randIp].status !== 1 &&
            this.list[randIp]. status !== 'Contact');

    /* Don't gossip with self */
    if(!randIp) {
      randIp = 0;
    }
    return randIp;
  },

  updateNode: function(ip, time, status, machineNum) {
    var self = this;
    /* New IP address */
    if(!(ip in this.list)) {
      var oldest = Number.MAX_VALUE;
      var oldestIp = 0;
      keys = Object.keys(this.list);
      keys.forEach(function(ipIt) {
        if(self.list[ipIt].status === 'Joined') {
          if(self.list[ipIt].startTime < oldest) {
            oldest = self.list[ipIt].startTime;
            oldestIp = ipIt;
          }
          if(self.list[ipIt].machineNum >= machineNum && machineNum >=0) {
            machineNum = self.list[ipIt].machineNum++;
          }
        }
      });
      this.list[ip] = { 'startTime': time, 'status': status, 'machineNum': machineNum };
      
      if(oldestIp) {
        self.eventEmitter.emit('join', ip, oldestIp);
      }
    } /* Reincarnation of previously used IP */
    else if(this.list[ip].startTime < time) {
      this.list[ip].startTime = time;
      this.list[ip].status = status;
      keys = Object.keys(this.list);
      var oldest = Number.MAX_VALUE;
      var oldestIp = 0;
      keys.forEach(function(ipIter) {
        if(self.list[ipIter].status === 'Joined') {
          if(self.list[ipIter].startTime < oldest) {
            oldest = self.list[ipIter].startTime;
            oldestIp = ipIter;
          }
        }
      });
      if(oldestIp) {
        self.eventEmitter.emit('join', ip, oldestIp);
      }
    } /* Update Current IP Machine */
    else if(this.list[ip].startTime === time && status !== 'Joined' && status !== 'Contact') {
      this.list[ip].machineNum = -1;
      if(this.list[ip].status !== status) {
        if(status === 'Left' || status === 0) {
          this.list[ip].status = 0;
        }
        else if (status === 'Crashed' || status === 1) {
          if(this.list[ip].status !== 0) {
            this.list[ip].status = 1;
          }
        }
      }
    }
    else if(this.list[ip].startTime === time && status === 'Joined') {
      if(this.list[ip].machineNum !== machineNum) {
        this.list[ip].machineNum = machineNum;
      }
    }

  },

  /* returns the machine the key goes to*/
  hashingFunc: function(key) {
    keys = Object.keys(this.list);

    var self = this;
    var numMachines = 0;
    keys.forEach(function(ip) {
      if(self.list[ip].status === 'Joined') {
        numMachines++;
      }
    });

    if(typeof(key) === 'string') {
      key = key.charCodeAt(0);
    }

    var destMachine = key % numMachines;
    keys = Object.keys(self.list);
    var found = false;
    keys.forEach(function(ip) {
          if(self.list[ip].machineNum === destMachine && self.list[ip].status === 'Joined') {
            found = true;
          }
    });
    if(!found) {
      var destMachine = -1;
      keys.forEach(function(ip) {
        if(self.list[ip].machineNum > destMachine && self.list[ip].status === 'Joined') {
          destMachine = self.list[ip].machineNum;
        }
      });
    }
    return destMachine;

  },

  show: function () {
    console.log(this.list);
    var keys = Object.keys(this.list);
    var self = this;
    console.log('Active Members:');
    keys.forEach(function(ip) {
      if(self.list[ip].status === 'Joined') {
        console.log(' ' + ip);
      }
    });

  },

  updateList: function (receivedList) {
    for(var ip in receivedList) {
      if(ip !== ipAddr && receivedList[ip].startTime !== undefined) {
        this.updateNode(ip, receivedList[ip].startTime, receivedList[ip].status, receivedList[ip].machineNum);
      }
    }
  },

  connectionTimedOut: function (ip) {
    var self = this;
    return function () {
      self.updateNode(ip, self.list[ip].startTime, 1, -1);
    };
  },

  exit: function () {
    intervalTimer.unref();
    clearInterval(intervalTimer);
    // this.sendSocket.close();
    // this.receiveSocket.close();
    // this.rl.close();
  }
};

module.exports = gossipNode;

if (require.main === module) {
  var GossipNode = new gossipNode();
}
