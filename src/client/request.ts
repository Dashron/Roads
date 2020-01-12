/**
 * request.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file exposes a Request object to offer an HTTP request library with a method signature that matches
 * the roads.request method
 */

import roadsRequest from 'roads-req';
import Response from '../response';

/**
 * This class is a helper with making HTTP requests that look like roads requests. 
 * The function signature matches the roads "request" method to allow the details of a request to be abstracted
 * away from the client. Sometimes the request may route internally, sometimes it may be an HTTP request.
 * 
 * @todo tests
 */
export default class Request {
	protected _secure: boolean;
	protected _host: string;
	protected _port: number;
	
	/**
	 * @todo: port should just be part of the host
	 * 
	 * @param {boolean} secure - Whether or not this request should use HTTPS
	 * @param {string} host - The hostname of all requests made by this function
	 * @param {number} port - The post of all requests made by this function
	 */
	constructor (secure: boolean, host: string, port: number) {
		this._secure = secure;
		this._host = host;
		this._port = port;
	}
	
	/**
	 * Perform the HTTP request
	 * 
	 * @param {string} method - HTTP Request method
	 * @param {string} path - HTTP Request path
	 * @param {string} [body] - The request body. If an object is provided, the body will be turned to JSON, and the appropriate content header set
	 * @param {object} [headers] - HTTP Request headers
	 * @returns {Promise} The promise will resolve with an object with three properties. The response headers, response status and the response body. If the response content-type is "application/json" the body will be an object, otherwise it will resolve to a string
	 */
	async request (method: string, path: string, body?: string, headers?: {[x:string]: any}): Promise<Response> {
		let response = await roadsRequest({
			request: {
				hostname: this._host,
				port: this._port,
				path: path,
				method: method,
				headers: headers,
				// withCredentials: true, // does this really work here? The goal is to have it sent when compiled into a client request with browserify
				protocol: this._secure ? 'https' : 'http'
			},
			requestBody: body,
			followRedirects: false
		});

		return new Response(response.body, response.response.statusCode, response.response.headers);
	}
};