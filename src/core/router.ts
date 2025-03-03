/**
 * router.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This is the core router for Roads. It allows you to easily attach functionality to HTTP methods and paths.
 */

import parse from 'url-parse';
import Road, { IncomingHeaders } from './road';
import { Context } from './road';
import Response from './response';
// import { NextCallback, RequestChain } from './requestChain';


/**
 * The standard type for a Route function
 */
export interface Route<ContextType extends Context> {
	(this: ContextType, method: string, path: RouterURL, body: string | undefined,
		headers: IncomingHeaders | undefined): Promise<Response | string> | Response | string
}

interface RouteDetails {
	route: Route<Context> | Route<Context>[] | Road<Context>,
	path: string,
	method: string
}

export interface RouterURL extends ReturnType<typeof parse> {
	args?: Record<string, string | number>
}

/**
 * This is the core router for Roads
 * You can assign one or more functions to HTTP methods and url paths. The paths can have variable templating
 *
 * There are only a couple of template options. Each URI is considered to be a series of "path parts" separated by slashes.
 * If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 * If a path part starts with a $, it is considered to be an alphanumeric variable.
 * 	Alphanumeric consists of all valid URL characters except `/`.
 *
 * Any variables will be added to the route's request url object under the "args" object.
 *
 * e.g.
 * /users/#user_id will match /users/12345, not /users/abcde. If a request is made to /users/12345
 * 	 the route's request_url object will contain { args: {user_id: 12345}} along with all other url object values
 *
 * @name Router
 */
export class Router<RouterContextType extends Context> {
	protected _routes: RouteDetails[];
	protected _preRoutes: Route<RouterContextType>[];
	protected _postRoutes: Route<RouterContextType>[];

	constructor () {
		this._preRoutes = [];
		this._routes = [];
		this._postRoutes = [];
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
	addRoute<RouteContextType extends Context> (
		method: string,
		paths: string | string[],
		fnOrRoad: Route<RouterContextType & RouteContextType>
			| Route<RouterContextType & RouteContextType>[]
			| Road<RouteContextType>
	): void {
		if (!Array.isArray(paths)) {
			paths = [paths];
		}

		paths.forEach((path) => {
			this._routes.push({
				path: path,
				method: method,
				route: fnOrRoad
			});
		});
	}

	/**
	 *
	 */
	addPreRoute<RouteContextType extends Context> (
		fn: Route<RouterContextType & RouteContextType>
	): void {
		this._preRoutes.push(fn);
	}

	/**
	 *
	 */
	addPostRoute<RouteContextType extends Context> (
		fn: Route<RouterContextType & RouteContextType>
	): void {
		this._postRoutes.push(fn);
	}

	/**
	 *
	 * @param routes
	 * @param context
	 * @param method
	 * @param url
	 * @param body
	 * @param headers
	 * @returns
	 */
	async _executeRoutes (
		routes: Route<Context>[],
		context: Context,
		method: string,
		url: ReturnType<typeof parse>,
		body: string | undefined,
		headers: IncomingHeaders | undefined
	): Promise<Response | string | void>{
		if (routes.length) {
			for(let i = 0; i < routes.length; i++) {
				const response = await routes[i].call(context, method, url, body, headers);
				if (response) {
					return response;
				}
			}
		}

		return;
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
	addRouteFile (prefix: string, filePath: string): Promise<void>;
	addRouteFile (filePath: string): Promise<void>;
	addRouteFile (prefixOrFilepath: string, filePath?: string): Promise<void> {
		const prefix = filePath ? prefixOrFilepath : '/';
		const finalFilePath = filePath ? filePath : prefixOrFilepath;

		if (!finalFilePath) {
			throw new TypeError('Could not find the file path');
		}

		return import(finalFilePath).then(routes => {
			for (const path in routes) {
				// Only add keys that start with `/`.
				if (path[0] === '/') {
					for (const method in routes[path]) {
						this.addRoute(method, buildRouterPath(path, prefix), routes[path][method]);
					}
				}
			}
		});
	}

	/**
	 * Execute the route associated with the provided parameters
	 */
	public async route (
		request_method: string, request_url: string,
		request_body: string | undefined, request_headers: IncomingHeaders | undefined, context: Context
	): Promise<Response | string> {

		let realMethod = request_method;

		let response = null;
		let hit = false;
		let routeHitMethodFail = false;

		const parsed_url = parse(request_url, true);

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

		for (let i = 0; i < this._routes.length; i++) {
			const route = this._routes[i];

			if (compareRouteAndApplyArgs(route, parsed_url)) {
				// Check the method last, so we can give proper status codes
				if (route.method !== realMethod) {
					routeHitMethodFail = true;
					break;
				}

				if (this._preRoutes) {
					response = await this._executeRoutes(
						this._preRoutes, context, realMethod, parsed_url, request_body, request_headers
					);

					if (response) {
						hit = true;
						break;
					}
				}

				if (route.route instanceof Road) {
					response = await route.route.request(realMethod, request_url, request_body, request_headers);
				} else {
					response = await this._executeRoutes(
						Array.isArray(route.route) ? route.route : [route.route],
						context, realMethod, parsed_url, request_body, request_headers
					);
				}

				if (this._postRoutes) {
					const postResponse = await this._executeRoutes(
						this._postRoutes, context, realMethod, parsed_url, request_body, request_headers
					);

					if (postResponse) {
						response = postResponse;
					}
				}

				hit = true;
				break;
			}
		}

		if (hit && response) {
			return response;
		}

		if (routeHitMethodFail) {
			return new Response('Method Not Allowed', 405);
		}

		return new Response('Page not found', 404);
	}
}

/**
 * Checks to see if the route matches the request, and if true assigns any applicable url variables and returns the route
 *
 * @param {object} route - Route object from this router class
 * @param {object} route.method - HTTP method associated with this route
 * @param {object} route.path - HTTP path associated with this route
 * @param {object} request_url - Parsed HTTP request url
 * @param {string} request_method - HTTP request method
 * @returns {boolean}
 */
function compareRouteAndApplyArgs (route: {method: string, path: string}, request_url: ReturnType<typeof parse>): boolean {
	if (!request_url.pathname) {
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
			applyArg(request_url as RouterURL, template_part.substring(1), Number(actual_part));
			continue;
		}

		if (template_part[0] === '$') {
			// $ templates accept any non-slash alphanumeric character
			// TODO: get rid of this `as`
			applyArg(request_url as RouterURL, template_part.substring(1), String(actual_part));
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
function applyArg(request_url: RouterURL, template_part: string, actual_part: string | number): void {
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