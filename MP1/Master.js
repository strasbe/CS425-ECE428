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
    this.server = net.createServer(function (connection) {
      /* Keeps track of all the slaves connected */
      self.slaves.push(connection);

      /* When Master receives Data from any slaves */
      connection.on('data', function (data) {
        data = data.toString('utf-8');

        var match = self.checkReceivedForGrep(data);

        /* Valid grep command */
        if (match && match[1]) {
            self.reply = connection;
            self.receivedGrep(match[1]);
        }
        else if (self.reply != null){
          /* Forward all data from other Slaves to slave that requested grep */
          self.reply.write(data);
        }
        else {
          /* Write grep output */
          process.stdout.write(data);
          self.commandLine.prompt();
        }

      });

      /* When Slave disconnects from Master */
      connection.on('end', function () {
        self.slaveDisconnect(this);
      });

      connection.on('error', function() {
       self.slaveDisconnect(this);
      });

    });

    /* Listen to all connections on the Master port */
    this.server.listen(masterport, function() {
      self.commandLine.prompt();
    });
  },

  /* When a Slave disconnects it needs to be removed from the Master's slave list */
  slaveDisconnect: function (lostConnection) {
    var index = null;
    for (var i = 0; i < this.slaves.length; i++) {
      if (this.slaves[i] === lostConnection)
      {
        index = i;
        break;
      }
    }
    
    if (index)
    {
      this.slaves.splice(index,1);
    }
  },

  /* Deals with local events */
  setupEvents: function () {
    var self = this;
    this.commandLine.on('grep', function (cmd) {
      self.reply = null;

      /* Tell all slaves to run grep on their machines */
      self.broadcast(cmd);
      runGrep.runGrep(cmd, function (data) {
        data = data.toString('utf-8');
        process.stdout.write(data);
        self.commandLine.prompt();
      });      
    });
  },

  /* Checks command for grep command */
  checkReceivedForGrep: function (cmd) {
    var regex = /^grep (.*)/;
    return regex.exec(cmd);
  },

  /* When a Slave is the one who has the grep command being run */
  receivedGrep: function (cmd) {
    var self = this;

    /* Tells all the other slaves to run grep and to run locally and send to Slave */
    this.broadcast(cmd);
    runGrep.runGrep(cmd, function (data) {
      data = data.toString('utf-8');
      if (self.reply != null)
        self.reply.write(data);
    });
  },

  /* Tells all other Slaves to run grep command */
  broadcast: function (cmd) {
    var self = this;
    this.slaves.forEach(function (connection) {
      if (connection != self.reply) {
        connection.write('grep '+ cmd);
      }
    });
  }
}

var master = new Master();
