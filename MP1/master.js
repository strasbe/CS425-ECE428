var masterport = 8000;

var net = require('net');
var exitFunc, listenOnPort, serverConnect;

/* Creates Master server */
var server = net.createServer(function(c) {
  console.log('Slave Connected');

  c.write('Master: Slave connected\r\n');

  c.on('Recieved Exit', exitFunc);

  /*Process recieved data*/
  c.on('data', function(data) {

    data = data.toString('utf-8');

    if (data == 'exit\r\n') {
      c.emit('Recieved Exit');
    }
    else {
      /* Check for valid grep command from a Slave*/
      var regex = /^Slave: (grep .*)/;
      var match = regex.exec(data);

      if( match && match[1] && regex.test(data) ){
          console.log(match[1]);
          c.write('Master: ' + match[1] + '\r\n');
      }
    }

  });

});

server.listen(masterport, function() { 
  console.log('Listening to slaves on port:', masterport);
});

exitFunc = function () {
  console.log('Closing connection.');
  this.end();
}

