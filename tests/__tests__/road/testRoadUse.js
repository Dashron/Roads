/*"use strict";

var roads = require('../../../index.js');
var url_module = require('url');

/**
 * Test that the use function returns itself for viable chaining
 */
/*test('testUseReturnsSelf', () => {
	var road = new roads.Road();

	test.equal(road.use(function (method, path, body, headers, next) {
		return next();
	}), road);

};
//*/