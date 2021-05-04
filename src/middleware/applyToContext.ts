/**
 * applyToContext.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single function to be used with roads middleware. It makes it easy to assign
 * static values to a roads context.
 */

import {Context, Middleware} from '../core/road';

/**
 * Very simple middleware to apply a single value to the request context.
 *
 * TODO: Get better typing on this. I think we need to wait for https://github.com/Microsoft/TypeScript/pull/26797.
 *		In the meanwhile anyone who uses this function should include key: Middleware<Context> to
 *		their final request context type
 *
 * @param {string} key - The key that should store the value on the request context.
 * @param {any} val - The value to apply to the request context.
 * @returns {Middleware} The middleware function to apply to the road.use(fn) method.
 */
export default function applyToContext (key: string, val: unknown): Middleware<Context> {
	const applyToContext: Middleware<Context> = function (method, url, body, headers, next) {
		this[key] = val;
		return next();
	};

	return applyToContext;
}