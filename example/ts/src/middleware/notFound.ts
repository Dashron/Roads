/**
 * notFound.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of a middleware that ends the request chain
 */

import { Response, RoadModule } from 'roads';


/**
 * This middleware responds with a 404. Add it after your router, so it only runs when no route matched.
 * 	It doesn't call next, so nothing added after it ever runs
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 */
const notFound: RoadModule.Middleware<RoadModule.Context> = async function (method, url) {
	return new Response(`Page not found: ${method} ${url}`, 404);
};

export default notFound;
