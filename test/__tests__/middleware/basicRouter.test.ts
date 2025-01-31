import parse from 'url-parse';

import { Router, Route, RouterURL } from '../../../src/middleware/router';
import Road from '../../../src/core/road';
import Response from '../../../src/core/response';
import { Context } from '../../../src/core/road';

import { describe, expect, test, assert } from 'vitest';
import { NextCallback } from '../../../src/core/requestChain';

const router_file_test_path = `${__dirname  }/../../resources/_router_file_test.js`;

describe('Router Tests', () => {
	/**
	 *
	 */
	test('test addRoute adds values to the list of routes in the right format', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'GET';
		const fn: Route<Context> = () => { return Promise.resolve(new Response(''));};

		router.addRoute(method, path, fn);
		expect({
			path: path,
			method: method,
			route: fn
		}).toEqual(router['_routes'][0]);
	});

	/**
	 *
	 */
	test('test addRoute adds middleware to the route', () => {
		expect.assertions(1);

		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		expect(road['_request_chain'].length()).toEqual(1);
	});

	/**
	 *
	 */
	test('test middleware function routes successfully to successful routes', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		router['_middleware'].call({}, router['_routes'], method, path, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	test('test middleware function 405s when route exists but method is not present', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute('POST', path, () => assert.fail('POST route should not run'));
		return expect(router['_middleware'].call({}, router['_routes'], 'GET', path, '', {}, next))
			.resolves.toEqual(new Response('Method Not Allowed', 405));
	});

	test('test middleware function routes successfully to successful routes with x-http-method-override header', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'POST';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute('PUT', path, fn);
		router.addRoute('POST', path, () => assert.fail('POST route should not run'));
		router['_middleware'].call({}, router['_routes'], method, path, '', {
			'x-http-method-override': 'PUT'
		}, next);

		expect(route_hit).toEqual(true);
	});

	test('test middleware function routes ignores x-http-method-override header on GET requests', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute('GET', path, fn);
		router.addRoute('PUT', path, () => assert.fail('PUT route should not run'));
		router['_middleware'].call({}, router['_routes'], method, path, '', {
			'x-http-method-override': 'PUT'
		}, next);

		expect(route_hit).toEqual(true);
	});

	test('test middleware function routes successfully to successful routes with _method query param', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'POST';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute('PUT', path, fn);
		router.addRoute('POST', path, () => assert.fail('POST route should not run'));
		router['_middleware'].call({}, router['_routes'], method, `${path}?_method=PUT`, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	test('test middleware function routes successfully ignores _method query param on GET requests', () => {
		expect.assertions(1);

		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response('{"route_hit": true}'));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute('GET', path, fn);
		router.addRoute('PUT', path, () => assert.fail('PUT route should not run'));

		router['_middleware'].call({}, router['_routes'], method, `${path}?_method=PUT`, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	/**
	 *
	 */
	test(`test middleware function routes successfully to successful routes
	only once when there may be more than one route`, () => {
		expect.assertions(1);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		const fn2 = () => {
			route_hit = false;
			return Promise.resolve(new Response(''));
		};

		const next: NextCallback = () => {
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		router.addRoute(method, path, fn2);
		router['_middleware'].call({}, router['_routes'], method, path, '', {}, next);

		expect(route_hit).toEqual(true);
	});

	/**
	 *
	 */
	test('test middleware function routes to next on a missed url', () => {
		expect.assertions(2);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		let next_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		router.addRoute('/foo', method, fn);
		router['_middleware'].call({}, router['_routes'], method, path, '', {}, () => {
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
		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		let next_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		router.addRoute(path, 'PUT', fn);
		router['_middleware'].call({}, router['_routes'], method, path, '', {}, () => {
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
		expect.assertions(4);

		const router = new Router();
		const path = '/';
		const method = 'GET';
		const body = '{"harvey": "birdman"}';
		const headers = {bojack: 'horseman'};

		const route: Route<Context> = (request_method, request_url, request_body, request_headers) => {
			expect(request_method).toEqual(method);
			// parsed url
			expect(request_url).toEqual(parse(path, true));
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);

			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path,route);

		router['_middleware'].call({}, router['_routes'], method, path, body, headers, () => {
			return Promise.resolve(new Response(''));
		});
	});

	/**
	 *
	 */
	test('test route function with numeric template gets the proper context and arguments', () => {
		expect.assertions(4);
		const router = new Router();
		const path = '/#numeric';
		const req_path = '/12345';
		const method = 'GET';
		const body = '{"harvey": "birdman"}';
		const headers = {bojack: 'horseman'};

		const route: Route<Context> = (request_method, request_url, request_body, request_headers) => {
			expect(request_method).toEqual(method);
			// parsed url
			const parsed_url: RouterURL = parse(req_path, true);
			parsed_url.args = {numeric: 12345};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect( request_headers).toEqual(headers);

			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, route);

		router['_middleware'].call({}, router['_routes'], method, req_path, body, headers, () => {
			return Promise.resolve(new Response(''));
		});
	});

	/**
	 *
	 */
	test('test route function with string template gets the proper context and arguments', () => {
		expect.assertions(4);
		const router = new Router();
		const path = '/$string';
		const req_path = '/hello';
		const method = 'GET';
		const body = '{"harvey": "birdman"}';
		const headers = {bojack: 'horseman'};

		const route: Route<Context> = (request_method, request_url, request_body, request_headers) => {
			expect(request_method).toEqual(method);
			// parsed url
			const parsed_url: RouterURL = parse(req_path, true);
			parsed_url.args = {string: 'hello'};
			expect(request_url).toEqual(parsed_url);
			// passthrough request body
			expect(request_body).toEqual(body);
			// passthrough headers
			expect(request_headers).toEqual(headers);
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, route);

		router['_middleware'].call({}, router['_routes'], method, req_path, body, headers, () => {
			return Promise.resolve(new Response(''));
		});
	});

	/**
	 *
	 */
	test('test route that throws an exception is handled properly', () => {
		expect.assertions(1);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		const error_message = 'blah blah blah';
		const fn = () => {
			throw new Error(error_message);
		};

		router.addRoute(method, path, fn);
		return expect(() => {
			return router['_middleware'].call({}, router['_routes'], method, path, '', {}, () => {
				return Promise.resolve(new Response(''));
			});
		}).rejects.toThrow(new Error(error_message));
	});

	/**
	 *
	 */
	test('test route successfully returns value out of the middleware', () => {
		expect.assertions(2);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		const fn: Route<Context> = () => {
			return Promise.resolve(new Response('route'));
		};

		router.addRoute(method, path, fn);
		const route_hit: Promise<Response | string> = router['_middleware'].call(
			{}, router['_routes'], method, path, '', {}, () => {
				return Promise.resolve(new Response(''));
			}
		);

		route_hit.then((response: Response | string) => {
			expect(response).toBeInstanceOf(Response);
			expect((response as Response).body).toEqual('route');
		});
	});

	/**
	 *
	 */
	test('test next successfully returns value out of the middleware', () => {
		expect.assertions(2);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		const fn: Route<Context> = () => {
			return Promise.resolve(new Response('true'));
		};

		router.addRoute(path, 'PUT', fn);
		const route_hit: Promise<Response | string> = router['_middleware'].call(
			{}, router['_routes'], method, path, '', {}, () => {
				return Promise.resolve(new Response('next'));
			}
		);

		route_hit.then((response: Response | string) => {
			expect(response).toBeInstanceOf(Response);
			expect((response as Response).body).toEqual('next');
		});

	});

	/**
	 *
	 */
	test('test applyMiddleware can call the middleware properly', () => {
		expect.assertions(1);

		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		const path = '/';
		const method = 'GET';
		let route_hit = '';
		const fn: Route<Context> = () => {
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

		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		const path = '/';
		const method = 'GET';
		let route_hit = '';
		const fn: Route<Context> = () => {
			route_hit = 'route';
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, fn);
		road.request(method, `${path  }?foo=bar`);

		expect(route_hit).toEqual('route');
	});

	test('test routes loaded from a file', () => {
		expect.assertions(5);

		const road = new Road();
		const router = new Router();
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

					expect(results[3]).toEqual(new Response('Method Not Allowed', 405));

					expect(results[4]).toEqual(new Response('Page not found', 404));
				});
			});
	});


	test('test routes loaded from a file with prefix', () => {
		expect.assertions(5);
		const road = new Road();
		const router = new Router();
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

					expect(results[3]).toEqual(new Response('Method Not Allowed', 405));

					expect(results[4]).toEqual(new Response('Page not found', 404));
				});
			});
	});

	test('test routes using a request chain successfully progress through the chain', () => {
		expect.assertions(3);
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		const path = '/';
		const method = 'GET';
		let route_hit = '';
		const fn: Route<Context> = async (method, url, body, headers, next) => {
			// this logged undefined undefined [Function (anonymous)] undefined undefined
			console.log(method, url, body, headers, next);
			const result = await next();

			if (result instanceof Response) {
				return result;
			}

			return new Response(result);
		};

		const fn2: Route<Context> = (method, url, body, headers, next) => {
			route_hit = 'route';
			return Promise.resolve(new Response(''));
		};

		router.addRoute(method, path, [fn, fn2]);

		return road.request(method, path).then((response: Response) => {
			expect(route_hit).toEqual('route');
			expect(response).toBeInstanceOf(Response);
			expect(response.body).toEqual('');
		});
	});
});