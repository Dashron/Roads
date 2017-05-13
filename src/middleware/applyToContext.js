"use strict";
/**
* applyToContext.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

/**
 * Very simple middleware to apply a single value to the request context.
 * 
 * @param  String   key The key that should store the value on the request context.
 * @param  Mixed val The value to apply to the request context.
 * @return Function The middleware function to apply to the road.use(fn) method.
 */
module.exports = function (key, val) {
	return function (method, url, body, headers, next) {
		this[key] = val;
		return next();
	};
};