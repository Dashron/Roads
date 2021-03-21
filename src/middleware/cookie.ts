/**
 * cookie.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help with cookies
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

import * as cookie from 'cookie';
import { Middleware } from '../core/road';
import Response from '../core/response';

export class CookieResponse extends Response {
	setCookie: {
		(name: string, value?: string, options?: cookie.CookieSerializeOptions): void
	}

	getCookies: {
		(): {[x: string]: string}
	}

}

const cookieMiddleware: Middleware = function (route_method, route_path, route_body, route_headers, next) {
	// Find the cookies from the request
	if (route_headers.cookie) {
		this.cookies = cookie.parse(
			// todo: hmm... Can we get an array of cookies? I don't think so... this handles it properly if we do though.
			Array.isArray(route_headers.cookie) ? route_headers.cookie.join('; ') : route_headers.cookie);
	} else {
		this.cookies = {};
	}

	// Add a cookie method to the response object. Allows you to set cookies like koa.js
	this.Response.prototype.setCookie = function (name: string, value: string, options?: cookie.CookieSerializeOptions) {
		if (!this._cookie_values) {
			this._cookie_values = {};
		}

		// todo: is this a bug? shouldn't this record an array of cookie values?
		//		I think calling this multiple times for the same value will set multiple
		//		cookie headers, yet only the most recent value in local memory
		// also I think this will be inconsistent with the initially set cookie data. not sure. needs research
		this._cookie_values[name] = {
			value: value
		};

		if (options) {
			this._cookie_values[name].options = options;
		}

		if (!this.headers['Set-Cookie']) {
			this.headers['Set-Cookie'] = [];
		}

		this.headers['Set-Cookie'].push(cookie.serialize(name, value, options));
	};

	this.Response.prototype.getCookies = function () {
		return this._cookie_values;
	};

	return next();
};

export default cookieMiddleware;