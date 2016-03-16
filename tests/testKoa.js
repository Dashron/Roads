"use strict";

const koaIntegration = require('../index.js').integrations.koa;
const koa = require('koa');
const cr = require('roads-coroutine');
const http = require('http');
const KOA_PORT = 3456;
const Response = require('../index.js').Response;
const cookie = require('../index.js').middleware.cookie;

function buildMockRoad(route, ctx) {
	if (!route) {
		route = function (method, path, body, headers) {
			return new Promise(function (accept, reject) {
				accept('banana');
			});
		};
	}

	if (!ctx) {
		ctx = {};
	}

	return {
		request: route.bind(ctx)
	};
}

let GET = function GET(path) {
	return new Promise(function (accept, reject) {
		http.get('http://localhost:' + KOA_PORT + path, (res) => {
			let body = '';

			res.on('readable', () => {
		  		let chunk = null;
				while (null !== (chunk = res.read())) {
					body += chunk;
				}
			});

			res.on('end', () => {
				accept({
					body: body,
					status: res.statusCode,
					headers: res.headers
				});
			});
		}).on('error', (e) => {
			reject(e);
		});
	});
};

/**
 * Tests that the provided road's request method is bound to the 
 * original road's context under the provided key
 */
exports.testMiddlewareReturnsFunction = function (test) {
	let road = buildMockRoad();

	test.equals(typeof(koaIntegration(road)), 'function');
	test.done();
};

/**
 * Tests that the middleware is received properly by Koa
 */
exports.testMiddlewareIsAcceptedByKoa = function (test) {
	let road = buildMockRoad();
	let app = koa();

	app.use(koaIntegration(road));
	test.done();
};

/**
 * Ensure that if koa is already planning on sending a response body, roads won't intercept it
 */
exports.testKoaUpdateToBodyWontRoute = function (test) {
	let road = buildMockRoad();
	let app = koa();
	app.use(function* () {
		this.body = 'blah blah';
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals('blah blah', response.body);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that if koa is already planning on sending a response status (besides 404), roads won't intercept it.
 * 404 is the only way I can find right now to tell if koa handled the response, and I think it's a good identifier
 * because 404 means koa couldn't find anything. It's possible roads will.
 */
exports.testKoaUpdateToStatusCodeWontRoute = function (test) {
	let road = buildMockRoad();
	let app = koa();
	app.use(function* () {
		this.status = 400;
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals(400, response.status);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that status codes sent out of roads are properly applied to the koa response
 */
exports.testRoadsStatusCodeIsAppliedToKoa = function (test) {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise(function (accept, reject) {
			accept(new Response('', 429));
		});
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals(429, response.status);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that bodies sent out of roads are properly applied to the koa response
 */
exports.testRoadsBodyIsAppliedToKoa = function (test) {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise(function (accept, reject) {
			accept(new Response('success', 429));
		});
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals('success', response.body);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that headers sent out of roads are properly applied to the koa response
 */
exports.testRoadsHeadersAreAppliedToKoa = function (test) {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise(function (accept, reject) {
			accept(new Response('', 200, {
				'x-test-status': 'success',
				'x-test-status2': 'success2'
			}));
		});
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals('success', response.headers['x-test-status']);
		test.equals('success2', response.headers['x-test-status2']);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that cookies sent out of roads are properly applied to the koa response
 */
exports.testRoadsCookiesAreAppliedToKoa = function (test) {
	var ctx = {
		Response: Response
	};
	let app = koa();	

	// apply cookie middleware to context
	cookie().call(ctx, 'get', '/', '', {}, function () {});

	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			let res = new this.Response('hello, 200');

			res.setCookie('cookie1', 'success', {domain: 'foo.bar'});
			res.setCookie('cookie2', 'success2', {domain: 'foo2.bar'});

			accept(res);
		});
	}, ctx);

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.deepEqual(response.headers['set-cookie'], [
			'cookie1=success; path=/; domain=foo.bar; httponly',
			'cookie2=success2; path=/; domain=foo2.bar; httponly'
		]);

		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that when roads fails via error, koa throws a 500
 */
exports.testRoadsErrorFailKoa = function (test) {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			reject();
		});
	});

	
	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equal(response.status, 500);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};

/**
 * Ensure that when roads fails via rejection, koa throws a 500
 */
exports.testRoadsPromiseRejectionsFailKoa = function (test) {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			reject(res);
		});
	});

	
	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equal(response.status, 500);
		server.close();
		test.done();
	} , function (err) {
		server.close();
		test.fail(err);
		test.done();
	});
};