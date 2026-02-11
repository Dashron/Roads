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
 * This context specifically adds one variable `body` which will match
 * 	the structure passed to `BodyType`.
 */
export interface ParseBodyContext<BodyType> extends Context {
	body?: BodyType
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
 * Attempts the parse the request body into a useful object
 */
export const middleware: Middleware<Context> = function (method, url, body, headers, next) {
	try {
		this.body = parseRequestBody(body, headers ? getSingleHeader(headers, 'content-type') : undefined);
	} catch (e) {
		if (e instanceof Error && e.message === 'invalid media type') {
			return new Response('Invalid content-type header', 400);
		}

		console.error(e);
		return new Response('Invalid request body', 400);
	}
	return next();
};