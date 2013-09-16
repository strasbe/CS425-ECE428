process.env['NODE_ENV'] = 'test';
var Slave = require('../Slave');
var rare = /.*rare:.*/;
var someWhatOften = /.*some:.*/;
var often = /.*often:.*/;
var end = /.*eof.*/;
var rareResult = 'Fail', someResult = 'Fail' , oftenResult = 'Fail';
slave = new Slave();
slave.commandLine.rl.close();
var done;
var numMachines = 1;
var numTests = 3;
var numSubTests = 3*numMachines;

slave.connection.write('Generate Log 100');
// 		slave.connection.end();

// slave.connection.write('grep rare');


// slave.eventEmitter.on('Got Data', function (data) {

// 	if (end.test(data)) {
// 		done();
// 	}
// 	else if(rare.test(data)) {
// 		rareResult = 'Pass';
// 	}
// 	else if(someWhatOften.test(data)) {
// 		someResult = 'Pass';
// 	}
// 	else if (often.test(data)) {
// 		oftenResult = 'Pass';
// 	}


// });


// done = function () {
// 	numSubTests--;
// 	if(numSubTests <= 0) {
// 		numSubTests = 3*numMachines;
// 	}

// 	if( numTests == 3 && numSubTests == 3*numMachines)
// 	{
// 		numTests--;
// 		if (rareResult == 'Pass' && someResult == 'Pass' && oftenResult == 'Pass') {
// 			console.log('Key value pairs of 1MB file testing: PASS');
// 		}
// 		else {	
// 			console.log('Key value pairs of 1MB file testing: FAIL');
// 		}
// 		rareResult = 'Fail', someResult = 'Fail' , oftenResult = 'Fail';
// 		slave.connection.write('Generate Log 100');
// 		slave.connection.write('grep rare');
// 	}
// 	else if( numTests == 2 && numSubTests == 3*numMachines)
// 	{
// 		numTests--;
// 		if (rareResult == 'Pass' && someResult == 'Pass' && oftenResult == 'Pass') {
// 			console.log('Key value pairs of 100MB file testing: PASS');
// 		}
// 		else {	
// 			console.log('Key value pairs of 100MB file testing: FAIL');
// 		}
// 		rareResult = 'Fail', someResult = 'Fail' , oftenResult = 'Fail';
// 		slave.connection.write('Generate Log 1000');
// 		slave.connection.write('grep rare');
// 	}
// 	else if( numTests <= 1 && numSubTests == 3*numMachines)
// 	{
// 		if (rareResult == 'Pass' && someResult == 'Pass' && oftenResult == 'Pass') {
// 			console.log('Key value pairs of 1GB file testing: PASS');
// 		}
// 		else {	
// 			console.log('Key value pairs of 1GB file testing: FAIL');
// 		}
// 		rareResult = 'Fail', someResult = 'Fail' , oftenResult = 'Fail';
// 		slave.connection.end();
// 	}

// 	if (numSubTests == 2*numMachines) {
// 		slave.connection.write('grep often');
// 	}
// 	else if (numSubTests == 1*numMachines) {
// 		slave.connection.write('grep some')
// 	}

// }

