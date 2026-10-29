import { Router, Route, RouterURL } from '../../../src/middleware/router.js';
import Road from '../../../src/core/road.js';
import Response from '../../../src/core/response.js';
import { Context } from '../../../src/core/road.js';

import { describe, expect, test, assert } from 'vitest';
import { NextCallback } from '../../../src/core/requestChain.js';
import { parseUrl } from '../../../src/util/url.js';

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
			return Promise.resolve(new Response('Page not found', 404));
		};

		router.addRoute('POST', path, () => assert.fail('POST route should not run'));
		return expect(router['_middleware'].call({}, router['_routes'], 'GET', path, '', {}, next))
			.resolves.toEqual(new Response('Method Not Allowed', 405, { allow: 'POST' }));
	});

	test('test middleware function ignores the x-http-method-override header on POST requests', () => {
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

		router.addRoute('POST', path, fn);
		router.addRoute('PUT', path, () => assert.fail('PUT route should not run'));
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

	test('test middleware function ignores the _method query param on POST requests', () => {
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

		router.addRoute('POST', path, fn);
		router.addRoute('PUT', path, () => assert.fail('PUT route should not run'));
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

		router.addRoute(method, '/foo', fn);
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
	test('test middleware function routes to next on a missed http method but matching url', async () => {
		expect.assertions(3);
		const router = new Router();
		const path = '/';
		const method = 'GET';
		let route_hit = false;
		let next_hit = false;
		const fn = () => {
			route_hit = true;
			return Promise.resolve(new Response(''));
		};

		router.addRoute('PUT', path, fn);
		const response = await router['_middleware'].call({}, router['_routes'], method, path, '', {}, () => {
			next_hit = true;
			return Promise.resolve(new Response(''));
		});

		// Something later in the road handled the request, so its response is used instead of a 405
		expect(route_hit).toEqual(false);
		expect(next_hit).toEqual(true);
		expect(response).toEqual(new Response(''));
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
			expect(request_url).toEqual(parseUrl(path));
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
			const parsed_url: RouterURL = parseUrl(req_path);
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
			const parsed_url: RouterURL = parseUrl(req_path);
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

		router.addRoute(method, '/foo', fn);
		const route_hit: Promise<Response | string> = router['_middleware'].call(
			{}, router['_routes'], method, path, '', {}, () => {
				return Promise.resolve(new Response('next'));
			}
		);

		return route_hit.then((response: Response | string) => {
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

					expect(results[3]).toEqual(new Response('Method Not Allowed', 405, { allow: 'GET, HEAD' }));

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

					expect(results[3]).toEqual(new Response('Method Not Allowed', 405, { allow: 'GET, HEAD' }));

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
			const result = await next();

			if (result instanceof Response) {
				return result;
			}

			return new Response(result);
		};

		const fn2: Route<Context> = () => {
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

	test('test routes using a request chain rerun the rest of the chain when next is called twice', () => {
		expect.assertions(3);
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		const path = '/';
		const method = 'GET';
		let route_hits = 0;
		const fn: Route<Context> = async (method, url, body, headers, next) => {
			await next();
			const result = await next();

			if (result instanceof Response) {
				return result;
			}

			return new Response(result);
		};

		const fn2: Route<Context> = () => {
			route_hits += 1;
			return Promise.resolve(new Response('route'));
		};

		router.addRoute(method, path, [fn, fn2]);

		return road.request(method, path).then((response: Response) => {
			expect(route_hits).toEqual(2);
			expect(response.status).toEqual(200);
			expect(response.body).toEqual('route');
		});
	});

	// Route must resolve to a Response, but next can resolve to a string
	const toResponse = (result: Response | string) => result instanceof Response ? result : new Response(result);

	test.each([
		['single', (fn: Route<Context>) => fn],
		['array', (fn: Route<Context>) => [fn]]
	])('test a %s route that calls next falls through to the next road middleware', async (_name, wrap) => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);
		road.use(() => Promise.resolve(new Response('after router')));

		router.addRoute('GET', '/', wrap(async (method, url, body, headers, next) => toResponse(await next())));

		const response = await road.request('GET', '/');
		expect(response.status).toEqual(200);
		expect(response.body).toEqual('after router');
	});

	test('test overrides made inside an array route reach the next road middleware', async () => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);
		road.use((method, url, body) => Promise.resolve(new Response(`${method} ${String(body)}`)));

		router.addRoute('POST', '/', [
			async (method, url, body, headers, next) => toResponse(await next({ method: 'PUT', body: 'changed' })),
			async (method, url, body, headers, next) => toResponse(await next())
		]);

		const response = await road.request('POST', '/', 'original');
		expect(response.body).toEqual('PUT changed');
	});

	test.each(['', '-1', '1.5', '0x1F', '1e3', 'Infinity', ' 1', 'abc'])(
		'test numeric template does not match %j', async (segment) => {
			const road = new Road();
			const router = new Router();
			router.applyMiddleware(road);

			router.addRoute('GET', '/users/#id', () => Promise.resolve(new Response('route')));

			const response = await road.request('GET', `/users/${segment}`);
			expect(response.status).toEqual(404);
		});

	test('test numeric template accepts zero and leading zeros', async () => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		const ids: unknown[] = [];
		router.addRoute('GET', '/users/#id', (method, url: RouterURL) => {
			ids.push(url.args?.id);
			return Promise.resolve(new Response('route'));
		});

		await road.request('GET', '/users/0');
		await road.request('GET', '/users/007');
		expect(ids).toEqual([0, 7]);
	});

	test('test string template does not match an empty segment', async () => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		router.addRoute('GET', '/users/$name', () => Promise.resolve(new Response('route')));

		const response = await road.request('GET', '/users/');
		expect(response.status).toEqual(404);
	});

	test('test args from routes whose path did not match are not applied', async () => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		let args: RouterURL['args'];
		router.addRoute('GET', '/$a/foo', () => Promise.resolve(new Response('foo')));
		router.addRoute('GET', '/$b/bar', (method, url: RouterURL) => {
			args = url.args;
			return Promise.resolve(new Response('bar'));
		});

		const response = await road.request('GET', '/x/bar');
		expect(response.body).toEqual('bar');
		expect(args).toEqual({ b: 'x' });
	});

	test('test args from routes whose method did not match are not applied', async () => {
		const road = new Road();
		const router = new Router();
		router.applyMiddleware(road);

		let args: RouterURL['args'];
		router.addRoute('GET', '/$a', () => Promise.resolve(new Response('get')));
		router.addRoute('POST', '/$b', (method, url: RouterURL) => {
			args = url.args;
			return Promise.resolve(new Response('post'));
		});

		const response = await road.request('POST', '/x');
		expect(response.body).toEqual('post');
		expect(args).toEqual({ b: 'x' });
	});

	test('test path params are percent-decoded', async () => {
		const road = new Road();
		const router = new Router(road);
		let args: RouterURL['args'];

		router.addRoute('GET', '/users/$name/#id', (method, url: RouterURL) => {
			args = url.args;
			return Promise.resolve(new Response('ok'));
		});

		await road.request('GET', '/users/a%20b%2Fc/%31%32');
		expect(args).toEqual({ name: 'a b/c', id: 12 });
	});

	test('test literal path parts are matched after percent-decoding', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/café', () => Promise.resolve(new Response('ok')));

		expect((await road.request('GET', '/caf%C3%A9')).body).toEqual('ok');
	});

	test('test a path with malformed percent-encoding matches no route', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/users/$name', () => Promise.resolve(new Response('ok')));

		expect(await road.request('GET', '/users/%E0%A4%A')).toEqual(new Response('Page not found', 404));
	});

	test('test the url passed to routes has the parsed query string and hash', async () => {
		const road = new Road();
		const router = new Router(road);
		let url: RouterURL | undefined;

		router.addRoute('GET', '/search', (method, requestUrl: RouterURL) => {
			url = requestUrl;
			return Promise.resolve(new Response('ok'));
		});

		await road.request('GET', '/search?q=a+b&tag=x&tag=y#results');
		expect(url?.pathname).toEqual('/search');
		expect(url?.search).toEqual('?q=a+b&tag=x&tag=y');
		expect(url?.hash).toEqual('#results');
		expect({ ...url?.query }).toEqual({ q: 'a b', tag: 'x' });
		expect(url?.searchParams.getAll('tag')).toEqual(['x', 'y']);
	});

	test('test HEAD requests get the GET route\'s status and headers without its body', async () => {
		const road = new Road();
		const router = new Router(road);
		let method: string | undefined;

		router.addRoute('GET', '/x', (requestMethod) => {
			method = requestMethod;
			return Promise.resolve(new Response('get', 201, { 'content-type': 'text/plain' }));
		});

		expect(await road.request('HEAD', '/x')).toEqual(new Response('', 201, { 'content-type': 'text/plain' }));
		expect(method).toEqual('HEAD');
	});

	test('test HEAD requests to a GET route that returns a string get an empty body', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/x', async () => 'get');

		expect(await road.request('HEAD', '/x')).toEqual(new Response(''));
	});

	test('test a HEAD route is used over the GET route', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/x', () => Promise.resolve(new Response('get')));
		router.addRoute('HEAD', '/x', () => Promise.resolve(new Response('head')));

		expect(await road.request('HEAD', '/x')).toEqual(new Response('head'));
	});

	test('test a 405 lists every allowed method, including HEAD for GET routes', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/x', () => Promise.resolve(new Response('get')));
		router.addRoute('PUT', '/x', () => Promise.resolve(new Response('put')));
		router.addRoute('DELETE', '/$name', () => Promise.resolve(new Response('delete')));

		expect(await road.request('POST', '/x'))
			.toEqual(new Response('Method Not Allowed', 405, { allow: 'GET, PUT, DELETE, HEAD' }));
	});

	test('test a method missed by one router is handled by a later router', async () => {
		const road = new Road();
		const first = new Router(road);
		const second = new Router(road);

		first.addRoute('GET', '/x', () => Promise.resolve(new Response('get')));
		second.addRoute('POST', '/x', () => Promise.resolve(new Response('post')));

		expect(await road.request('GET', '/x')).toEqual(new Response('get'));
		expect(await road.request('POST', '/x')).toEqual(new Response('post'));
		expect(await road.request('DELETE', '/x'))
			.toEqual(new Response('Method Not Allowed', 405, { allow: 'GET, HEAD, POST' }));
	});

	test('test a method miss is answered by later middleware that handles the request', async () => {
		const road = new Road();
		const router = new Router(road);

		router.addRoute('GET', '/x', () => Promise.resolve(new Response('get')));
		road.use(async () => new Response('fallback', 200));

		expect(await road.request('POST', '/x')).toEqual(new Response('fallback', 200));
	});

	test('test routes loaded from a file URL', async () => {
		const road = new Road();
		const router = new Router(road);

		await router.addRouteFile(new URL('../../resources/_router_file_test.js', import.meta.url));

		expect(await road.request('GET', '/test')).toEqual(new Response('test get successful'));
	});

	test('test routes loaded from a module object', async () => {
		const road = new Road();
		const router = new Router(road);

		await router.addRouteFile({
			'/inline': {
				GET: () => Promise.resolve(new Response('inline get'))
			}
		}, '/prefix');

		expect(await road.request('GET', '/prefix/inline')).toEqual(new Response('inline get'));
	});

	test('test addRouteFile rejects relative paths', async () => {
		const router = new Router();

		await expect(router.addRouteFile('./routes.js')).rejects.toThrow(/relative path/);
	});
});
