/* eslint-disable max-len */
/**
 * road.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the core Road class
 */

import * as response_lib from './response';
import Response from './response';
import { Route, Router } from './router';

export interface IncomingHeaders extends Record<string, string | Array<string> | undefined> {}

export interface Context extends Record<string, unknown> {}

/**
 * See roadsjs.com for full docs.
 *
 * @name Road
 */
export default class Road<RoadContext extends Context> {
	protected _router: Router<RoadContext>;

	/**
	 * Road Constructor
	 *
	 * Creates a new Road object
	 */
	constructor () {
		this._router = new Router();
	}

	/**
		 * The use function can be called one or more times. Each time it is called, the function provided via the `fn` parameter will be added to the end of the *request chain* which is executed when you call `request`.
		 *
		 *  | name | type                                                                                           | required | description                                                                                                                                                     |
		 *  | ---- | ---------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
		 *  | fn   | Function(method: *string*, url: *string*, body: *string*, headers: *object*, next: *function*) | yes      | This is the function that will be added to the end of the *request chain*. See the [Middleware](#middleware) below for more details on the function parameters. |
		 *
		 * *Middleware*
		 * Each function in the request chain is called middleware. Each middleware function must match the following function signature.
		 *
		 * **function (method: *string*, url: *string*, body: *string*, headers: *object*, next: *next*): Promise<Response | string>**
		 *
		 * Parameters
		 * | name    | type                         | description                                                                                      |
		 * | ------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
		 * | method  | string                       | The request's HTTP method                                                                        |
		 * | url     | string                       | The request's URL. The `SimpleRouter` is included to help run different code for different URLs. |
		 * | body    | string                       | The request's body (as a string). To parse this check out the `parseBodyMiddleware`              |
		 * | headers | object                       | The request's headers. This is an object of strings or arrays of strings.                        |
		 * | next    | function(): Promise<Response | String>                                                                                          | The next step of the *request chain*. If there are no more steps in the *request chain* this does nothing. This method will always return a promise, which resolves to a `Response` object, or a string. |
		 *
		 * Each middleware function must return a promise that resolves to a [Response](#response) object or a string. If you return a string it will be transformed into a response object using the default status code (200) and no headers.
		 *
		 * *See the readme for more information*
		 *
		 * @param {Function} fn - A callback (function or async function) that will be executed every time a request is made.
		 * @returns {Road} this road object. Useful for chaining use statements.
	 */
	addRoute<ContextType extends RoadContext> (method: string, path: string, fnOrRoad: Route<ContextType> | Road<ContextType>) {
		this._router.addRoute(method, path, fnOrRoad);
		return this;
	}

	/**
	 *
	 * @param fn
	 * @returns
	 */
	beforeRoute<ContextType extends RoadContext> (fn: Route<ContextType>) {
		this._router.addPreRoute(fn);
		return this;
	}

	/**
	 *
	 * @param fn
	 * @returns
	 */
	afterRoute<ContextType extends RoadContext> (fn: Route<ContextType>) {
		this._router.addPostRoute(fn);
		return this;
	}

	/**
	 *
	 * @param path
	 * @returns
	 */
	addRouteFile (filePath: string): Promise<void>;
	addRouteFile (urlPath: string, filePath: string): Promise<void>;
	addRouteFile (filePathOrUrlPath: string, filePath?: string) {
		return this._router.addRouteFile(filePathOrUrlPath, filePath || '/');
	}

	/**
	 *
	 * Execute the resource method associated with the request parameters.
	 *
	 * This function will execute the *request chain* in the order they were assigned via
	 * 	[use](#roadusefunction-fn) and return a Promise that resolves to a [Response](#response)
	 *
	 * Make sure to catch any errors in the promise!
	 *
	 * @param {string} method - HTTP request method
	 * @param {string} url - HTTP request url
	 * @param {string} [body] - HTTP request body
	 * @param {object} [headers] - HTTP request headers
	 * @returns {Promise} this promise will resolve to a Response object
	 */
	request (method: string, url: string, body?: string, headers?: IncomingHeaders): Promise<Response> {
		return response_lib.wrap(this._router.route(method, url, body, headers, {}));
	}
}