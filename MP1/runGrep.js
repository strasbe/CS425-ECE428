var spawn = require('child_process').spawn,
    grep  = spawn('grep', ['master', 'slave.js']);

grep.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});
grep.stderr.on('data', function (data) {     
  console.log('stderr: ' + data);
});

grep.on('close', function (code) {
  
});
