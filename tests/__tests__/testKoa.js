/*"use strict";

const koaIntegration = require('../../index.js').integrations.koa;
const KoaModule = require('koa');
const http = require('http');
const KOA_PORT = 3456;
const Response = require('../../index.js').Response;
const cookie = require('../../index.js').middleware.cookie;

function koa() {
	var k = new KoaModule();
	k.on('error', function () {
		// do not log
	});
	return k;
}

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
/*test('testMiddlewareReturnsFunction', () => {
	let road = buildMockRoad();

	test.equals(typeof(koaIntegration(road)), 'function');
};

/**
 * Tests that the middleware is received properly by Koa
 */
/*test('testMiddlewareIsAcceptedByKoa', () => {
	let road = buildMockRoad();
	let app = koa();

	app.use(koaIntegration(road));
};

/**
 * Ensure that if koa is already planning on sending a response body, roads won't intercept it
 */
/*test('testKoaUpdateToBodyWontRoute', () => {
	let road = buildMockRoad();
	let app = koa();
	app.use(async function (ctx) {
		ctx.body = 'blah blah';
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals('blah blah', response.body);
		server.close();
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that if koa is already planning on sending a response status (besides 404), roads won't intercept it.
 * 404 is the only way I can find right now to tell if koa handled the response, and I think it's a good identifier
 * because 404 means koa couldn't find anything. It's possible roads will.
 */
/*test('testKoaUpdateToStatusCodeWontRoute', () => {
	let road = buildMockRoad();
	let app = koa();
	app.use(async function (ctx) {
		ctx.status = 400;
	});

	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equals(400, response.status);
		server.close();
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that status codes sent out of roads are properly applied to the koa response
 */
/*test('testRoadsStatusCodeIsAppliedToKoa', () => {
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
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that bodies sent out of roads are properly applied to the koa response
 */
/*test('testRoadsBodyIsAppliedToKoa', () => {
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
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that headers sent out of roads are properly applied to the koa response
 */
/*test('testRoadsHeadersAreAppliedToKoa', () => {
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
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that cookies sent out of roads are properly applied to the koa response
 */
/*test('testRoadsCookiesAreAppliedToKoa', () => {
	var ctx = {
		Response: Response
	};
	let app = koa();	

	// apply cookie middleware to context
	cookie().call(ctx, 'get', '/', '', {}, function () {});

	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			let res = new this.Response('hello, 200');

			// Note: Koa defaults to httponly but the cookie library included with roads does not.
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
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that when roads fails via error, koa throws a 500
 */
/*test('testRoadsErrorFailKoa', () => {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			reject(new Error('rejection'));
		});
	});

	
	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equal(response.status, 500);
		server.close();
	} , function (err) {
		server.close();
		test.fail(err);
	});
};

/**
 * Ensure that when roads fails via rejection, koa throws a 500
 */
/*test('testRoadsPromiseRejectionsFailKoa', () => {
	let app = koa();
	let road = buildMockRoad(function () {
		return new Promise((accept, reject) => {
			reject(new Error('rejection'));
		});
	});

	
	app.use(koaIntegration(road));
	let server = app.listen(KOA_PORT);

	GET('/').then(function (response) {
		test.equal(response.status, 500);
		server.close();
	} , function (err) {
		server.close();
		test.fail(err);
	});
};
//*/