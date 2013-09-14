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
    this.commandLine = new Prompt(function (cmd) {
      var match = self.checkForGrep(cmd);
      if (match) {
        self.receivedGrep(match[1], match[2]);
      }
    });
  },

  connect: function () {
    var self = this;
    this.connection = net.connect({port: masterPort}, function () {
      console.log('Conencted to Master');
      self.commandLine.prompt();
    });
  },

  setupEvents: function () {
    var self = this;
    /* If Master sends a valid grep command, run grep */
    this.connection.on('data', function (data) {
      var match = self.checkForGrep(data);
      if (match) {
        self.receivedGrep(match[1], match[2]);
      }
    });

    this.connection.on('end', function() {
      console.log('Disconnected from Master');
    });
  },

  checkForGrep: function (cmd) {
    var regex = /^grep (.*) (.*)/;
    return regex.exec(cmd);
  },

  receivedGrep: function (expression, filename) {
    runGrep.runGrep(expression, filename);
  }
}

var slave = new Slave();