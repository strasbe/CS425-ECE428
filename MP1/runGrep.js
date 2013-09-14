var runGrep = function (cmd) {
  var spawn = require('child_process').spawn;
  var colors = require('colors');
  grep  = spawn('grep', ['--color=auto', cmd.toString('utf-8'), 'machine.1.log']);

  grep.stdout.on('data', function (data) {
    var data = data.toString('utf-8');
    console.log(data)
  });

  grep.stderr.pipe(process.stdout);
}

if (require.main === module) {
  runGrep();
}
else {
  exports.runGrep = runGrep;
}
