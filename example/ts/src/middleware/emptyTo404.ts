/**
 * emptyTo404.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of a middleware that acts on the response of the rest of the request chain
 */

import { Response, RoadModule } from 'roads';


/**
 * This middleware translates missing responses into 404s. Add it after your router, so it only runs
 * 	when no route matched
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
const emptyTo404: RoadModule.Middleware<RoadModule.Context> = function (method, url, body, headers, next) {
	return next()
		.then((response) => {
			if (!response) {
				return new Response('Page not found', 404);
			}

			return response;
		});
};

export default emptyTo404;

