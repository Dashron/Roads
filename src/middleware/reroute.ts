/**
 * reroute.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a method that allows you to bind additional roads to a road context. This allows you to manage multiple
 * client side or server side road objects at once
 */

import {Middleware} from '../core/road';
import Road from '../core/road';

/**
 * Applies a method to the request context that allows you to make requests into another roads object
 * 
 * @param {string} key - The name of the key in the request context that will store the roads request.
 * @param  {road} road - The roads object that you will interact with.
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export default function (key: string, road: Road) {
	let reroute: Middleware = function (route_method, route_path, route_body, route_headers, next) {
		this[key] = function (method: string, path: string, body?: string, headers?: object) {
			if (!headers) {
				headers = {};
			}

			return road.request(method, path, body, headers);
		};
		
		return next();
	};

	return reroute;
};