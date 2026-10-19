/**
 * router.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This is a  router middleware for roads.
 * 	It allows you to easily attach functionality to HTTP methods and paths.
 */

import parse from 'url-parse';
import { IncomingHeaders } from '../core/road.js';
import Road, {Context} from '../core/road.js';
import Response from '../core/response.js';
import { NextCallback, RequestChain } from '../core/requestChain.js';


/**
 * `BodyType` is the type of the request body this route receives. If you use the parse body middleware
 * 	this is the parsed body, otherwise it is the request body string.
 */
export interface Route<ContextType extends Context, BodyType = unknown> {
	(this: ContextType, method: string, path: RouterURL, body: BodyType,
		headers: IncomingHeaders, next: NextCallback): Promise<Response>
}

interface RouteDetails {
	route: Route<Context> | RequestChain<Route<Context>>,
	path: string,
	method: string
}

export interface RouterURL extends ReturnType<typeof parse<Record<string, string | undefined>>> {
	args?: Record<string, string | number>
}
/**
 * This is a router middleware for roads.
 * You can assign functions to url paths, and those paths can have variable templating
 *
 * There are only a couple of template options. Each URI is considered to be a series of "path parts" separated by slashes.
 * If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 * If a path part starts with a $, it is considered to be an alphanumeric variabe.
 * 		All non-slash values will match this route.
 *
 * Any variables will be added to the route's request url object under the "args" object.
 *
 * e.g.
 * /users/#user_id will match /users/12345, not /users/abcde. If a request is made to /users/12345
 * 	 the route's requestUrl object will contain { args: {user_id: 12345}} along with all other url object values
 *
 * @name Router
 */
export class Router<RouterContextType extends Context> {
	protected _routes: RouteDetails[];

	/**
	 * @param {Road} [road] - The road that will receive the Router middleware
	 */
	constructor (road?: Road) {
		this._routes = [];

		if (road) {
			this.applyMiddleware(road);
		}
	}

	/**
	 * If you don't provide a road to the SimpleRouter constructor, your routes will not be executed.
	 * 	If you have reason not to assign the road off the bat, you can assign it later with this function.
	 *
	 * @param  {Road} road - The road that will receive the Router middleware
	 */
	applyMiddleware (road: Road): void {
		// We need to alias because "this" for the middleware function must
		//		be the this applied by road.use, not the Router
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const _self = this;

		// We do this to ensure we have access to the Router once we lose this due to road's context
		road.use((function (request_method, request_url, request_body, request_headers, next) {
			return _self._middleware.call(this, _self._routes, request_method, request_url,
				request_body, request_headers, next);
		}));
	}

	/**
	 * This is where you want to write the majority of your webservice. The `fn` parameter should contain
	 * 	the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object.
	 *
	 * The path supports a templating system. The values inbetween each slash can be interpreted
	 * 	in one of three ways
	 *  - If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
	 *  - If a path part starts with a $, it is considered to be an alphanumeric variabe. All non-slash values
	 * 		will match this route.
	 *  - If a path starts with anything but a # or a $, it is assumed to be a literal. Only that value will match
	 * 		this route.
	 *
 	 * 		e.g. /users/#userId will match /users/12345, not /users/abcde. If a request is made to /users/12345 the
	 * 			route's requestUrl object will include the key value pair of `args: { userId: 12345 }`
	 * Any variables will be added to the route's request url object under the "args" object.
	 *
	 *
	 * @param {string} method - The HTTP method that will trigger the provided function
	 * @param {(string|array)} paths - One or many URL paths that will trigger the provided function
	 * @param {function} fn - The function containing all of your route logic
	 */
	addRoute<RouteContextType extends Context, BodyType = unknown> (
		method: string,
		paths: string | string[],
		fn: Route<RouterContextType & RouteContextType, BodyType> | Route<RouterContextType & RouteContextType, BodyType>[]
	): void {
		if (!Array.isArray(paths)) {
			paths = [paths];
		}

		paths.forEach((path) => {
			this._routes.push({
				path: path,
				method: method,
				route: Array.isArray(fn) ? new RequestChain(fn) : fn
			});
		});
	}

