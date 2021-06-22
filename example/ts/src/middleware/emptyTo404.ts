/**
 * emptyTo404.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */

import { Middleware, Context } from 'roads/types/core/road';
import { Response } from 'roads';

/**
 * This middleware translates missing responses into 404s
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
const emptyTo404: Middleware<Context> = function (method, url, body, headers, next) {
	return next()
		.then((response) => {
			if (!response) {
				return new Response('Page not found', 404);
			}

			return response;
		});
};

export default emptyTo404;

