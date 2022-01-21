/**
 * request.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a Request object to offer an HTTP request library with a method signature that matches
 * the roads.request method
 */

import { IncomingHeaders } from '../core/road';
import Response from '../core/response';

/**
 * This class is a helper with making HTTP requests that look like roads requests.
 * The function signature matches the roads "request" method to allow the details of a request to be abstracted
 * away from the client. Sometimes the request may route internally, sometimes it may be an HTTP request.
 *
 * @todo tests
 */
export default class Request {
	protected secure: boolean;
	protected host: string;
	protected port: number;

	/**
	 * @todo: port should just be part of the host
	 *
	 * @param {boolean} secure - Whether or not this request should use HTTPS
	 * @param {string} host - The hostname of all requests made by this function
	 * @param {number} port - The post of all requests made by this function
	 */
	constructor (secure: boolean, host: string, port: number) {
		this.secure = secure;
		this.host = host;
		this.port = port;
	}

	/**
	 * Perform the HTTP request
	 *
	 * @param {string} method - HTTP Request method
	 * @param {string} path - HTTP Request path
	 * @param {string} [body] - The request body. If an object is provided, the body will be turned to JSON,
	 * 		and the appropriate content header set
	 * @param {object} [headers] - HTTP Request headers
	 * @returns {Promise} The promise will resolve with an object with three properties. The response headers,
	 * 		response status and the response body. If the response content-type is "application/json" the body
	 * 		will be an object, otherwise it will resolve to a string
	 */
	async request (method: string, path: string, body?: string, headers?: IncomingHeaders): Promise<Response> {
		const newHeaders = new Headers();

		// Build proper header object for fetch interface
		if (headers) {
			Object.keys(headers).forEach(key => {
				const val = headers[key];
				if (!val) {
					return;
				}

				if (Array.isArray(val)) {
					val.forEach(value => newHeaders.append(key, value));
				} else {
					newHeaders.append(key, val);
				}
			});
		}

		const protocol = this.secure ? 'https://' : 'http://';
		const port = this.port ? `:${this.port}` : '';

		const response = await fetch(`${protocol}${this.host}${port}${path}`, {
			method,
			mode: 'cors',
			credentials: 'same-origin',
			headers: newHeaders,
			redirect: 'manual',
			referrerPolicy: 'no-referrer',

			// TODO: What should we do with these?
			//   origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
			body
		});

		const responseHeaders: IncomingHeaders = {};

		// convert response headers into the roads header format
		if (response.headers) {
			response.headers.forEach((value, key) => {
				// Duplicates seem to come in as a comma separated single string in my tests for node-fetch
				// https://github.com/node-fetch/node-fetch/issues/771, and my tests in firefox with the example project
				responseHeaders[key] = value;
			});
		}

		return new Response(await response.text(), response.status, responseHeaders);
	}
}