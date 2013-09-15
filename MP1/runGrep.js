var logFile = 'machine.1.log';

var runGrep = function (cmd, cb) {
  cb = cb || function () { }
  var spawn = require('child_process').spawn;
  // var output = '';
  grep  = spawn('grep', ['-e', cmd.toString('utf-8'), logFile]);

  grep.stdout.on('data', function (data) {
    cb(data);
    // output += data.toString('utf-8');
  });

  grep.stderr.pipe(process.stdout);

  grep.on('close', function (code, signal) {
    // cb(output.trim());
  });
}

if (require.main === module) {
  runGrep();
}
else {
  exports.runGrep = runGrep;
}
