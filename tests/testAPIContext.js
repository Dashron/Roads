"use strict";

var Resource = require('../lib/resource');
var API = require('../lib/api');
var url_module = require('url');
var Promise = require('bluebird');

/**
 * Ensure that the request context is the context provided in the API constructor
 */
exports.testAPIContextExists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.request('POST', '/');
			},
			POST : function (url, body, headers) {
				return response_string;
			}
		}
	}));

	api.request('GET', '/')
		.then(function (val) {
			test.equal(val.data, response_string);
			test.done();
		});
};

/**
 * Ensure that the request context is the context provided in the API constructor
 */
exports.testAPIContextPersists = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	api.onRequest(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return response_string;
		};

		return yield next('data');
	});

	api.request('GET', '/')
		.then(function (val) {
			test.equal(val.data, response_string);
			test.done();
		});
};

/**
 * Ensure that we can find the proper resource for a url
 */
exports.testAPIContextUniqueness = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
		methods : {
			GET : function (url, body, headers) {
				return this.confirmString();
			}
		}
	}));

	api.onRequest(function* (method, url, body, headers, next) {
		this.confirmString = function () {
			return this.response_string;
		};

		this.response_string = (this.response_string ? this.response_string : '' )+ response_string;

		return yield next('data');
	});

	api.request('GET', '/')
		.then(function (val) {
			test.equal(val.data, response_string);
			test.done();
		});
};