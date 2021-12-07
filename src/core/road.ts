/* eslint-disable max-len */
/**
 * road.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the core Road class
 */

import * as response_lib from './response';
import Response from './response';


export interface IncomingHeaders extends Record<string, string | Array<string> | undefined> {}

export interface Middleware<MiddlewareContext extends Context> {
	(this: MiddlewareContext, method: string, path: string,
		body: string, headers: IncomingHeaders,
		next: NextCallback): Promise<Response | string> | Response | string
}

export interface NextCallback {
	(): Promise<Response | string>
}

export interface Context extends Record<string, unknown> {}

/**
 * See roadsjs.com for full docs.
 *
 * @name Road
 */
export default class Road {
	protected _request_chain: Middleware<Context>[];

	/**
	 * Road Constructor
	 *
	 * Creates a new Road object
	 */
	constructor () {
		this._request_chain = [];
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
	use<ContextType extends Context> (fn: Middleware<ContextType>): Road {
		// Currently we pass everything through the coroutine wrapper to be save. Let that library decide
		// 		what does and does not actually need to be wrapped
		this._request_chain.push(fn);

		return this;
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
		return response_lib.wrap(this._buildNext(method, url, body, headers, { })());
	}

	/**
	 * Turn an HTTP request into an executable function with a useful request context. Will also incorporate the entire
	 * request handler chain
	 *
	 * @param {string} request_method - HTTP request method
	 * @param {string} path - HTTP request path
	 * @param {string} request_body - HTTP request body
	 * @param {object} request_headers - HTTP request headers
	 * @param {Context} context - Request context
	 * @returns {NextMiddleware} A function that will start (or continue) the request chain
	 */
	protected _buildNext (request_method: string, path: string, request_body: string | undefined,
		request_headers: IncomingHeaders | undefined, context: Context
	): NextCallback {

		let progress = 0;
		const next: NextCallback = async () => {

			if (this._request_chain.length && this._request_chain[progress]) {
				return this._request_chain[progress].call(context,
					request_method, path, request_body, request_headers, () => {
						progress += 1;
						return next();
					});
			}

			// If next is called and there is nothing next, we should still return a promise,
			//		it just shouldn't do anything
			return new Response('Page not found', 404);
		};

		return next;
	}
}