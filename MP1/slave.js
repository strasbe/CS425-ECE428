var masterPort = 8000;

var net = require('net');
var exitFunc, listenOnPort, serverConnect;
var prompt = require('./prompt');
var receivedGrep, slave;

serverConnect = function () {
    slave = net.connect({port: masterPort}, function () { //'connect' listener
        console.log('Slave Connected');
        slave.write('Slave: Slave Connected');
        prompt.prompt(receivedGrep);
    });

    slave.on('data', function(data) {
        console.log(data.toString('utf-8'));
    });

    slave.on('end', function() {
        console.log('Client Disconnected');
    });
}

receivedGrep = function (cmd) {
    slave.write('Slave: ' + cmd);
};

serverConnect();