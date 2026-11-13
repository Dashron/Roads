/**
 * response.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * The response object contains all of the information you want to send to the client.
 * 	This includes the body, status code and all applicable headers.
 */

export interface OutgoingHeaders extends Record<string, string | Array<string> | undefined> {}

export default class RoadsResponse {
	status: number;
	body: string | Buffer;
	headers: OutgoingHeaders;

	/**
	 * Creates a new RoadsResponse object.
	 *
	 * @param {string | Buffer} body - Your response body
	 * @param {number} [status] - Your response status
	 * @param {object} [headers] - Your response headers
	 */
	constructor (body: string | Buffer, status?: number, headers?: OutgoingHeaders) {
		this.body = body;
		this.status = status || 200;
		this.headers = headers || {};
	}
}

export interface RoadsResponseConstructor {
	new (body: string, status?: number, headers?: OutgoingHeaders): RoadsResponse
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