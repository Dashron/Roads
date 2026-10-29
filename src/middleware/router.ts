/**
 * router.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This is a  router middleware for roads.
 * 	It allows you to easily attach functionality to HTTP methods and paths.
 */

import { IncomingHeaders } from '../core/road.js';
import Road, {Context} from '../core/road.js';
import Response from '../core/response.js';
import { NextCallback, RequestChain } from '../core/requestChain.js';
import { ParsedURL, parseUrl } from '../util/url.js';


/**
 * `BodyType` is the type of the request body this route receives. If you use the parse body middleware
 * 	this is the parsed body, otherwise it is the request body string.
 */
export interface Route<ContextType extends Context, BodyType = unknown> {
	(this: ContextType, method: string, path: RouterURL, body: BodyType,
		headers: IncomingHeaders, next: NextCallback): Promise<Response | string>
}

interface RouteDetails {
	route: Route<Context> | RequestChain<Route<Context>>,
	path: string,
	method: string
}

/**
 * The request url as received by routes. See `ParsedURL` for the url parts.
 */
export interface RouterURL extends ParsedURL {
	/**
	 * The values of any `#` or `$` variables in the route's path. `#` values are numbers, `$` values are
	 * 	percent-decoded strings. Only present if the route's path has variables.
	 */
	args?: Record<string, string | number>
}

/**
 * The contents of a route file. Each key is an HTTP path, and each value maps HTTP methods to route functions.
 */
export interface RouteFile {
	[path: string]: {
		[method: string]: Route<Context> | Route<Context>[]
	}
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
 * Each part of the request path is percent-decoded before it is matched, so `/users/a%20b` matches
 * 	`/users/$name` with `{ name: 'a b' }`. Requests whose path can't be decoded don't match any route.
 *
 * If a request's path matches a route but its method doesn't, the request continues down the road. If nothing
 * 	after the router handles it (i.e. the rest of the road responds with a 404), the router responds with a 405
 * 	and an `Allow` header. As RFC 9110 requires, HEAD requests are answered by the matching GET route if there is
 * 	no HEAD route. The response keeps the GET route's status and headers, but its body is removed.
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

		// Each route declares the context and body it expects, and trusts earlier middleware to provide them.
		// 		The router can't check that, so every route is stored with the base types.
		const route = (Array.isArray(fn) ? new RequestChain(fn) : fn) as unknown as RouteDetails['route'];

