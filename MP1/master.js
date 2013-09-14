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
    this.commandLine = new Prompt();
    this.slaves = [];
  },

  connect: function() {
    var self = this;
    this.server = net.createServer(function(connection) {
      console.log('Slave Connected');
      self.slaves.push(connection);

      connection.on('data', function(data) {
        data = data.toString('utf-8');
        var match = self.checkReceivedForGrep(data);
        if (match && match[1]) {
            self.receivedGrep(match[1]);
            console.log(data);
        }
        else {
          console.log(data);
        }
      });

    connection.on('end', function() {
      console.log('Slave Disconnected');
    });


    });

    this.server.listen(masterport, function() {
      console.log('Listening for slaves on port:', masterport);
      self.commandLine.prompt();
    });
  },

  setupEvents: function() {
    var self = this;
    this.commandLine.on('grep', function (cmd) {
      self.broadcast(cmd);
      runGrep.runGrep(cmd, function (data) {
        data = data.toString('utf-8');
        console.log(data);
      });
    });

  },

  checkReceivedForGrep: function(cmd) {
    var regex = /^grep (.*)/;
    return regex.exec(cmd);
  },

  receivedGrep: function(cmd) {
    this.broadcast(cmd);
    runGrep.runGrep(cmd, function (data) {
      data = data.toString('utf-8');
      console.log('utf-8');
    });
  },

  broadcast: function(cmd) {
    console.log(cmd);
    this.slaves.forEach(function (connection) {
      connection.write('grep '+ cmd);
    });
  }
}

var master = new Master();
