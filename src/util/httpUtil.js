"use strict";
/**
 * httpUtil.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes some common utility functions for HTTP
 * @todo do we still need this? I don't like having dumping ground modules like this
 */

const qs_module = require('querystring');
module.exports = {
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
	parseBody: function (body, content_type) {
		if (typeof(body) === "object" || Array.isArray(body) || !body) {
			// no need to parse if it's already an object
			return body;
		}

		if (content_type === 'application/json') {
			// parse json
			return JSON.parse(body);
		} else if (content_type === 'application/x-www-form-urlencoded') {
			// parse form encoded
			return qs_module.parse(body);
		} else {
			// maybe it's supposed to be literal 
			return body;
		}
	}
};