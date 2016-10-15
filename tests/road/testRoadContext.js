"use strict";

var roads = require('../../index.js');
var url_module = require('url');

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadContextContainsRequestMethod = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road();

	road.use(function (method, url, body, headers) {
		switch (method) {
			case "GET": 
				return this.request('POST', '/');
			case "POST":
				return response_string;
		}
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		})
		.catch(function (e) {
			console.log(e.stack);
			console.log('err');
		});
};

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road();

	road.use(function (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return next();
	});

	road.use(function (method, url, body, headers, next) {
		return this.confirmString();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		});
};

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadCoroutineContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road();

	road.use(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return yield next();
	});
	
	road.use(function (method, url, body, headers, next) {
		return this.confirmString();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.deepEqual(val, {
				status: 200,
				body: response_string,
				headers: {}
			});
			test.done();
		});
};

/**
 * Ensure that contexts are only added once to a resource.
 */
exports.testRoadContextUniqueness = function (test) {
	var road = new roads.Road();

	road.use(function* (method, url, body, headers, next) {
		return yield next();
	});

	test.equal(1, road._request_chain.length);
	test.done();
};