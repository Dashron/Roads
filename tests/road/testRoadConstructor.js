"use strict";

var roads = require('../../index.js');


module.exports.testEmptyConstructorFails = function (test) {
	let road = new roads.Road();
	test.done();
};