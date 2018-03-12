"use strict";
/**
 * parseBody.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single middleware function to help parse request bodies
 */


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
 */
function parseBody (body, content_type) {
	if (typeof(body) === "object" || Array.isArray(body) || !body) {
		// no need to parse if it's already an object
		return body;
	}

	if (content_type.indexOf('application/json') !== -1) {
		// parse json
		return JSON.parse(body);
	} else if (content_type.indexOf('application/x-www-form-urlencoded') !== -1) {
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
module.exports = function (method, url, body, headers, next) {
	this.body = parseBody(body, headers['content-type']);

	return next();
};