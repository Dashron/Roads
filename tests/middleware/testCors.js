"use strict";

const roads = require('../../index.js');
const url_module = require('url');

function makeCorsCall (allowed_origins, method, allowed_methods, allowed_headers, provide_origin, throw_error) {
	var url = url_module.parse('/');
	var body = {};
	var contents = {headers: {}};
	var headers = { 
		origin : 'localhost:8080',
		'access-control-request-method' : method === 'OPTIONS' ? 'GET' : method
	};
	var next = null;

	if (!provide_origin) {
		delete headers.origin;
	}

	var context = {
		http_methods : allowed_methods,
		Response : roads.Response
	};

	if (throw_error) {
		next = function () {
			return new Promise(function (accept, reject) {
				reject(new roads.HttpError('Forbidden', roads.HttpError.forbidden));
			});
		};
	} else {
		next = function () {
			return new Promise(function (accept, reject) {
				accept(contents);
			});
		};
	}

	return roads.middleware.cors(allowed_origins, allowed_headers).call(context, method, url, body, headers, next);
};

/**
 * Ensure a basic valid preflight check works
 */
exports.testPreflightRequestWithCorsAndNoSettings = function (test) {
	var origin = '*';
	var method = 'OPTIONS';
	var allowed_methods = ['GET', 'POST'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		test.deepEqual(response, {
			body: null,
			status: 200,
			headers: {
				'Access-Control-Allow-Methods' : allowed_methods.join(', '),
				'Access-Control-Allow-Headers' : allowed_headers.join(', '),
				'Access-Control-Allow-Origin' : origin,
				'Access-Control-Allow-Credentials' : true
			}
		});
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
		test.done();
	});
};


/**
 * Ensure a basic valid preflight check works
 */
exports.testPreflightRequestWithCorsAndOriginAllowListHits = function (test) {
	var origin = ['localhost:8080', 'dashron.com'];
	var method = 'OPTIONS';
	var allowed_methods = ['GET', 'POST'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		test.deepEqual(response, {
			body: null,
			status: 200,
			headers: {
				'Access-Control-Allow-Methods' : allowed_methods.join(', '),
				'Access-Control-Allow-Headers' : allowed_headers.join(', '),
				'Access-Control-Allow-Origin' : 'localhost:8080',
				'Access-Control-Allow-Credentials' : true
			}
		});
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
		test.done();
	});
};

/**
 * Ensure a basic valid preflight check works
 */
exports.testPreflightRequestWithCorsAndOriginAllowListMisses = function (test) {
	var origin = ['dashron.com'];
	var method = 'OPTIONS';
	var allowed_methods = ['GET', 'POST'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		console.log('response', response);
		test.fail();
		test.done();
	})
	.catch(function (err) {
		test.deepEqual(err, new roads.HttpError(origin.join(','), 403));
		test.done();
	});
};


/**
 * Ensure a non-cors options request still works
 */
exports.testOptionsWithoutOriginIsntCors = function (test) {
	var origin = '*';
	var method = 'OPTIONS';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
	.then(function (response) {
		test.deepEqual(response, { headers : {} });
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
		test.done();
	});
};

/**
 * Ensure a preflight check with a http method miss fails
 */
exports.testPreflightMethodMissWithCorsAndNoSettings = function (test) {
	var origin = '*';
	var method = 'OPTIONS';
	var allowed_methods = ['POST'];
	var allowed_headers = [];
	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		console.log('response', response);
		test.fail();
		test.done();
	})
	.catch(function (err) {
		test.deepEqual(err, new roads.HttpError(allowed_methods, 405));
		test.done();
	});
};

/**
 * Ensure a normal request works
 */
exports.testStandardRequestWithCorsAndNoSettings = function (test) {
	var origin = '*';
	var method = 'GET';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		test.deepEqual(response, {
			headers: {
				'Access-Control-Allow-Credentials' : true,
				'Access-Control-Allow-Origin' : '*'
			}
		});
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
		test.done();
	});
};

/**
 * Ensure a non-cors request still works
 */
exports.testStandardWithoutOriginIsntCors = function (test) {
	var origin = '*';
	var method = 'GET';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
	.then(function (response) {
		test.deepEqual(response, { headers : {} });
		test.done();
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
		test.done();
	});
};


/**
 * Ensure a normal request works
 */
exports.testStandardRequestWithErrorThrownStillSendsCorsHeaders = function (test) {
	var origin = '*';
	var method = 'GET';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true, true)
	.then(function (response) {
		console.log(response);
		test.fail();
		test.done();
	})
	.catch(function (err) {
		test.deepEqual(err.headers, {
			'Access-Control-Allow-Credentials' : true,
			'Access-Control-Allow-Origin' : '*'
		});

		test.equal(err.code, 403);
		test.equal(err.message, 'Forbidden');
		test.done();
	});
};