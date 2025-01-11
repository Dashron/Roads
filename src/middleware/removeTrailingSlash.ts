/**
 * removeTrailingSlash.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to remove trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 *
 * When used, any url that ends with a trailing slash will immediately return a response
 * 	object redirecting the client to the same url without the trailing slash (302 redirect
 * 	with Location: [url_without_slash])
 */
import { Context, Middleware } from '../core/road';
import parse from 'url-parse';
import Response from '../core/response';

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
export const middleware: Middleware<Context> = function (method, url, body, headers, next) {
	// TODO: parse is deprecated, but the URL object that replaces it doesn't do what I need it to
	const parsedUrl = parse(url);
	const parsedPath = parsedUrl.pathname;

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