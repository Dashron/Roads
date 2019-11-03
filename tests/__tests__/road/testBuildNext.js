"use strict";

var roads = require('../../../src/index.js');
var url_module = require('url');


// Note: This file used to have many more tests, but a recent roads change invalidated most of them, and the migration to jest made it clear that many of them were 
// covered by other tests (context, multi use, etc)
describe('road buildNext test', () => {
	/**
	 * Test buildNext success when a route does not have an onRequest handler
	 */
	test('build next hits', () => {
		expect.assertions(1);

		var road = new roads.Road();
		return expect(road._buildNext('GET', url_module.parse('/'))()).resolves.toEqual(undefined);
	});
});