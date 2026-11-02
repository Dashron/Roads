/**
 * expressConnector.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes an Express middleware that sends each request through a road
 */

import type Road from '../core/road.js';
import type { IncomingHeaders } from '../core/road.js';

// These only describe what the connector uses from Express, so the package's types work without @types/express
export interface ExpressRequest {
	method: string,
	url: string,
	body?: unknown,
	headers: IncomingHeaders
}

export interface ExpressResponse {
	status (code: number): unknown,
	header (name: string, value: string | Array<string>): unknown,
	send (body: string | Buffer): unknown
}

/**
 * Creates an Express middleware that passes every request to `road.request`, then copies the status,
 * 	headers and body of the road's response into the Express response.
 *
 * Roads expects the request body as a string, so add `express.text({ type: '*\/*' })` before this middleware.
 * 	Any other kind of body reaches the road as undefined.
 *
 * @param {Road} road - The road that handles each request
 * @returns {Function} an Express middleware. Errors from the road are passed to Express with `next(err)`
 */
export function expressConnector (road: Road) {
	return async function (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void): Promise<void> {
		try {
			const body = typeof req.body === 'string' ? req.body : undefined;
			const response = await road.request(req.method, req.url, body, req.headers);

			res.status(response.status);

			for (const [name, value] of Object.entries(response.headers)) {
				if (value !== undefined) {
					res.header(name, value);
				}
			}

			res.send(response.body);
		} catch (err) {
			next(err);
		}
	};
}
