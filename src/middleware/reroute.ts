/**
 * reroute.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Applies a method to the request context that allows you to make requests into another roads object.
 * This is useful when you're running two servers locally. One example is a webserver and a separate API server.
 */

import { Context, IncomingHeaders, Middleware } from '../core/road';
import Road from '../core/road';

/**
 * Applies a method to the request context that allows you to make requests into another roads object.
 * This is useful when you're running two servers locally. One example is a webserver and a separate API server.
 *
 * TODO: Should this just use applytocontext?
 *
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export function build (key: string, road: Road): Middleware<Context> {
	const reroute: Middleware<Context> = function (route_method, route_path, route_body, route_headers, next) {
		this[key] = function (method: string, path: string, body?: string, headers?: IncomingHeaders) {
			if (!headers) {
				headers = {};
			}

			return road.request(method, path, body, headers);
		};

		return next();
	};

	return reroute;
}