"use strict";
/**
 * applyToContext.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes a single function to be used with roads middleware. It makes it easy to assign
 * static values to a roads context.
 */

import {Middleware} from '../road';

/**
 * Very simple middleware to apply a single value to the request context.
 * 
 * @param {string} key - The key that should store the value on the request context.
 * @param {*} val - The value to apply to the request context.
 * @returns {function} The middleware function to apply to the road.use(fn) method.
 */
module.exports = function (key: string, val: any) {
	let applyToContext: Middleware;
	applyToContext = function (method, url, body, headers, next) {
		this[key] = val;
		return next();
	};

	return applyToContext;
};