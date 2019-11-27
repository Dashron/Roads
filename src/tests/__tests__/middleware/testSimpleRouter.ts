"use strict";

import * as url_module from "url";
import SimpleRouter, { Route, SimpleRouterURL } from '../../../middleware/simpleRouter';
import Response from "../../../response";
import Road, { ResponseMiddleware } from "../../../road";
import { promises } from "fs";
const router_file_test_path = __dirname + '/../../resources/_router_file_test.js';

describe('Simple Router Tests', () => {
	/**
	 * 
	 */
	test('test addRoute adds values to the list of routes in the right format', () => {
		expect.assertions(1);

		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let fn: Route = () => { return Promise.resolve(new Response(''))};

		router.addRoute(method, path, fn);
		expect({
			path: path,
			method: method,
			route: fn
		}).toEqual(router.routes[0]);
	});

	/**
	 * 
	 */
	test('test addRoute adds middleware to the route', () => {
		expect.assertions(1);

		let road = new Road();
		let router = new SimpleRouter();
		router.applyMiddleware(road);

		expect(road["_request_chain"].length).toEqual(1);
	});

	/**
	 * 
	 */
	test('test middleware function routes successfully to successful routes', () => {
		expect.assertions(1);

		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		let next: ResponseMiddleware = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		router["_middleware"](router.routes, method, path, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes successfully to successful routes only once when there may be more than one route', () => {
		expect.assertions(1);
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		let fn2 = () => {
			route_hit = false;
			return Promise.resolve(new Response(''));
		};

		let next: ResponseMiddleware = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		router.addRoute(method, path, fn2);
		router["_middleware"](router.routes, method, path, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes to next  on a missed url', () => {
		expect.assertions(2);
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let next_hit = false;
		let fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		router.addRoute("/foo", method, fn);
		router["_middleware"](router.routes, method, path, '', {}, () => {
			next_hit = true;
			return Promise.resolve(new Response(''));
		});

		expect(route_hit).toEqual(false);
		expect(next_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test middleware function routes to next on a missed http method but matching url', () => {
		expect.assertions(2);
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit = false;
		let next_hit = false;
		let fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		router.addRoute(path, "PUT", fn);
		router["_middleware"](router.routes, method, path, '', {}, () => {
			next_hit = true;
			return Promise.resolve(new Response(''));
		});

		expect(route_hit).toEqual(false);
		expect(next_hit).toEqual(true);
	});

	/**
	 * 
	 */
	test('test route function with no template gets the proper context and arguments', () => {
		expect.assertions(3);

		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		let route: Route =  (request_url, request_body, request_headers) => {
			// parsed url
			expect(request_url).toEqual(url_module.parse(path, true));
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);
			
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path,route);

		router['_middleware'](router.routes, method, path, body, headers, () => {
			return Promise.resolve(new Response(''));
		});
	});

	/**
	 * 
	 */
	test('test route function with numeric template gets the proper context and arguments', () => {
		expect.assertions(3);
		let router = new SimpleRouter();
		let path = '/#numeric';
		let req_path = '/12345';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		let route: Route = (request_url, request_body, request_headers, next) => {
			// parsed url
			let parsed_url: SimpleRouterURL = url_module.parse(req_path, true);
			parsed_url.args = {numeric: 12345};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect( request_headers).toEqual(headers);
			
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, route);

		router['_middleware'](router.routes, method, req_path, body, headers, () => { return Promise.resolve(new Response(''));});
	});

	/**
	 * 
	 */
	test('test route function with string template gets the proper context and arguments', () => {
		expect.assertions(3);
		let router = new SimpleRouter();
		let path = '/$string';
		let req_path = '/hello';
		let method = 'GET';
		let body = '{"harvey": "birdman"}';
		let headers = {bojack: 'horseman'};

		let route: Route = (request_url, request_body, request_headers) => {
			// parsed url
			let parsed_url: SimpleRouterURL = url_module.parse(req_path, true);
			parsed_url.args = {string: 'hello'};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, route);

		router["_middleware"](router.routes, method, req_path, body, headers, () => { return Promise.resolve(new Response('')); });
	});

	/**
	 * 
	 */
	test('test route that throws an exception is handled properly', () => {
		expect.assertions(1);
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let error_message = "blah blah blah";
		let fn = () => {
			throw new Error(error_message);
		};

		router.addRoute(method, path, fn);
		expect(() => {
			router['_middleware'](router.routes, method, path, '', {}, () => { return Promise.resolve(new Response('')); });
		}).toThrow(new Error(error_message));
	});

	/**
	 * 
	 */
	test('test route successfully returns value out of the middleware', () => {
		expect.assertions(1);
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit: Promise<Response>;
		let fn: Route = () => {
			return Promise.resolve(new Response('route'));
		};

		router.addRoute(method, path, fn);
		route_hit = router['_middleware'](router.routes, method, path, '', {}, () => { return Promise.resolve(new Response('')); });

		route_hit.then((response: Response) => {
			expect(response.body).toEqual('route');
		});
	});

	/**
	 * 
	 */
	test('test next successfully returns value out of the middleware', () => {
		let router = new SimpleRouter();
		let path = '/';
		let method = 'GET';
		let route_hit: Promise<Response>;
		let fn: Route = () => {
			return Promise.resolve(new Response('true'));
		};

		router.addRoute(path, 'PUT', fn);
		route_hit = router['_middleware'](router.routes, method, path, '', {}, () => {
			return Promise.resolve(new Response('next'));
		});

		route_hit.then((response: Response) => {
			expect(response.body).toEqual('next');
		});
		
	});

	/**
	 * 
	 */
	test('test applyMiddleware can call the middleware properly', () => {
		expect.assertions(1);

		let road = new Road();
		let router = new SimpleRouter();
		router.applyMiddleware(road);

		let path = '/';
		let method = 'GET';
		let route_hit = '';
		let fn: Route = () => {
			route_hit = 'route';
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		road.request(method, path, '');

		expect(route_hit).toEqual('route');
	});

	/**
	 * 
	 */
	test('test routes with query params route properly', () => {
		expect.assertions(1);

		let road = new Road();
		let router = new SimpleRouter();
		router.applyMiddleware(road);

		let path = '/';
		let method = 'GET';
		let route_hit = '';
		let fn: Route = () => {
			route_hit = 'route';
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		road.request(method, path + '?foo=bar');

		expect(route_hit).toEqual('route');
	});

	test('test routes loaded from a file', () => {
		expect.assertions(5);

		let road = new Road();
		let router = new SimpleRouter();
		router.applyMiddleware(road);

		return router.addRouteFile(router_file_test_path)
			.then(() => {
				return Promise.all([
					road.request('GET', '/'),
					road.request('POST', '/'),
					road.request('GET', '/test'),
					//Bad Method
					road.request('POST', '/test'),
					//Bad Path
					road.request('GET', '/fakeurl')
				]).then(results => {
					expect(results[0]).toEqual(new Response('root get successful')) ;
					expect(results[1]).toEqual(new Response('root post successful'));
					expect(results[2]).toEqual(new Response('test get successful'));
		
					expect(results[3]).toEqual(new Response('Page not found', 404));
		
					expect(results[4]).toEqual(new Response('Page not found', 404));
				});
			});
	});


	test('test routes loaded from a file with prefix', () => {
		expect.assertions(5);
		let road = new Road();
		let router = new SimpleRouter();
		router.applyMiddleware(road);

		return router.addRouteFile(router_file_test_path, '/test_prefix')
			.then(() => {
				return Promise.all([
					road.request('GET', '/test_prefix'),
					road.request('POST', '/test_prefix'),
					road.request('GET', '/test_prefix/test'),
					//Bad Method
					road.request('POST', '/test_prefix/test'),
					//Bad Path
					road.request('GET', '/test_prefix/fakeurl')
				]).then(results => {
					expect(results[0]).toEqual(new Response('root get successful'));
					expect(results[1]).toEqual(new Response('root post successful'));
					expect(results[2]).toEqual(new Response('test get successful'));
		
					expect(results[3]).toEqual(new Response('Page not found', 404));
		
					expect(results[4]).toEqual(new Response('Page not found', 404));
				});
			})
	});
});