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
      if (process.env['NODE_ENV'] !== 'test') {
        self.commandLine.prompt();        
      }
    });
  },

  setupEvents: function () {
    var self = this;
    /* If Master sends a valid grep command, run grep */
    this.connection.on('data', function (data) {
      data = data.toString('utf-8');
      var cmd = self.checkReceivedForGrep(data);
      if (cmd) {
        self.receivedGrep(cmd);
      }
      else{
        if (process.env['NODE_ENV'] !== 'test') {
          process.stdout.write(data);
        }
      }
    });

    this.commandLine.on('grep', function (cmd) {
      self.receivedGrepFromCommandLine(cmd);
    });
  },

  receivedGrepFromCommandLine: function (cmd) {
    if (!cmd) {
      throw new Error('Cmd cannot be empty, null or undefined');
    }    
    this.connection.write('grep ' + cmd);
    runGrep.runGrep(cmd, function (data) {
      data = data.toString('utf-8');
      if (process.env['NODE_ENV'] !== 'test') {
        // Grep Output
        process.stdout.write(data);        
      }
    });
  },

  checkReceivedForGrep: function (cmd) {
    var regex = /^grep ([^ ]*)/;
    var match = regex.exec(cmd);

    if (match && match[1]) {
      return match[1];
    }
    else {
      return null;
    }
  },

  receivedGrep: function (cmd) {
    var self = this;
    runGrep.runGrep(cmd, function (data) {
      self.connection.write(data);
    });
  },

  disconnect: function () {
    this.connection.end();
  }
}

module.exports = Slave;

if (require.main === module) {
  var slave = new Slave();
}
