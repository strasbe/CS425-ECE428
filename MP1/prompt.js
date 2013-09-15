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
  this.rl.setPrompt('');
};

/* Every time a line is entered from keyboard, figure out command */
Prompt.prototype.setupEvents = function () {
  var self = this;
  this.rl.on('line', function (cmd) {
    self.receivedCmd(cmd);
  });
};

/* Determines the command the user inputed in to the machine */
Prompt.prototype.receivedCmd = function (cmd) {
  var grepRegEx = /^grep (\S*)(?:\s*)(\S*)$/;
  var exitRegEx = /^exit(?:\s*).*/;

  var match = grepRegEx.exec(cmd);

  if (match && match[1] && !match[2]) {
    /* Check for only key value grep */
    var expression = '^' + match[1]+':.*';
    this.emit('grep', expression);
  }
  else if (match && match[1] && match[2])
  {
    /* Check for both key and value grep */
    var expression = '^' + match[1]+':.*'+match[2]+'.*';
    this.emit('grep', expression);
  }
  else if (exitRegEx.test(cmd)) {
    this.emit('exit', cmd);
  }
  else {
    /* If command is invalid, display usage */
    console.log('Usage: grep [Key]... [Value]...');
    this.prompt();
  }
  
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
