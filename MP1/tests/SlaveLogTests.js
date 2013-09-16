process.env['NODE_ENV'] = 'test';
var Slave = require('../Slave');
var rare = /.*rare:.*/;
var someWhatOften = /.*some:.*/;
var often = /.*often:.*/;
var end = /.*eof.*/;
var rareResult = 'Fail', someResult = 'Fail' , oftenResult = 'Fail' ;
slave = new Slave();
slave.commandLine.rl.close();
var done;
var numTests = 3;
var numSubTests = 3;

slave.connection.write('Generate Log 1');

console.log('Rare key value 1MB file testing');
slave.connection.write('grep rare');


slave.eventEmitter.on('Got Data', function (data) {
	
	if (end.test(data)) {
		console.log('here');
		done();
	}
	else if(rare.test(data)) {
		rareResult = 'Pass';
	}
	else if(someWhatOften.test(data)) {
		someResult = 'Pass';
	}
	else if (often.test(data)) {
		oftenResult = 'Pass';
	}
});

done = function () {

}

