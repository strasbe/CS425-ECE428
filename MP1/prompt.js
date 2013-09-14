var readline = require('readline');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Prompt() {
  this.initialize();
  this.setupEvents();
}

util.inherits(Prompt, EventEmitter);

Prompt.prototype.initialize = function () {
  this.rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

Prompt.prototype.setupEvents = function () {
  var self = this;
  this.rl.on('line', function (cmd) {
    self.receivedCmd(cmd);
  });
};

Prompt.prototype.receivedCmd = function (cmd) {
  var grepRegEx = /^grep (.*)/;
  var exitRegEx = /^exit.*/;
  var match = grepRegEx.exec(cmd);

  if (match && match[1]) {
    this.emit('grep', match[1]);
  }
  else if (exitRegEx.test(cmd)) {
    this.emit('exit', cmd);
  }
  else {
    console.log('Usage: grep [OPTION]...');
  }
  this.prompt();
};

Prompt.prototype.prompt = function () {
  this.rl.prompt();
};

if (require.main === module) {
  new Prompt().prompt();
}
else {
  module.exports = Prompt;
}
