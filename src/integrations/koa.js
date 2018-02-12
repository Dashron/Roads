"use strict";
/**
 * koa.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file exposes a single function to allow you to use roads as middleware with koa.js
 */

/**
 * Koa.js middleware to use a roads.js router.
 *
 * This middleware works best if the road provided is using the roads cookie middleware.
 * 
 * @param {Road} road -  The Road object that contains all routing information for this integration.
 * @returns {function} A middleware function to use with Koa's use method.
 */
module.exports = function (road) {
	// koa middleware to translate koa requests into roads requests, and roads responses into koa responses
	return async function router (ctx, next) {
		// This should be the final middleware, so if anything was assigned after we should run that first.
		await next;

		// If koa has already selected a response to render we should not execute this method.
		// At the moment detecting a change in the status code (which defaults to 404) is the easiest way to
		// handle this.
		if (ctx.response.status !== 404) {
			return;
		}

		// Execute the route
		let response = await road.request(ctx.method, ctx.originalUrl, ctx.request.body, ctx.headers);			

		// Extract the cookies from the response object (getCookies is applied in the cookie middleware)
		if (response.getCookies) {
			let cookies = response.getCookies();

			// Pass all the cookies from the response object up to koa
			if (cookies) {
				// Kill the cookies set by the response object and rely on the koa cookie management
				delete response.headers['Set-Cookie'];
				for (let name in cookies) {
					if (cookies.hasOwnProperty(name)) {
						ctx.cookies.set(name, cookies[name].value, cookies[name].options);
					}
				}
			}
		}

		// Translate the Roads HTTP Status to Koa
		ctx.status = response.status;

		// Translate the Roads Headers to Koa
		for (let header in response.headers) {
			if (response.headers.hasOwnProperty(header)) {
				ctx.set(header, response.headers[header]);
			}
		}

		// Translate the Roads Body to Koa
		if (response.body) {
			ctx.body = response.body;
		}
	};
};
