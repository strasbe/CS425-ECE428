var dgram = require('dgram');
var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');
var os = require('os');
var EventEmitter = require('events').EventEmitter;

var movieFile = "./movies.list"

var movieRegEx = /^movie.*/;

var exitRegEx = /^exit.*/;
var insertRegEx = /^insert (.*) (.*)/;
var lookupRegEx = /^lookup (.*)/;
var updateRegEx = /^update (.*) (.*)/;
var deleteRegEx = /^delete (.*)/;
var showRegEx = /^show.*/;
var joinRegEx = /^join (.*)/;

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
  this.kvPairs = {};
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

    this.updateNode(ipAddr, time, 'Joined', 0);
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
        // if(tmp > 590200 && tmp < 590300) {
          if(wordSplit !== null){
            wordSplit.forEach(function(word){
              self.insert(word, title[1]);
            });
        // }
        }
      });
    });
    timeout = 2000;
  },

  /* All event handling */
  events: function () {
    var self = this;

    /* Node Voluntarily leaves */
    this.eventEmitter.on('exit', function () {
        for( var ip in self.ipList) {
          clearTimeout(self.ipList[ip].timer);
        }
        self.updateNode(ipAddr, self.list[ipAddr].startTime, 'Left', -1);
        self.gossip(currNodeIpAddr, function () {
          self.exit();
        });
    });

    this.eventEmitter.on('insert', function (key, value, cb) {
      cb = cb || (function () {});
      self.insert(key,value);
    });

    this.eventEmitter.on('lookup', function (key, addrInfo, cb) {
      cb = cb || (function () {});
      if(!addrInfo) {
        console.log(self.lookup(key));
      }
      else if(self.lookup(key) !== undefined) {
        var msg = new Buffer(JSON.stringify('found' + self.lookup(key)), 'utf-8');
        self.sendSocket.send(msg, 0, msg.length, receivePort, addrInfo, cb);
      }
    });

    this.eventEmitter.on('update', function (key, value, cb) {
      cb = cb || (function () {});
      self.update(key,value);
    });

    this.eventEmitter.on('delete', function (key, cb) {
      cb = cb || (function () {});
      self.delete(key);
    });

    this.eventEmitter.on('show', function () {
      self.show();
    });

    this.eventEmitter.on('join', function (destIp, cb) {
      cb = cb || (function () {});
      keys = Object.keys(self.kvPairs);
      keys.forEach(function(key) {
        var msg = new Buffer(JSON.stringify('insert ' + key + ' ' + self.kvPairs[key]), 'utf-8');
        self.sendSocket.send(msg, 0, msg.length, receivePort, destIp, cb);
      });
    });

    this.receiveSocket.on('message', function (msg, rinfo) {
        var received = JSON.parse(msg);
        self.checkCmd(received, rinfo.address);
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

  checkCmd: function (cmd, addrInfo) {
    var match = null;
    if (match = insertRegEx.exec(cmd)) {
      this.eventEmitter.emit('insert', match[1], match[2]);
    }
    else if (match = lookupRegEx.exec(cmd)) {
      this.eventEmitter.emit('lookup', match[1], addrInfo);
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
    else if(match = joinRegEx.exec(cmd)) {
      this.eventEmitter.emit('join', match[1]);
    }
    else if(match = movieRegEx.exec(cmd)) {
      this.readMovieFile();
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
            this.list[randIp].status !== 1 &&
            this.list[randIp].status !== 'Contact');

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
      keys = Object.keys(this.list);
      keys.forEach(function(ip) {
        if(self.list[ip].status === 'Joined') {
          if(self.list[ip].machineNum >= machineNum && machineNum >=0) {
            machineNum = self.list[ip].machineNum++;
          }
        }
      });

      this.list[ip] = { 'startTime': time, 'status': status, 'machineNum': machineNum };

      keys = Object.keys(this.kvPairs);
      keys.forEach(function(key) {
        var newMachineNum = self.hashingFunc(key);
        var currMachineNum = self.list[ipAddr].machineNum;
        if(newMachineNum !== currMachineNum) {
          self.eventEmitter.emit('insert', key, self.kvPairs[key], function () {});
        }
      });

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
    else if(this.list[ip].startTime === time && status !== 'Joined' && status !== 'Contact') {
      this.list[ip].machineNum = -1;
      if(this.list[ip].status !== status) {
        if(status === 'Left' || status === 0) {
          this.list[ip].status = 0;
          if(ip === ipAddr) {
            keys = Object.keys(this.kvPairs);
            keys.forEach(function(key) {
                self.eventEmitter.emit('insert', key, self.kvPairs[key], function () {});
            });
          }
        }
        else if (status === 'Crashed' || status === 1) {
          if(this.list[ip].status !== 0) {
            this.list[ip].status = 1;
          }
        }
        if(time !== 0) {
          this.writeToLog(ip, time, status);
        }
      }
    }
    else if(this.list[ip].startTime === time && status === 'Joined') {
      if(this.list[ip].machineNum !== machineNum) {
        this.list[ip].machineNum = machineNum;
      }
    }
  },

  insert: function (key, value) {
    // if(typeof(this.kvPairs[key]) === 'undefined'){
    //   this.kvPairs[key] = [];
    // }

    // this.kvPairs[key].push(value);
    this.kvPairs[key] = value;
  },

  /* returns value from key */
  lookup: function (key) {
    return this.kvPairs[key];
  },

  update: function (key, newValue) {
    // delete this.kvPairs[key];
    // if(typeof(this.kvPairs[key]) === 'undefined'){
    //   this.kvPairs[key] = [];
    // }

    // this.kvPairs[key].push(newValue);
    this.kvPairs[key] = value;
    
  },

  delete: function(key) {
    delete this.kvPairs[key];
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
          if(self.list[ip].machineNum === destMachine) {
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
    // console.log(this.list);
    var keys = Object.keys(this.kvPairs);
    console.log('Keys:');
    keys.forEach(function (key) {
      console.log(' ' + key);
    });

    keys = Object.keys(this.list);

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
