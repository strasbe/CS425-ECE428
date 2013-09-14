var readline = require('readline');

function Prompt(cb) {
  this.cb = cb || function () { };

  this.initialize();
  this.setupEvents();
}

Prompt.prototype = {
  initialize: function () {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  },

  setupEvents: function () {
    var self = this;
    this.rl.on('line', function (cmd) {
      self.receivedCmd(cmd);
    });
  },

  receivedCmd: function (cmd) {
    var regEx = /^grep.*/;
    if (regEx.test(cmd)) {
      this.cb(cmd);
    }
    else {
      console.log('Usage: grep [OPTION]... PATTERN [FILE]...');
    }
    this.prompt();
  },

  prompt: function () {
    this.rl.prompt();
  }
};

if (require.main === module) {
  new Prompt().prompt();
}
else {
  module.exports = Prompt;
}
