var fs = require('fs');

var rare = 'rare: these messages dont occur often\n';
var someWhatOften = 'some: these messages occur more than rare ones\n';
var often = 'often: these messages occur a lot\n';

var genLogFile = function (cmd) {
  fs.writeFileSync('machine.4.log', '');
  var regex = /([0-9]+)/;
  var size = regex.exec(cmd);
  size = size[1];
  fs.appendFileSync('machine.4.log', rare);
  fs.appendFileSync('machine.4.log', someWhatOften);
  fs.appendFileSync('machine.4.log', often);

  var stats = {'size': 0};
  while (stats.size < size * 1000000) {
    //create key with random 4 character
    var key="";
    for(var j = 0; j<4; j++){
      key+=(Math.random()*1000).toString();
    }

    var value = "";
    for(var j = 0; j<Math.random()*200; j++){
      value =+ (Math.random()*1000).toString();
    }
    var frequency = (Math.random() * 1000) + 1;
    if (frequency <= 1000 && frequency >= 400){
      fs.appendFileSync('machine.4.log', often);
    }
    else if (frequency < 400 && frequency > 150){
      fs.appendFileSync('machine.4.log', someWhatOften);
    }
    else if (frequency < 150 && frequency > 50){
      fs.appendFileSync('machine.4.log', key + ": " + value + '\n');
    }
    else {
      fs.appendFileSync('machine.4.log', rare);
    }
    stats = fs.statSync('machine.4.log');

  }
  fs.appendFileSync('machine.4.log', 'rare:eof\n');
  fs.appendFileSync('machine.4.log', 'some:eof\n');
  fs.appendFileSync('machine.4.log', 'often:eof\n');

}

if (require.main === module) {
  genLogFile();
}
else {
  exports.genLogFile = genLogFile;
}
