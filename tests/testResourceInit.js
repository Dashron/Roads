"use strict";

var Resource = require('../lib/resource');
var API = require('../lib/api');
var url_module = require('url');
var Promise = require('bluebird');

/**
 * Ensure that the request context is the context provided in the API constructor
 */
exports.testResourceInit = function (test) {
	var init_string = null;

	var api = new API(new Resource({
		init : function () {
			init_string = 'blahblahwhatwhatwhat';
		}
	}));

	test.equal(init_string, 'blahblahwhatwhatwhat');	
	test.done();
};

/**
 * Ensure that we can find the proper resource for a url
 */
exports.testResourceInitWithContext = function (test) {
	var init_string = null;

	var api = new API(new Resource({
		init: function (url, body, headers, extras) {
			init_string = this.getString();
		}
	}), {
		getString : function () {
			return 'blahblahwhatwhatwhat';
		}
	});

	test.equal(init_string, 'blahblahwhatwhatwhat');
	test.done();
};
