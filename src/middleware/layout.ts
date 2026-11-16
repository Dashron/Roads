/**
 * layout.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a function that builds a middleware to wrap each HTML response in a layout, such as a full HTML page
 */

import { Context, Middleware } from '../core/road.js';
import RoadsResponse from '../core/response.js';
import { getSingleHeader } from '../util/headers.js';

/**
 * Receives the response and the request context, and returns the new body.
 *
 * The response is the same instance the rest of the request chain returned, so a layout function can read its
 * 	body, status and headers, and can use `instanceof` to read data that a RoadsResponse subclass carries. When
 * 	the request chain returned a string, or `onError` returned a string, it is the RoadsResponse the middleware
 * 	built from that string.
 */
export interface LayoutFunction<ContextType extends Context> {
	(response: RoadsResponse, context: ContextType): string | Promise<string>
}

/**
 * Receives an error thrown later in the request chain and the request context, and returns the response to send.
 * 	A string becomes the body of a 500 response
 */
export interface LayoutErrorFunction<ContextType extends Context> {
	(error: unknown, context: ContextType): string | RoadsResponse | Promise<string | RoadsResponse>
}

/**
 * Returns true if the response should be sent as is, without the layout
 *
 * @param {RoadsResponse} response - The response from the rest of the request chain
 */
function skipLayout (response: RoadsResponse): boolean {
	const contentType = getSingleHeader(response.headers, 'content-type');

	// The browser doesn't show the body of a redirect, and a 304 Not Modified response must not have a body
	return (response.status >= 300 && response.status < 400) ||
		// Only HTML gets the HTML layout. Responses without a content type are assumed to be HTML
		(contentType !== undefined && !contentType.toLowerCase().startsWith('text/html'));
}

/**
 * Builds a middleware that wraps each HTML response in a layout. The middleware calls `next()`, so add it before
 * 	your router, and it wraps whatever the rest of the request chain returns.
 *
 * Redirects, 304 Not Modified responses and responses with a content type other than `text/html` are returned
 * 	as is. To skip the layout for any other response, return its body unchanged from your layout function.
 *
 * If you pass `onError`, the middleware catches errors thrown later in the request chain and passes them to
 * 	`onError`. The response it returns goes through the same rules as any other response, so an HTML error page
 * 	gets the layout. Without `onError`, errors pass through the middleware. Errors thrown by `onError`, or by the
 * 	layout while it wraps the error page, also pass through.
 *
 * The layout usually belongs only on the server. In the browser, RoadsPJAX renders each response into a
 * 	page that already has the layout.
 *
 * @param {function} layout - Receives the response and the request context, and returns the new body. It can
 * 	return a promise. The response is the same instance the route returned, so the layout can read its body,
 * 	status and headers, and data that a RoadsResponse subclass carries (e.g. `response instanceof MyResponse`).
 * 	When the route or `onError` returned a string, it is the RoadsResponse the middleware built from that string
 * @param {function} [onError] - Receives an error thrown later in the request chain and the request context, and
 * 	returns a string or a RoadsResponse. A string becomes the body of a 500 response. It can return a promise
 * @return {function} The middleware function. This value should be passed to road.use(fn);
 */
export function build<ContextType extends Context = Context> (
	layout: LayoutFunction<ContextType>, onError?: LayoutErrorFunction<ContextType>
): Middleware<ContextType> {
	const layoutMiddleware: Middleware<ContextType> = async function (method, path, body, headers, next) {
		let result: RoadsResponse | string;

		if (onError) {
			try {
				result = await next();
			} catch (error) {
				// Errors thrown by onError are not caught, so they pass through to earlier middleware
				const errorResult = await onError(error, this);
				result = errorResult instanceof RoadsResponse ? errorResult : new RoadsResponse(errorResult, 500);
			}
		} else {
			result = await next();
		}

		// Routes can return strings, so turn them into a response before changing the body
		const response = result instanceof RoadsResponse ? result : new RoadsResponse(result);

		if (skipLayout(response)) {
			return response;
		}

		response.body = await layout(response, this);
		return response;
	};

	return layoutMiddleware;
}
