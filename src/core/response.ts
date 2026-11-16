/**
 * response.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * The response object contains all of the information you want to send to the client.
 * 	This includes the body, status code and all applicable headers.
 */

import { caseInsensitiveHeaders, RoadsHeaders } from '../util/headers.js';

export default class RoadsResponse {
	status: number;
	body: string | Buffer;
	/**
	 * The response headers. Header names are case-insensitive: `headers['Content-Type']` and
	 * 	`headers['content-type']` are the same header, whether you read, assign, check or delete it.
	 * 	The names are stored in lower case, so listing them (e.g. with `Object.keys`) gives lower-case names.
	 */
	declare headers: RoadsHeaders;

	/**
	 * Creates a new RoadsResponse object.
	 *
	 * @param {string | Buffer} body - Your response body
	 * @param {number} [status] - Your response status
	 * @param {object} [headers] - Your response headers. The response stores a copy with case-insensitive
	 * 	header names. Names that only differ by case are merged into one header that holds an array of every value
	 */
	constructor (body: string | Buffer, status?: number, headers?: RoadsHeaders) {
		this.body = body;
		this.status = status || 200;

		let currentHeaders = caseInsensitiveHeaders(headers ?? {});

		// An accessor, so that assigning a whole new object to `headers` keeps the names case-insensitive.
		// 	It is an enumerable own property, like `body` and `status`, so the response still compares, spreads
		// 	and serializes like a plain object
		Object.defineProperty(this, 'headers', {
			enumerable: true,
			configurable: true,
			get: () => currentHeaders,
			set: (newHeaders: RoadsHeaders) => {
				currentHeaders = caseInsensitiveHeaders(newHeaders);
			}
		});
	}
}

export interface RoadsResponseConstructor {
	new (body: string, status?: number, headers?: RoadsHeaders): RoadsResponse
}

/**
 * Wraps the return value of a promise in a RoadsResponse object to ensure consistency.
 *
 * @param {Promise<RoadsResponse | string>} promise
 * @returns {Promise<unknown>}
 * @throws {TypeError} If the request chain resolves to undefined or null, which usually means a middleware
 * 	forgot to return a value (or forgot to return `next()`)
 */
export function wrap (promise: Promise<RoadsResponse | string>): Promise<RoadsResponse> {
	return promise.then((routeResponse: RoadsResponse | string | undefined | null) => {
		if (routeResponse === undefined || routeResponse === null) {
			throw new TypeError(
				`The request chain resolved to ${String(routeResponse)} instead of a RoadsResponse or a string.` +
				' Check that every middleware returns a value, including the result of next().');
		}

		return routeResponse instanceof RoadsResponse ? routeResponse : new RoadsResponse(routeResponse);
	});
}