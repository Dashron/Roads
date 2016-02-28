"use strict";
/**
* cookie.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

/**
 * Middleware to make it easier for roads to work with cookies. 
 *
 * Any parsed cookies from the request header are added as key value pairs on the
 * request context under the "cookie" property.
 *
 * If you want to set new cookies, helper methods have been added onto the request context's 
 * Response object. If you create a new Response object using new this.Response, it will receive
 * a `setCookie` method for updating cookies, and a `getCookieHeader` method for retrieval.
 * 
 * The `setCookie` method uses the [cookie module[(https://github.com/jshttp/cookie). This module
 * accepts the following cookie options
 *
 * - path
 * - expires
 * - maxAge
 * - domain
 * - secure
 * - httpOnly
 * - firstPartyOnly
 * 
 */
module.exports = function () {
	const cookie = require('cookie');
	
	return function (route_method, route_path, route_body, route_headers, next) {
		// Find the cookies from the request
		if (route_headers.cookie) {
			this.cookies = cookie.parse(route_headers.cookie);
		} else {
			this.cookies = {};
		}

		// Add a cookie method to the response object. Allows you to set cookies like koa.js
		this.Response.prototype.setCookie = function (name, value, options) {
			if (!this._cookie_values) {
				this._cookie_values = {};
			}

			this._cookie_values[name] = {
				value: value,
				options: options
			};
		};

		// Get all the cookies set to the response object
		this.Response.prototype.getCookieHeader = function () {
			var header = '';

			for (let i in this._cookie_values) {
				header += cookie.serialize(i, this._cookie_values[i]['value'], this._cookie_values[i]['options']) + ';';
			}

			return header;
		};

		return next();
	};
};