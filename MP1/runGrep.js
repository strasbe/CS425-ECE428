var runGrep = function (expression, filename) {
  var spawn = require('child_process').spawn;
  grep  = spawn('grep', [expression.toString('utf-8'), filename.toString('utf-8')]);

  grep.stdout.on('data', function (data) {
    console.log(data.toString('utf-8'));
  });

  grep.stderr.on('data', function (data) {
    console.log(data.toString('utf-8'));
  });

  grep.on('close', function (code) { });

}

if (require.main === module) {
  runGrep();
}
else {
  exports.runGrep = runGrep;
}
