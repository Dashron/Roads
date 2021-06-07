/**
 * removeTrailingSlash.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to remove trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 */
import { Context, Middleware } from '../core/road';
import * as url_module from 'url';
import Response from '../core/response';

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
export const removeTrailingSlashMiddleware: Middleware<Context> = function (method, url, body, headers, next) {
	// TODO: parse is deprecated, but the URL object that replaces it doesn't do what I need it to
	const parsedUrl = url_module.parse(url);
	const parsedPath = parsedUrl.path;

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