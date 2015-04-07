"use strict";

var roads = require('../../index.js');
var url_module = require('url');

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadContextExists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.request('POST', '/');
			},
			POST : function (url, body, headers) {
				return response_string;
			}
		}
	}));

	road.request('GET', '/')
		.then(function (val) {
			test.equal(val, response_string);
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

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return next();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.equal(val, response_string);
			test.done();
		});
};

/**
 * Ensure that the request context is the context provided in the Road constructor
 */
exports.testRoadCoroutineContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return yield next();
	});

	road.request('GET', '/')
		.then(function (val) {
			test.equal(val, response_string);
			test.done();
		});
};

/**
 * Ensure that we can find the proper resource for a url
 */
exports.testRoadContextUniqueness = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var road = new roads.Road(new roads.Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	road.use(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return this.response_string;
		};

		this.response_string = (this.response_string ? this.response_string : '' )+ response_string;

		return yield next('data');
	});

	road.request('GET', '/')
		.then(function (val) {
			test.equal(val, response_string);
			test.done();
		});
};
