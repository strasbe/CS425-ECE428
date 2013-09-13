var masterPort = 8000;

var net = require('net');
var exitFunc, listenOnPort, serverConnect;
var commandLine = require('./prompt');
var runGrep = require('./runGrep');
var receivedGrep, slave;

/* Connects to Master server and handles data from Master*/
serverConnect = function () {
  slave = net.connect({port: masterPort}, function () { //'connect' listener
    console.log('Slave Connected');
    slave.write('Slave: Slave Connected\r\n');
    commandLine.prompt(receivedGrep);
  });

  /* If Master sends a valid grep command, run grep*/
  slave.on('data', function(data) {
    var match;
    var regex = /^Master: grep (.*) (.*)/;
    if (match = regex.exec(data))
      runGrep.runGrep(match[1], match[2]);
  });

  /* Disconnect from Master*/
  slave.on('end', function() {
    console.log('Client Disconnected');
  });
}

/* If a grep command was entered in the prompt, tell Master */
receivedGrep = function (cmd) {
  slave.write('Slave: ' + cmd + '\r\n');
};

serverConnect();