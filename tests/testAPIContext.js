"use strict";

var Resource = require('../lib/resource');
var API = require('../lib/api');
var url_module = require('url');
var Promise = require('bluebird');

/**
 * Ensure that the request context is the context provided in the API constructor
 */
exports.testAPIContext = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
			methods : {
				GET : function (url, body, headers) {
					return this.confirmTrue();
				}
			}
	}), {
		confirmTrue : function () {
			return response_string;
		}
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
exports.testAPIOnRequestContext = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
			methods : {
				GET : function (url, body, headers, extras) {
					return this.confirmValue(extras);
				}
			}
	}), {
		confirmValue : function (extras) {
			if ('data' === extras) {
				return response_string;
			}
		}
	});

	api.onRequest(function* (method, url, body, headers, next) {
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
exports.testAPIOnRequestParametersContext = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
			methods : {
				GET : function (url, body, headers, extras) {
					return this.confirmUrl(url, body, headers ,extras);
				},
				POST : function (url, body, headers, extras) {
					throw new Error('this should not be called');
				}
			}
	}), {
		confirmUrl : function (url, body, headers, extras) {
			if ((url.path === '/') && 
					(typeof body === "undefined") && 
					(typeof headers === "object") && 
					(Object.keys(headers).length === 0) &&
					(extras === "data")) {
				return response_string;
			}
		}
	});

	api.onRequest(function* (method, url, body, headers, next) {
		return yield next('data');
	});

	api.request('GET', '/')
		.then(function (val) {
			test.equal(val.data, response_string);
			test.done();
		});
};

/**
 * Ensure that the request method applied to the provided context works as expected
 */
exports.testAPIContextRequestMethodWithProvidedContext = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
			methods : {
				GET : function (url, body, headers, extras) {
					return this.request('PATCH', '/');
				},
				POST : function (url, body, headers, extras) {
					throw new Error('this should not be called');
				},
				PATCH : function (url, body, headers, extras) {
					return response_string;
				}
			}
	}), {
		confirmUrl : function (url, body, headers, extras) {
			return (url.path === '/') && 
					(typeof body === "undefined") && 
					(typeof headers === "object") && 
					(Object.keys(headers).length === 0) &&
					(extras === "data");
		}
	});

	api.request('GET', '/')
		.then(function (val) {
			test.equal(val.data, response_string);
			test.done();
		});
};

/**
 * Ensure that the request method applied to the context works as expected
 */
exports.testAPIContextRequestMethod = function (test) {
	var response_string = 'blahblahwhatwhatwhat';

	var api = new API(new Resource({
			methods : {
				GET : function (url, body, headers, extras) {
					return this.request('PATCH', '/');
				},
				POST : function (url, body, headers, extras) {
					throw new Error('this should not be called');
				},
				PATCH : function (url, body, headers, extras) {
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
