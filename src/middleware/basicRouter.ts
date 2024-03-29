/**
 * basicRouter.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This is a basic router middleware for roads.
 * 	It allows you to easily attach functionality to HTTP methods and paths.
 */

import * as url_module from 'url';
import { IncomingHeaders, NextCallback } from '../core/road';
import Road, {Context} from '../core/road';
import Response from '../core/response';


export interface Route<ContextType extends Context> {
	(this: ContextType, path: BasicRouterURL, body: string,
		headers: IncomingHeaders, next: NextCallback): Promise<Response>
}

interface RouteDetails {
	route: Route<Context>,
	path: string,
	method: string
}

export interface BasicRouterURL extends url_module.UrlWithParsedQuery {
	args?: Record<string, string | number>
}
/**
 * This is a basic router middleware for roads.
 * You can assign functions to url paths, and those paths can have some very basic variable templating
 *
 * Templating is basic. Each URI is considered to be a series of "path parts" separated by slashes.
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
 * @name BasicRouter
 */
export class BasicRouter {
	protected _routes: RouteDetails[];

	/**
	 * @param {Road} [road] - The road that will receive the BasicRouter middleware
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
	 * @param  {Road} road - The road that will receive the BasicRouter middleware
	 */
	applyMiddleware (road: Road): void {
		// We need to alias because "this" for the middleware function must
		//		be the this applied by road.use, not the BasicRouter
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const _self = this;

		// We do this to ensure we have access to the BasicRouter once we lose this due to road's context
		road.use((function (request_method, request_url, request_body, request_headers, next) {
			return _self._middleware.call(this, _self._routes, request_method, request_url,
				request_body, request_headers, next);
		}));
	}

	/**
	 * This is where you want to write the majority of your webservice. The `fn` parameter should contain
	 * 	the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object.
	 *
	 * The path supports a very basic templating system. The values inbetween each slash can be interpreted
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
	addRoute<ContextType extends Context> (method: string, paths: string | string[], fn: Route<ContextType>): void {
		if (!Array.isArray(paths)) {
			paths = [paths];
		}

		paths.forEach((path) => {
			this._routes.push({
				path: path,
				method: method,
				route: fn
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
	 *
	 * @todo there might be a better way to do this
	 */
	protected _middleware (routes: RouteDetails[], request_method: string, request_url: string, request_body: string,
		request_headers: IncomingHeaders, next: NextCallback): Promise<Response | string> {

		let realMethod = request_method;

		let response = null;
		let hit = false;

		const parsed_url = url_module.parse(request_url, true);

		// Only override on POST methods
		if (realMethod === 'POST') {
			const methodOverrideHeader = request_headers?.['x-http-method-override'];
			const methodOverrideQuery = parsed_url.query?.['_method'];

			if (methodOverrideHeader) {
				realMethod = Array.isArray(methodOverrideHeader) ? methodOverrideHeader.join('') : methodOverrideHeader ;
			} else if (methodOverrideQuery) {
				realMethod = Array.isArray(methodOverrideQuery) ? methodOverrideQuery.join('') : methodOverrideQuery ;
			}
		}

		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];

			if (compareRouteAndApplyArgs(route, parsed_url, realMethod)) {
				response = (route.route).call(this, parsed_url, request_body, request_headers, next);
				hit = true;
				break;
			}
		}

		if (hit) {
			return response;
		}

		return next();
	}
}

/**
 * Checks to see if the route matches the request, and if true assigns any applicable url variables and returns the route
 *
 * @param {object} route - Route object from this basic router class
 * @param {object} route.method - HTTP method associated with this route
 * @param {object} route.path - HTTP path associated with this route
 * @param {object} request_url - Parsed HTTP request url
 * @param {string} request_method - HTTP request method
 * @returns {boolean}
 */
function compareRouteAndApplyArgs (route: {method: string, path: string}, request_url: url_module.UrlWithParsedQuery,
	request_method: string): boolean {

	if (route.method !== request_method || !request_url.pathname) {
		return false;
	}

	let template = route.path.split('/');
	if (template[0] === '') {
		template = template.slice(1); // Slice kills the emptystring before the leading slash
	}

	let actual = request_url.pathname.split('/');
	if (actual[0] === '') {
		actual = actual.slice(1); // Slice kills the emptystring before the leading slash
	}

	if (template.length != actual.length) {
		return false;
	}

	for (let i = 0; i < template.length; i++) {
		const actual_part = actual[i];
		const template_part = template[i];

		// Process variables first
		if (template_part[0] === '#') {
			// # templates only accept numbers
			if (isNaN(Number(actual_part))) {
				return false;
			}

			// TODO: get rid of this `as`
			applyArg(request_url as BasicRouterURL, template_part.substring(1), Number(actual_part));
			continue;
		}

		if (template_part[0] === '$') {
			// $ templates accept any non-slash alphanumeric character
			// TODO: get rid of this `as`
			applyArg(request_url as BasicRouterURL, template_part.substring(1), String(actual_part));
			// Continue so that
			continue;
		}

		// Process exact matches second
		if (actual_part === template_part) {
			continue;
		}

		return false;
	}

	return true;
}

/**
 * Assigns a value to the parsed request urls args parameter
 *
 * @param {object} request_url - The parsed url object
 * @param {string} template_part - The template variable
 * @param {*} actual_part - The url value
 */
function applyArg(request_url: BasicRouterURL, template_part: string, actual_part: string | number): void {
	if (typeof(request_url.args) === 'undefined') {
		request_url.args = {};
	}

	if (typeof request_url.args !== 'object') {
		throw new Error(`The request url's args have already been defined as a ${typeof request_url.args  }
			and we expected an object. For safety we are throwing this error instead of overwriting your
			existing data. Please use a different field name in your code`);
	}

	request_url.args[template_part] = actual_part;
}

/**
 * Applies a prefix to paths of route files
 *
 * @todo I'm pretty sure there's an existing library that will do this more accurately
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