/**
 * reroute.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a method that allows you to bind additional roads to a road context. This allows you to manage multiple
 * client side or server side road objects at once
 */

import { Context, IncomingHeaders, Middleware } from '../core/road';
import Road from '../core/road';

/**
 * Applies a method to the request context that allows you to make requests into another roads object
 *
 * TODO: Get better typing on this. I think we need to wait for https://github.com/Microsoft/TypeScript/pull/26797.
 *     	In the meanwhile anyone who uses this function should include key: Middleware<Context> to
 * 		their final request context type
 *
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export function buildRerouteMiddleware (key: string, road: Road): Middleware<Context> {
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