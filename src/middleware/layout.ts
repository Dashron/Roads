/**
 * layout.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a function that builds a middleware to wrap each HTML response in a layout, such as a full HTML page
 */

import { Context, Middleware } from '../core/road.js';
import RoadsResponse from '../core/response.js';
import { getSingleHeader, normalizeHeaders } from '../util/headers.js';

/**
 * Receives the body of the response and the request context, and returns the new body
 */
export interface LayoutFunction<ContextType extends Context> {
	(body: string, context: ContextType): string | Promise<string>
}

/**
 * Returns true if the response should be sent as is, without the layout
 *
 * @param {RoadsResponse} response - The response from the rest of the request chain
 */
function skipLayout (response: RoadsResponse): boolean {
	// The road only lower-cases header names after the request chain finishes, so a route may have set Content-Type
	const contentType = getSingleHeader(normalizeHeaders(response.headers), 'content-type');

	// Redirects and 304 Not Modified responses must not have a body
	return (response.status >= 300 && response.status < 400) ||
		// Only HTML gets the HTML layout. Responses without a content type are assumed to be HTML
		(contentType !== undefined && !contentType.toLowerCase().startsWith('text/html'));
}

/**
 * Builds a middleware that wraps each HTML response in a layout. The middleware calls `next()`, so add it before
 * 	your router, and it wraps whatever the rest of the request chain returns.
 *
 * Redirects, 304 Not Modified responses and responses with a content type other than `text/html` are returned
 * 	as is. To skip the layout for any other response, return the body unchanged from your layout function.
 *
 * The layout usually belongs only on the server. In the browser, RoadsPJAX renders each response into a
 * 	page that already has the layout.
 *
 * @param {function} layout - Receives the response body and the request context, and returns the new body.
 * 	It can return a promise
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export function build<ContextType extends Context = Context> (layout: LayoutFunction<ContextType>): Middleware<ContextType> {
	const layoutMiddleware: Middleware<ContextType> = async function (method, path, body, headers, next) {
		const result = await next();
		// Routes can return strings, so turn them into a response before changing the body
		const response = result instanceof RoadsResponse ? result : new RoadsResponse(result);

		if (skipLayout(response)) {
			return response;
		}

		response.body = await layout(response.body.toString(), this);
		return response;
	};

	return layoutMiddleware;
}
