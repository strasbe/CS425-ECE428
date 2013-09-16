var masterPort = 8000;

var net = require('net');
var Prompt = require('./prompt');
var runGrep = require('./runGrep');
var logFile = require('./genLogFile');
var EventEmitter = require('events').EventEmitter;

function Slave() {
  this.eventEmitter = new EventEmitter();
  this.initialize();
  this.connect();
  this.setupEvents();
}

Slave.prototype = {
  initialize: function () {
    this.commandLine = new Prompt();
  },

  /* Connects Slave to Master */
  connect: function () {
    var self = this;
    this.connection = net.connect({port: masterPort}, function () {
      if (process.env['NODE_ENV'] !== 'test') {
        self.commandLine.prompt();
      }
    });
  },

  /* All event handling */
  setupEvents: function (onlyConnection) {
    var self = this;

    /* If Master sends a valid grep command or log generation, run grep or generate log */
    this.connection.on('data', function (data) {
      data = data.toString('utf-8');
      var cmd = self.checkReceivedForGrep(data);
      var check = self.checkReceivedForGenerateLog(data);

      if (check){
        logFile.genLogFile(check);
      }
      else if (cmd) {
        self.receivedGrep(cmd);
      }
      else{
        if (process.env['NODE_ENV'] !== 'test') {
          process.stdout.write(data);
        }
        else
        {
          self.eventEmitter.emit('Got Data', data);
        }
      }
    });

    /* If Slave disconnects from Master, keep trying to reconnect */
    this.connection.on('error', function (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'EPIPE') {
          self.connect();
          self.setupEvents(true);
      }
    });

    /* Only run Grep if there is a single connection between slave and Master */
    if (!onlyConnection) {
      this.commandLine.on('grep', function (cmd) {
        self.receivedGrepFromCommandLine(cmd);
      });  
    }
  },

  /* If grep is entered locally on Slave machine */
  receivedGrepFromCommandLine: function (cmd) {
    if (!cmd) {
      throw new Error('Cmd cannot be empty, null or undefined');
    }    

    /* Send Grep command to master and run locally */
    this.connection.write('grep ' + cmd);
    runGrep.runGrep(cmd, function (data) {
      data = data.toString('utf-8');
      if (process.env['NODE_ENV'] !== 'test') {
        /* Grep Output */
        process.stdout.write(data);
      }
    });
  },

  /* Check if the Master sent out a grep command */
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

  checkReceivedForGenerateLog: function (cmd) {
    var regex = /^Generate Log.*/;
    var match = regex.exec(cmd);

    return match;
  },

  /* If Master sent out grep command, run grep and send results */
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
