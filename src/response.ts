"use strict";
/**
 * response.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Provides a simple class to manage HTTP responses
 */

export class Response {
	status: number;
	body: string;
	headers: object;

	/**
	 * Creates a new Response object. 
	 * 
	 * @param {string} body - Your response body
	 * @param {number} [status] - Your response status
	 * @param {object} [headers] - Your response headers
	 */
	constructor (body: string, status?: number, headers?: object) {
		this.body = body;
		this.status = status || 200;
		this.headers = headers || {};
	}
};

export interface ResponseConstructor {
	new (body: string, status?: number, headers?: object): Response
}

/**
 * Wraps the return value of a promise in a Response object to ensure consistency.
 * 
 * @param {Promise} promise
 * @returns {Promise}
 */
export function wrap (promise: Promise<any>): Promise<any> {
	return promise.then((route_response) => {
		if (typeof(route_response) !== "object" || !(route_response instanceof Response)) {
			// we should always return a response object
			route_response = new Response(route_response);
		}

		return route_response;
	});
}