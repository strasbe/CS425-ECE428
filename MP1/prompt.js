var prompt = function (cb) {
	var readline = require('readline');
	cb = cb || function () {};
	var rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});

	rl.prompt();

	rl.on('line', function (cmd) {
		var regEx = /^grep.*/;
		if (regEx.test(cmd)) {
			cb(cmd);
		}
		rl.prompt();
	});
}

if (require.main === module) {
	prompt();
}
else {
	exports.prompt = prompt;
}
