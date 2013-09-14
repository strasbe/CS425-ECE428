var masterport = 8000;

var net = require('net');
var Prompt = require('./prompt');
var runGrep = require('./runGrep');

function Master() {
  this.initialize();
  this.connect();
  this.setupEvents();
}

Master.prototype = {
  initialize: function () {
    var self = this;
    this.commandLine = new Prompt(function (cmd) {
      var match = self.checkForGrep(cmd);
      if (match) {
        self.receivedGrep(match[1], match[2]);
      }
    });
  },

  connect: function() {
    var self = this;
    this.connection = net.createServer(function(c) {
      console.log('Slave Connected');
      self.commandLine.prompt();
    });

    this.connection.listen(masterport, function() {
      console.log('Listening for slaves on port:', masterport);
    });
  },

  setupEvents: function() {
    var self = this;
    var match;

    this.connection.on('data', function(data) {
      data = data.toString('utf-8');
      if (match = self.checkForGrep(data)) {
          self.receivedGrep(match[1], match[2]);
          self.connection.write(data);
          console.log(data);
      }
      else {
        console.log(data);
      }
    });

    this.connection.on('end', function() {
      console.log('Slave Disconnected');
    });
  },

  checkForGrep: function(cmd) {
    var regex = /^grep (.*) (.*)/;
    return regex.exec(cmd);
  },

  receivedGrep: function(expression, filename) {
    runGrep.runGrep(expression, filename);
    this.broadcast(expression, filename);
  },

  broadcast: function(expression, filename) {
  }
}

var master = new Master();
