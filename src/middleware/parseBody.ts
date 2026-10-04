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
import * as qsModule from 'fast-querystring';
import Response from '../core/response.js';

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
 * Translate the request body into a usable value.
 *
 * If the content type is application/json this will attempt to parse that json
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
			throw new Error('invalid media type');
		}

		if (parsedContentType.type === 'application/json') {
			// parse json
			return JSON.parse(body);
		} else if (parsedContentType.type === 'application/x-www-form-urlencoded') {
			// parse form encoded
			return qsModule.parse(body);
		}
	}

	// maybe it's supposed to be literal
	return body;
}

/**
 * Attempts the parse the request body into a useful object. Every middleware and route after this one
 * 	receives the parsed body as its `body` parameter. The original string is kept on the context as `rawBody`.
 */
export const middleware: Middleware<ParseBodyContext, string | undefined> = function (method, url, body, headers, next) {
	let parsedBody: unknown;

	this.rawBody = body;

	try {
		parsedBody = parseRequestBody(body, headers ? getSingleHeader(headers, 'content-type') : undefined);
	} catch (e) {
		if (e instanceof Error && e.message === 'invalid media type') {
			return new Response('Invalid content-type header', 400);
		}

		console.error(e);
		return new Response('Invalid request body', 400);
	}
	return next({ body: parsedBody });
};