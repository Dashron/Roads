"use strict";

import * as Middleware from '../../../middleware';
let cors = Middleware.cors;

describe('Cors tests', () => {
	test('test kill slash doesn\'t break normal', () => {
		expect.assertions(1);
		return expect(cors({})).toBeInstanceOf(Function);
	});

	//test.skip('old cors tests. need to update these', () => {

// Temporarily deactivated. This is for the old cors middlware, which has been rewritten. These tests need to be rewritten.

/*
function makeCorsCall (allowed_origins, method, allowed_methods, allowed_headers, provide_origin, throw_error) {
	var url = '/';
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
}

/**
 * Ensure a basic valid preflight check works
 */
/*test(''test preflight request with cors and no settings']', () => {
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
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
	});
};


/**
 * Ensure a basic valid preflight check works
 */
/*test(''test preflight request with cors and origin allow list hits']', () => {
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
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
	});
};

/**
 * Ensure a basic valid preflight check works
 */
/*test(''test preflight request with cors and origin allow list misses']', () => {
	var origin = ['dashron.com'];
	var method = 'OPTIONS';
	var allowed_methods = ['GET', 'POST'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		console.log('response', response);
		test.fail();
	})
	.catch(function (err) {
		test.deepEqual(err, new roads.HttpError(origin.join(','), 403));
	});
};


/**
 * Ensure a non-cors options request still works
 */
/*test(''test options without origin isn\'t cors']', () => {
	var origin = '*';
	var method = 'OPTIONS';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
	.then(function (response) {
		test.deepEqual(response, { headers : {} });
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
	});
};

/**
 * Ensure a preflight check with a http method miss fails
 */
/*test('test preflight method miss with cors and no settings', () => {
	var origin = '*';
	var method = 'OPTIONS';
	var allowed_methods = ['POST'];
	var allowed_headers = [];
	makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
	.then(function (response) {
		console.log('response', response);
		test.fail();
	})
	.catch(function (err) {
		test.deepEqual(err, new roads.HttpError(allowed_methods, 405));
	});
};

/**
 * Ensure a normal request works
 */
/*test('test standard request with cors and no settings', () => {
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
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
	});
};

/**
 * Ensure a non-cors request still works
 */
/*test('test standard without origin isn\'t cors', () => {
	var origin = '*';
	var method = 'GET';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
	.then(function (response) {
		test.deepEqual(response, { headers : {} });
	})
	.catch(function (err) {
		console.log(err.stack);
		test.fail();
	});
};


/**
 * Ensure a normal request works
 */
/*test('test standard request with error thrown still sends cors headers', () => {
	var origin = '*';
	var method = 'GET';
	var allowed_methods = ['GET'];
	var allowed_headers = [];

	makeCorsCall(origin, method, allowed_methods, allowed_headers, true, true)
	.then(function (response) {
		console.log(response);
		test.fail();
	})
	.catch(function (err) {
		test.deepEqual(err.headers, {
			'Access-Control-Allow-Credentials' : true,
			'Access-Control-Allow-Origin' : '*'
		});

		test.equal(err.code, 403);
		test.equal(err.message, 'Forbidden');
	});
};*/
	//});
});
