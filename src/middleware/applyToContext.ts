/**
 * applyToContext.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This middleware is a one liner to assign a value to the context.
 * It's useful for making values easily available to each request, such as an api library
 */

import { Context, Middleware } from '../core/road.js';

/**
 * This is a very simple middleware to apply a single value to the request context with a single line of code.
 *
 * @param {string} key - The key that should store the value on the request context.
 * @param {any} val - The value to apply to the request context.
 * @returns {Middleware} The middleware function to apply to the road.use(fn) method.
 */
export function build<T extends Context, K extends keyof T> (key: K, val: T[K]): Middleware<T> {
	const applyToContext: Middleware<T> = function (method, url, body, headers, next) {
		this[key] = val;
		return next();
	};

	return applyToContext;
}