	/**
	 * Add an entire file worth of routes.
	 *
	 * The file should be a node module that exposes an object.
	 * Each key should be an HTTP path, each value should be an object.
	 * In that object, each key should be an HTTP method, and the value should be your route function.
	 *
	 * @param {string} filePath - The file path
	 * @param {string} [prefix] - A string that will help namespace this file. e.g. if you call this on a file
	 * 		with a route of "/posts", and the prefix "/users", the route will be assigned to "/users/posts"
	 */
	addRouteFile (filePath: string, prefix?: string): Promise<void> {
		return import(filePath).then(routes => {
			for (const path in routes) {
				for (const method in routes[path]) {
					this.addRoute(method, buildRouterPath(path, prefix), routes[path][method]);
				}
			}
		});
	}

	/**
	 * Slightly non-standard roads middleware to execute the functions in this router when requests are received by the road
	 * The first method is the routes to ensure that we can properly use this router once we loose the "this" value
	 * from the roads context
	 */
	protected async _middleware (
		this: Context, routes: RouteDetails[], request_method: string, request_url: string, request_body: unknown,
		request_headers: IncomingHeaders, next: () => Promise<Response | string>
	): Promise<Response | string> {

		let response: string | Response | Promise<string | Response> | null = null;
		let hit = false;
		let routeHitMethodFail = false;

		const parsed_url: RouterURL = parse(request_url, true);

		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];

			const args = route ? matchRoutePath(route, parsed_url) : null;

			if (route && args) {
				// Check the method last, so we can give proper status codes
				if (route.method === request_method) {
					if (Object.keys(args).length > 0) {
						parsed_url.args = args;
					}

					if (route.route instanceof RequestChain) {
						response = route.route.getChainStart()(
							this, request_method, parsed_url, request_body, request_headers);
					} else {
						response = (route.route).call(this, request_method, parsed_url, request_body, request_headers, next);
					}

					hit = true;
					break;
				} else {
					routeHitMethodFail = true;
				}
			}
		}

		if (hit) {
			// response is guaranteed to be non-null when hit is true
			return response!;
		}

		if (routeHitMethodFail) {
			return new Response('Method Not Allowed', 405);
		}

		return next();
	}
}

/**
 * Checks to see if the route's path matches the request, and if true returns any url variables.
 * The args are not applied to the url, so a route that fails to match (by path or method) can't leak them.
 *
 * @param {object} route - Route object from this router class
 * @param {object} route.path - HTTP path associated with this route
 * @param {object} request_url - Parsed HTTP request url
 * @returns {object | null} - The url variables if the path matches, otherwise null
 */
function matchRoutePath (
	route: {path: string}, request_url: ReturnType<typeof parse>
): Record<string, string | number> | null {

	if (!request_url.pathname) {
		return null;
	}

	let template = route.path.split('/');
	if (template[0] === '') {
		template = template.slice(1); // Slice kills the emptystring before the leading slash
	}

	let actual = request_url.pathname.split('/');
	if (actual[0] === '') {
		actual = actual.slice(1); // Slice kills the emptystring before the leading slash
	}

	if (template.length !== actual.length) {
		return null;
	}

	const args: Record<string, string | number> = {};

	for (let i = 0; i < template.length; i++) {
		const actual_part = actual[i];
		const template_part = template[i];

		// Process variables first
		if (template_part?.[0] === '#') {
			// # templates only accept non-negative integers
			if (actual_part === undefined || !/^\d+$/.test(actual_part)) {
				return null;
			}

			args[template_part.substring(1)] = Number(actual_part);
			continue;
		}

		if (template_part?.[0] === '$') {
			// $ templates accept any non-empty segment
			if (!actual_part) {
				return null;
			}

			args[template_part.substring(1)] = actual_part;
			continue;
		}

		// Process exact matches second
		if (actual_part === template_part) {
			continue;
		}

		return null;
	}

	return args;
}

/**
 * Applies a prefix to paths of route files
 *
 * @param {string} path - The HTTP path of a route
 * @param {string} [prefix] - An optional prefix for the HTTP path
 * @returns {string}
 */
function buildRouterPath(path: string, prefix?: string): string {
	if (!prefix) {
		prefix = '';
	}

	if (prefix.length && path === '/') {
		return prefix;
	}

	return prefix + path;
}