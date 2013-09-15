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
    this.reply = null;
  },

  connect: function() {
    var self = this;
    this.server = net.createServer(function(connection) {
      // console.log('Slave Connected');
      self.slaves.push(connection);

      connection.on('data', function(data) {
        data = data.toString('utf-8');
        var match = self.checkReceivedForGrep(data);
        if (match && match[1]) {
            self.reply = connection;
            self.receivedGrep(match[1]);
        }
        else if(self.reply != null){
          self.reply.write(data);
        }
        else {
          // Writing grep output
          // console.log(data);
          process.stdout.write(data);
        }
      });

    connection.on('end', function() {
      // console.log('Slave Disconnected');
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
      self.reply = null;
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
    var self = this;
    this.broadcast(cmd);
    runGrep.runGrep(cmd, function (data) {
      data = data.toString('utf-8');
      if(self.reply != null)
        self.reply.write(data);
    });
  },

  broadcast: function(cmd) {
    var self = this;
    this.slaves.forEach(function (connection) {
      if ( connection != self.reply) {
        connection.write('grep '+ cmd);
      }
    });
  }
}

var master = new Master();
