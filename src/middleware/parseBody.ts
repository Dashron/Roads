/**
 * parseBody.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single middleware function to help parse request bodies
 */

import {Middleware} from '../road';

import * as content_type_module from 'content-type';
import * as qs_module from 'querystring';

/**
 * Translate the request body into a usable value.
 * 
 * If the content type is application/json this will attempt to parse that json
 * If application/x-www-form-urlencoded this will attempt to parse it as a query format
 * Otherwise this will return a string
 * 
 * @param  {mixed} body - request body
 * @param  {string} content_type - media type of the body
 * @returns {(object|string)} parsed body
 * @todo Actually do something with the parameters, such as charset
 */
function parseRequestBody (body: any, content_type: string): object | string {
	if (typeof(body) === "object" || Array.isArray(body) || !body) {
		// no need to parse if it's already an object
		return body;
	}

	let parsed_content_type = content_type_module.parse(content_type);

	if (parsed_content_type.type === 'application/json') {
		// parse json
		return JSON.parse(body);
	} else if (parsed_content_type.type === 'application/x-www-form-urlencoded') {
		// parse form encoded
		return qs_module.parse(body);
	} else {
		// maybe it's supposed to be literal 
		return body;
	}
}

/**
 * Attempts the parse the request body into a useful object
 */
let parseBody: Middleware = function (method, url, body, headers, next) {
	this.body = parseRequestBody(body, headers ? headers['content-type'] : undefined);

	return next();
};

export default parseBody;