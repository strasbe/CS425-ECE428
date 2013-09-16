var logFile = 'machine.1.log';

var runGrep = function (cmd, cb) {
  /* Call back function if there is data to output from grep */
  cb = cb || function () { }

  /* Allows for grep to be run on computer */
  var spawn = require('child_process').spawn;
  grep  = spawn('grep', ['-e', cmd.toString('utf-8'), logFile]);

  /* Call back all data grep outputs */
  grep.stdout.on('data', function (data) {
    cb(data);
  });

  /* Pipe all error information to stdout */
  grep.stderr.pipe(process.stdout);
}

if (require.main === module) {
  runGrep();
}
else {
  exports.runGrep = runGrep;
}
