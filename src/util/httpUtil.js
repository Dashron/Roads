"use strict";

const qs_module = require('querystring');
module.exports = {
		/**
	 * Translate the request body into a usable object or array
	 * 
	 * @param  mixed  body         
	 * @param  string content_type
	 * @return mixed  parsed body
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