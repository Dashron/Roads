"use strict";
/**
* koa.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

/**
 * Koa.js middleware to use a roads.js router.
 *
 * This middleware works best if the road provided is using the roads cookie middleware.
 * 
 * @param  Road road The Road object that contains all routing information for this integration.
 * @return function A middleware function to use with Koa's use method.
 */
module.exports = function (road) {
	// koa middleware to translate koa requests into roads requests, and roads responses into koa responses
	return function* router (next) {
		// This should be the final middleware, so if anything was assigned after we should run that first.
		yield next;

		// If koa has already selected a response to render we should not execute this method.
		// At the moment detecting a change in the status code (which defaults to 404) is the easiest way to
		// handle this.
		if (this.response.status !== 404) {
			return;
		}

		// Execute the route
		var response = yield road.request(this.method, this.originalUrl, this.request.body, this.headers);			

		// Extract the cookies from the response object (getCookies is applied in the cookie middleware)
		if (response.getCookies) {
			let cookies = response.getCookies();

			// Pass all the cookies from the response object up to koa
			if (cookies) {
				for (let name in cookies) {
					if (cookies.hasOwnProperty(name)) {
						this.cookies.set(name, cookies[name].value, cookies[name]);
					}
				}
			}
		}

		// Translate the Roads HTTP Status to Koa
		this.status = response.status;

		// Translate the Roads Headers to Koa
		for (let header in response.headers) {
			if (response.headers.hasOwnProperty(header)) {
				this.set(header, response.headers[header]);
			}
		}

		// Translate the Roads Body to Koa
		if (response.body) {
			this.body = response.body;
		}
	};
};
