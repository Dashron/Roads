/**
 * parseBody.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */

import { Context, Middleware } from '../core/road.js';
import { getSingleHeader } from '../util/headers.js';

import * as contentTypeModule from 'content-type';
import RoadsResponse from '../core/response.js';

/**
 * When using typescript you can pass this when adding middleware or
 * 	routes to see proper typing on `this`.
 *
 * This context specifically adds one variable `rawBody`, which is the request body
 * 	exactly as it was received. The parsed body is not on the context, it replaces the
 * 	`body` parameter of every middleware and route that runs after this one.
 */
export interface ParseBodyContext extends Context {
	rawBody: string | undefined
}

/**
 * Thrown when the content-type header is not a valid media type
 */
class InvalidMediaTypeError extends Error {}

/**
 * Parses a form encoded body. Repeated keys become an array of every value.
 * 	The object has no prototype, so use `Object.hasOwn` to check for keys.
 *
 * @param body - The form encoded body
 * @returns The parsed values
 */
function parseFormBody (body: string): Record<string, string | string[]> {
	const values: Record<string, string | string[]> = Object.create(null);

	for (const [key, value] of new URLSearchParams(body)) {
		const existing = values[key];

		if (existing === undefined) {
			values[key] = value;
		} else if (Array.isArray(existing)) {
			existing.push(value);
		} else {
			values[key] = [existing, value];
		}
	}

	return values;
}

/**
 * Translate the request body into a usable value.
 *
 * If the content type is application/json, or any +json type (e.g. application/vnd.api+json), this will
 * 	attempt to parse that json
 * If application/x-www-form-urlencoded this will attempt to parse it as a query format
 * Otherwise this will return a string
 *
 * @param  {string} body - request body
 * @param  {string} content_type - media type of the body
 * @returns {(object|string)} parsed body
 */
function parseRequestBody (body: string | undefined, contentType?: string): unknown {
	if (contentType && body) {
		const parsedContentType = contentTypeModule.parse(contentType);
		// content-type v3 no longer throws on invalid media types, so validate explicitly
		if (!contentTypeModule.isTypeValid(parsedContentType.type)) {
			throw new InvalidMediaTypeError('invalid media type');
		}

		if (parsedContentType.type === 'application/json' || parsedContentType.type.endsWith('+json')) {
			// parse json
			return JSON.parse(body);
		} else if (parsedContentType.type === 'application/x-www-form-urlencoded') {
			// parse form encoded
			return parseFormBody(body);
		}
	}

	// maybe it's supposed to be literal
	return body;
}

export interface ParseBodyOptions {
	/**
	 * The middleware logs a warning with `console.warn` when it receives a body that is not a string, which
	 * 	usually means it was added to the road more than once. Set this to false to turn the warning off.
	 * 	Defaults to true.
	 */
	warnOnNonStringBody?: boolean;
}

/**
 * Creates the parse body middleware with your own options. Use `middleware` if you don't need to change any.
 *
 * @param {ParseBodyOptions} [options]
 * @returns {Middleware} The middleware function. This value should be passed to road.use(fn);
 */
export function build (options: ParseBodyOptions = {}): Middleware<ParseBodyContext, string | undefined> {
	const warnOnNonStringBody = options.warnOnNonStringBody !== false;

	return async function parseBodyMiddleware (method, url, body, headers, next) {
		return parseBody.call(this, warnOnNonStringBody, method, url, body, headers, next);
	};
}

async function parseBody (
	this: ParseBodyContext, warnOnNonStringBody: boolean,
	...[method, url, body, headers, next]: Parameters<Middleware<ParseBodyContext, string | undefined>>
): Promise<RoadsResponse | string> {
	let parsedBody: unknown;

	// The road always starts with a string body, so anything else means an earlier middleware already replaced it.
	//		That is nearly always this middleware being added twice, which makes JSON requests fail below
	if (warnOnNonStringBody && body !== undefined && typeof (body as unknown) !== 'string') {
		console.warn('The parse body middleware received a body that is not a string. This usually means it was ' +
			'added to the road more than once. attachCommonMiddleware already adds it, so remove any extra ' +
			'road.use(ParseBodyMiddleware.middleware)', { path: url, method });
	}

	this.rawBody = body;

	try {
		parsedBody = parseRequestBody(body, getSingleHeader(headers, 'content-type'));
	} catch (e) {
		if (e instanceof InvalidMediaTypeError) {
			return new RoadsResponse('Invalid content-type header', 400);
		}

		return new RoadsResponse('Invalid request body', 400);
	}
	return next({ body: parsedBody });
}

/**
 * Attempts the parse the request body into a useful object. Every middleware and route after this one
 * 	receives the parsed body as its `body` parameter. The original string is kept on the context as `rawBody`.
 *
 * This is the middleware with its default options. Use `build` to change them.
 */
export const middleware: Middleware<ParseBodyContext, string | undefined> = build();