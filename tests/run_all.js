"use strict";
console.log("start");
var Tester = require('./tester').Tester;

var tester = new Tester();
tester.runAll('/home/aaron/workspace/gfw2.js/tests/components/');

process.on('exit', function() {
	var passes = 0;
	var failures = 0;
	var call_count = 0;
	
	var i =0;
	var assertion = null;
	for(i = 0; i < tester.assertions.length; i++) {
		assertion = tester.assertions[i];
		passes += assertion.passes;
		failures += assertion.failures;
		call_count += assertion.call_count;
	}
	console.log("pass: " + passes);
	console.log("fail: " + failures);
	console.log("run: " + (passes+failures) + "/" + call_count);
	console.log("tests complete");
});
