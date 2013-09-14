var runGrep = function (expression, filename) {
  var spawn = require('child_process').spawn;
  var colors = require('colors');
  grep  = spawn('grep', ['--color=auto', expression.toString('utf-8'), filename.toString('utf-8')]);

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