		paths.forEach((path) => {
			this._routes.push({
				path: path,
				method: method,
				route
			});
		});
	}

	/**
	 * Add an entire file worth of routes.
	 *
	 * The file should be a module whose default export is an object.
	 * Each key should be an HTTP path, each value should be an object.
	 * In that object, each key should be an HTTP method, and the value should be your route function.
	 *
	 * @param {string | URL | RouteFile} file - The routes to add. Either the module itself (e.g. the result of
	 * 		`import routes from './routes.js'`), a file URL (e.g. `new URL('./routes.js', import.meta.url)`), or an
	 * 		absolute path. Relative paths are rejected, because `import()` would resolve them relative to roads
	 * 		instead of your code.
	 * @param {string} [prefix] - A string that will help namespace this file. e.g. if you call this on a file
	 * 		with a route of "/posts", and the prefix "/users", the route will be assigned to "/users/posts"
	 */
	async addRouteFile (file: string | URL | RouteFile, prefix?: string): Promise<void> {
		let routes: RouteFile;

		if (typeof file === 'string' || file instanceof URL) {
			if (typeof file === 'string' && file.startsWith('.')) {
				throw new TypeError(`addRouteFile can't load the relative path "${file}". Pass an absolute path, a file ` +
					'URL such as new URL(\'./routes.js\', import.meta.url), or the imported module.');
			}

			const routeModule = await import(file.toString());
			// ES modules expose the routes as their default export, and Node exposes module.exports there too
			routes = 'default' in routeModule ? routeModule.default : routeModule;
		} else {
			routes = file;
		}

		for (const [path, methods] of Object.entries(routes)) {
			for (const [method, route] of Object.entries(methods)) {
				this.addRoute(method, buildRouterPath(path, prefix), route);
			}
		}
	}

	/**
	 * Slightly non-standard roads middleware to execute the functions in this router when requests are received by the road
	 * The first method is the routes to ensure that we can properly use this router once we loose the "this" value
	 * from the roads context
	 */
	protected async _middleware (
		this: Context, routes: RouteDetails[], request_method: string, request_url: string, request_body: unknown,
		request_headers: IncomingHeaders, next: NextCallback
	): Promise<Response | string> {

		const parsed_url: RouterURL = parseUrl(request_url);
		const pathParts = splitPath(parsed_url.pathname);

		// Every method that a route accepts for this path, for the Allow header
		const allowedMethods = new Set<string>();
		let headFallback: { route: RouteDetails, args: Record<string, string | number> } | null = null;

		for (const route of routes) {
			const args = pathParts ? matchRoutePath(route, pathParts) : null;

			if (!args) {
				continue;
			}

			// Check the method last, so we can give proper status codes
			if (route.method === request_method) {
				return runRoute.call(this, route, args, parsed_url, request_method, request_body, request_headers, next);
			}

			allowedMethods.add(route.method);

			// HEAD requests are answered by the GET route, unless a HEAD route for this path comes later
			if (request_method === 'HEAD' && route.method === 'GET' && !headFallback) {
				headFallback = { route, args };
			}
		}

		// RFC 9110 9.3.2: HEAD is identical to GET, except the response has no body
		if (headFallback) {
			const response = await runRoute.call(this, headFallback.route, headFallback.args, parsed_url,
				request_method, request_body, request_headers, next);

			return response instanceof Response ? new Response('', response.status, response.headers) : new Response('');
		}

		if (!allowedMethods.size) {
			return next();
		}

		// GET routes also answer HEAD requests (see above), so HEAD belongs in the Allow header
		if (allowedMethods.has('GET')) {
			allowedMethods.add('HEAD');
		}

		// The path matched, but not the method. Something later in the road (such as another router) might
		// 		handle this method, so only respond with a 405 if nothing else does.
		const response = await next();

		if (!(response instanceof Response) || (response.status !== 404 && response.status !== 405)) {
			return response;
		}

		// If a later router also missed on the method, include the methods it allows
		for (const key of Object.keys(response.headers)) {
			if (key.toLowerCase() === 'allow') {
				for (const method of [response.headers[key] ?? []].flat().join(',').split(',')) {
					if (method.trim()) {
						allowedMethods.add(method.trim());
					}
				}
			}
		}

		return new Response('Method Not Allowed', 405, { allow: [...allowedMethods].join(', ') });
	}
}

/**
 * Runs a route that matched the request
 */
function runRoute (
	this: Context, route: RouteDetails, args: Record<string, string | number>, parsed_url: RouterURL,
	request_method: string, request_body: unknown, request_headers: IncomingHeaders, next: NextCallback
): Promise<Response | string> {
	if (Object.keys(args).length > 0) {
		parsed_url.args = args;
	}

	if (route.route instanceof RequestChain) {
		return route.route.getChainStart(next)(this, request_method, parsed_url, request_body, request_headers);
	}

	return route.route.call(this, request_method, parsed_url, request_body, request_headers, next);
}

/**
 * Splits a request path into its percent-decoded parts
 *
 * @param pathname - The request path
 * @returns The decoded parts, or null if the path isn't valid percent-encoding
 */
function splitPath (pathname: string): string[] | null {
	let parts = pathname.split('/');
	if (parts[0] === '') {
		parts = parts.slice(1); // Slice kills the emptystring before the leading slash
	}

	try {
		return parts.map((part) => decodeURIComponent(part));
	} catch {
		// e.g. "/users/%E0%A4%A"
		return null;
	}
}

/**
 * Checks to see if the route's path matches the request, and if true returns any url variables.
 * The args are not applied to the url, so a route that fails to match (by path or method) can't leak them.
 *
 * @param {object} route - Route object from this router class
 * @param {object} route.path - HTTP path associated with this route
 * @param {Array<string>} actual - The percent-decoded parts of the request path
 * @returns {object | null} - The url variables if the path matches, otherwise null
 */
function matchRoutePath (
	route: {path: string}, actual: string[]
): Record<string, string | number> | null {

	let template = route.path.split('/');
	if (template[0] === '') {
		template = template.slice(1); // Slice kills the emptystring before the leading slash
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