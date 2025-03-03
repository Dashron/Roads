/**
 * removeTrailingSlash.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to remove trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 *
 * When used, any url that ends with a trailing slash will immediately return a response
 * 	object redirecting the client to the same url without the trailing slash (302 redirect
 * 	with Location: [url_without_slash])
 */
import { Context } from '../core/road';
import Response from '../core/response';
import { Route } from '../core/router';

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
export const middleware: Route<Context> = function (method, url, body, headers, next) {
	const parsedPath = url.pathname;

	if (!parsedPath) {
		return next();
	}

	// kill trailing slash as long as we aren't at the root level
	if (parsedPath !== '/' && parsedPath[parsedPath.length - 1] === '/') {
		return Promise.resolve(new Response('', 302, {
			location : parsedPath.substring(0, parsedPath.length - 1)
		}));
	}

	return next();
};