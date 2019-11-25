"use strict";
/**
 * killSlash.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single middleware function to kill trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 */
import {Middleware} from '../road';
import * as url_module from 'url';

/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
let killSlash: Middleware;
killSlash = function (method, url, body, headers, next) {
	let _self = this;

	let parsedUrl = url_module.parse(url);
	let parsedPath = parsedUrl.path;
	
	if (!parsedPath) {
		return next();
	}

	// kill trailing slash as long as we aren't at the root level
	if (parsedPath !== '/' && parsedPath[parsedPath.length - 1] === '/') {
		return Promise.resolve(new _self.Response('', 302, {
			location : parsedPath.substring(0, parsedPath.length - 1)
		}));
	}

	return next();
};

export default killSlash;