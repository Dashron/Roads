"use strict";

const url_module = require('url');
const SimpleRouter = require('../../../built/index.js').middleware.SimpleRouter;
const buildRouter = function buildRouter() {
	return new SimpleRouter();
};

const router_file_test_path = __dirname + '/../../resources/_router_file_test.js';

const buildMockRoad = function buildMockRoad() {
	return {
		addRouteArgs: [],
		useArgs: [],
		contextValues: {},
		use: function () {
			this.useArgs.push(Array.prototype.slice.call(arguments)[0]);
		},
		request: function (index) {
			return this.useArgs[index].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
};

describe('Simple Router Tests', () => {
	/**
	 * 
	 */
	test('test addRoute adds values to the list of routes in the right format', () => {
		expect.assertions(1);

		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let fn = () => {};

		router.addRoute(method, path, fn);
		expect({
			path: path,
			method: method,
			fn: fn
		}).toEqual(router.routes[0]);
	});

	/**
	 * 
	 */
	test('test addRoute adds middleware to the route', () => {
		expect.assertions(1);

		let mockRoad = buildMockRoad();
		let router = buildRouter();
		router.applyMiddleware(mockRoad);

		expect(mockRoad.useArgs.length).toEqual(1);
	});

	/**
	 * 
	 */
	test('test middleware function routes successfully to successful routes', () => {
		expect.assertions(1);

		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = true;
		};

		router.addRoute(method, path, fn);
		router._middleware(router.routes, method, path, {}, {}, () => {});

		expect(route_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes successfully to successful routes only once when there may be more than one route', () => {
		expect.assertions(1);
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = true;
		};

		let fn2 = () => {
			route_hit = false;
		};

		router.addRoute(method, path, fn);
		router.addRoute(method, path, fn2);
		router._middleware(router.routes, method, path, {}, {}, () => {});

		expect(route_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes to next  on a missed url', () => {
		expect.assertions(2);
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let next_hit = false;
		let fn = () => {
			route_hit = true;
		};

		router.addRoute("/foo", method, fn);
		router._middleware(router.routes, method, path, {}, {}, () => {
			next_hit = true;
		});

		expect(route_hit).toEqual(false);
		expect(next_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes to next on a missed http method but matching url', () => {
		expect.assertions(2);
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let next_hit = false;
		let fn = () => {
			route_hit = true;
		};

		router.addRoute(path, "PUT", fn);
		router._middleware(router.routes, method, path, {}, {}, () => {
			next_hit = true;
		});

		expect(route_hit).toEqual(false);
		expect(next_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test route function with no template gets the proper context and arguments', () => {
		expect.assertions(3);

		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		router.addRoute(method, path, (request_url, request_body, request_headers) => {
			// parsed url
			expect(request_url).toEqual(url_module.parse(path, true));
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);
			
		});

		router._middleware(router.routes, method, path, body, headers, () => {});
	});

	/**
	 * 
	 */
	test('test route function with numeric template gets the proper context and arguments', () => {
		expect.assertions(3);
		let router = buildRouter();
		let path = '/#numeric';
		let req_path = '/12345';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		router.addRoute(method, path, (request_url, request_body, request_headers) => {
			// parsed url
			let parsed_url = url_module.parse(req_path, true);
			parsed_url.args = {numeric: 12345};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect( request_headers).toEqual(headers);
			
		});

		router._middleware(router.routes, method, req_path, body, headers, () => {});
	});

	/**
	 * 
	 */
	test('test route function with string template gets the proper context and arguments', () => {
		expect.assertions(3);
		let router = buildRouter();
		let path = '/$string';
		let req_path = '/hello';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		router.addRoute(method, path, (request_url, request_body, request_headers) => {
			// parsed url
			let parsed_url = url_module.parse(req_path, true);
			parsed_url.args = {string: 'hello'};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);
			
		});

		router._middleware(router.routes, method, req_path, body, headers, () => {});
	});

	/**
	 * 
	 */
	test('test route that throws an exception is handled properly', () => {
		expect.assertions(1);
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let error_message = "blah blah blah";
		let fn = () => {
			throw new Error(error_message);
		};

		router.addRoute(method, path, fn);
		expect(() => {
			router._middleware(router.routes, method, path, {}, {}, () => {});
		}).toThrow(new Error(error_message));
	});

	/**
	 * 
	 */
	test('test route successfully returns value out of the middleware', () => {
		expect.assertions(1);
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			return 'route';
		};

		router.addRoute(method, path, fn);
		route_hit = router._middleware(router.routes, method, path, {}, {}, () => {});

		expect(route_hit).toEqual('route');
	});

	/**
	 * 
	 */
	test('test next successfully returns value out of the middleware', () => {
		let router = buildRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			return true;
		};

		router.addRoute(path, 'PUT', fn);
		route_hit = router._middleware(router.routes, method, path, {}, {}, () => {
			return 'next';
		});

		expect(route_hit).toEqual('next');
		
	});

	/**
	 * 
	 */
	test('test applyMiddleware can call the middleware properly', () => {
		expect.assertions(1);

		let mockRoad = buildMockRoad();
		let router = buildRouter();
		router.applyMiddleware(mockRoad);

		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = 'route';
		};

		router.addRoute(method, path, fn);
		mockRoad.request(0, method, path, {}, {}, () => {});

		expect(route_hit).toEqual('route');
	});

	/**
	 * 
	 */
	test('test routes with query params route properly', () => {
		expect.assertions(1);

		let mockRoad = buildMockRoad();
		let router = buildRouter();
		router.applyMiddleware(mockRoad);

		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = 'route';
		};

		router.addRoute(method, path, fn);
		mockRoad.request(0, method, path + '?foo=bar', {}, {}, () => {});

		expect(route_hit).toEqual('route');
	});

	test('test routes loaded from a file', () => {
		expect.assertions(5);

		let mockRoad = buildMockRoad();
		let router = buildRouter();
		router.applyMiddleware(mockRoad);

		router.addRouteFile(router_file_test_path);

		// todo: this probably isn't the right way for jest
		return Promise.all([
			mockRoad.request(0, 'GET', '/', {}, {}, () => {}),
			mockRoad.request(0, 'POST', '/', {}, {}, () => {}),
			mockRoad.request(0, 'GET', '/test', {}, {}, () => {}),
			//Bad Method
			mockRoad.request(0, 'POST', '/test', {}, {}, () => {}),
			//Bad Path
			mockRoad.request(0, 'GET', '/fakeurl', {}, {}, () => {})
		]).then(results => {
			expect(results[0]).toEqual('root get successful');
			expect(results[1]).toEqual('root post successful');
			expect(results[2]).toEqual('test get successful');

			expect(results[3]).toEqual(undefined);

			expect(results[4]).toEqual(undefined);
		});	
	});


	test('test routes loaded from a file with prefix', () => {
		expect.assertions(5);
		let mockRoad = buildMockRoad();
		let router = buildRouter();
		router.applyMiddleware(mockRoad);

		router.addRouteFile(router_file_test_path, '/test_prefix');

		// todo: this probably isn't the right way for jest
		return Promise.all([
			mockRoad.request(0, 'GET', '/test_prefix', {}, {}, () => {}),
			mockRoad.request(0, 'POST', '/test_prefix', {}, {}, () => {}),
			mockRoad.request(0, 'GET', '/test_prefix/test', {}, {}, () => {}),
			//Bad Method
			mockRoad.request(0, 'POST', '/test_prefix/test', {}, {}, () => {}),
			//Bad Path
			mockRoad.request(0, 'GET', '/test_prefix/fakeurl', {}, {}, () => {})
		]).then(results => {
			expect(results[0]).toEqual('root get successful');
			expect(results[1]).toEqual('root post successful');
			expect(results[2]).toEqual('test get successful');

			expect(results[3]).toEqual(undefined);

			expect(results[4]).toEqual(undefined);
		});	
	});
});