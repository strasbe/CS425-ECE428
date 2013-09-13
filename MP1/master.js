var port = 8000;

var net = require('net');
var exitFunc, listenOnPort, serverConnect;

var server = net.createServer(function(c) { //'connection' listener
    console.log('Slave Connected');

    c.write('Master: Slave connected\n');

    c.on('Got Exit', exitFunc);

    /*Process recieved data*/
    c.on('data', function(data) {

        data = data.toString('utf-8');

        console.log(data);

        if (data == 'exit\r\n') {
            c.emit('Got Exit');
        }
        else {
            var regex = /^Slave: (grep .*)/;
            var match = regex.exec(data);

            if( match && match[1] && regex.test(data) ){
                console.log(match[1]);
                c.write('Master: ' + match[1]);
            }
        }
       
    });

});

server.listen(port, function() { 
    console.log('Listening to slaves on port:', port);
});    

exitFunc = function () {
    console.log('Closing connection.');
    this.end();
}

