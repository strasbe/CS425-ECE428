var net = require('net');
var Prompt = require('./prompt');
var runGrep = require('./runGrep');
var masterPort = 8000;

function Slave() {
  this.initialize();
  this.connect();
  this.setupEvents();
}

Slave.prototype = {
  initialize: function () {
    var self = this;
    this.commandLine = new Prompt();
  },

  connect: function () {
    var self = this;
    this.connection = net.connect({port: masterPort}, function () {
      console.log('Connected to Master');
      self.commandLine.prompt();
    });
  },

  setupEvents: function () {
    var self = this;
    /* If Master sends a valid grep command, run grep */
    this.connection.on('data', function (data) {
      data = data.toString('utf-8');
      var match = self.checkReceivedForGrep(data);
      if (match) {
        self.receivedGrep(match[1]);
      }
      else{
        console.log(data);
      }
    });

    this.connection.on('end', function() {
      console.log('Disconnected from Master');
    });

    this.commandLine.on('grep', function (cmd) {
      self.connection.write('grep ' + cmd);
      runGrep.runGrep(cmd, function (data) {
        data = data.toString('utf-8');
        console.log(data);
      });
    });
  },

  checkReceivedForGrep: function (cmd) {
    var regex = /^grep (.*)/;
    return regex.exec(cmd);
  },

  receivedGrep: function (cmd) {
    var self = this;
    runGrep.runGrep(cmd, function (data) {
      self.connection.write(data);
    });
  }
}

var slave = new Slave();