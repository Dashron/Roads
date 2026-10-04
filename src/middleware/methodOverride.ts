/**
 * methodOverride.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Middleware that lets a POST request be treated as a different HTTP method.
 * 	HTML forms can only send GET and POST, so this is how a form reaches PUT, PATCH or DELETE routes.
 */

import { Context, Middleware } from '../core/road.js';
import Response from '../core/response.js';
import { getSingleHeader } from '../util/headers.js';

const DEFAULT_METHODS = ['PUT', 'PATCH', 'DELETE'];
export const METHOD_OVERRIDE_HEADER = 'x-http-method-override';
export const METHOD_OVERRIDE_FIELD = '_method';

export interface MethodOverrideOptions {
	/**
	 * The methods a POST request is allowed to become. Defaults to PUT, PATCH and DELETE.
	 */
	methods?: string[];
}

/**
 * Finds the `_method` value in the query string of a url
 */
function getQueryOverride (url: string): string | undefined {
	const queryStart = url.indexOf('?');

	if (queryStart === -1) {
		return undefined;
	}

	const hashStart = url.indexOf('#', queryStart);
	const query = url.substring(queryStart + 1, hashStart === -1 ? undefined : hashStart);

	return new URLSearchParams(query).get(METHOD_OVERRIDE_FIELD) ?? undefined;
}

/**
 * Finds the `_method` value in the parsed request body
 */
function getBodyOverride (body: unknown): string | undefined {
	if (!body || typeof body !== 'object') {
		return undefined;
	}

	const val: unknown = (body as Record<string, unknown>)[METHOD_OVERRIDE_FIELD];
	const first: unknown = Array.isArray(val) ? val[0] : val;

	return typeof first === 'string' ? first : undefined;
}

/**
 * Creates the method override middleware. This must be added to your road after the
 * 	parse body middleware and the CSRF middleware, and before your router.
 *
 * On POST requests this looks for a different HTTP method in the following places, in order
 *  - The `x-http-method-override` header
 *  - The `_method` field of the parsed request body
 *  - The `_method` query parameter
 *
 * If one is found, the rest of the request chain receives that method instead of POST.
 *
 * @param {MethodOverrideOptions} [options]
 * @returns {Middleware} The middleware function. This value should be passed to road.use(fn);
 */
export function build (options: MethodOverrideOptions = {}): Middleware<Context> {
	const methods = (options.methods ?? DEFAULT_METHODS).map((method) => method.toUpperCase());

	return function methodOverrideMiddleware (method, url, body, headers, next) {
		// We check this on every request, so a misconfigured road fails right away
		//		instead of only when someone sends an override
		if (this.csrfProtected !== true) {
			throw new Error('The method override middleware requires the CSRF middleware to be added to the road first');
		}

		// Only override on POST methods
		if (method !== 'POST') {
			return next();
		}

		const override = (headers ? getSingleHeader(headers, METHOD_OVERRIDE_HEADER) : undefined) ||
			getBodyOverride(body) ||
			getQueryOverride(url);

		if (!override) {
			return next();
		}

		const newMethod = override.toUpperCase();

		if (!methods.includes(newMethod)) {
			return new Response('Invalid method override', 400);
		}

		return next({ method: newMethod });
	};
}
