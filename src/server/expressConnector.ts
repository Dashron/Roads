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
	headers: IncomingHeaders,
	// Express requests are Node streams. The connector reads the body from the stream if nothing else has
	readableDidRead?: boolean,
	// These match Node's stream types, which use any, so a real Express request can be passed in
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	on?(event: string, listener: (...args: any[]) => void): unknown,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	off?(event: string, listener: (...args: any[]) => void): unknown,
	pause?(): unknown
}

export interface ExpressResponse {
	status (code: number): unknown,
	header (name: string, value: string | Array<string>): unknown,
	send (body: string | Buffer): unknown
}

export interface ExpressConnectorOptions {
	/**
	 * The largest request body, in bytes, that the connector reads. Larger bodies are passed to Express as an error
	 * 	with a status of 413. Defaults to 100kb, the same as Express's body parsers
	 */
	limit?: number
}

const DEFAULT_LIMIT = 100 * 1024;

type UnreadRequest = ExpressRequest & Required<Pick<ExpressRequest, 'on' | 'off' | 'pause'>>;

/**
 * Returns true if the request is a stream that nothing has read yet
 */
function isUnreadStream (req: ExpressRequest): req is UnreadRequest {
	return req.readableDidRead === false && typeof req.on === 'function' && typeof req.off === 'function' &&
		typeof req.pause === 'function';
}

/**
 * An error with the HTTP status Express's default error handler should respond with
 */
function httpError (message: string, status: number): Error & { status: number, statusCode: number } {
	return Object.assign(new Error(message), { status, statusCode: status });
}

function tooLarge (limit: number) {
	return httpError(`The request body is larger than the limit of ${limit} bytes`, 413);
}

/**
 * Reads the request body from the stream as a UTF-8 string. An empty body becomes undefined, like a request
 * 	without a body.
 *
 * @param {ExpressRequest} req - The request, which must be an unread stream
 * @param {number} limit - The largest body to read, in bytes
 */
function readBody (req: UnreadRequest, limit: number): Promise<string | undefined> {

	const contentLength = Number(req.headers['content-length']);

	// Don't read a body that says it's too large
	if (contentLength > limit) {
		return Promise.reject(tooLarge(limit));
	}

	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;

		const cleanup = () => {
			req.off('data', onData);
			req.off('end', onEnd);
			req.off('error', onError);
		};

		const onData = (chunk: Buffer | string) => {
			const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
			size += buffer.length;

			if (size > limit) {
				// Stop reading, but leave the connection open so Express can send the 413
				cleanup();
				req.pause();
				reject(tooLarge(limit));
				return;
			}

			chunks.push(buffer);
		};

		const onEnd = () => {
			cleanup();
			// Join the chunks before decoding, so a character split across two chunks is decoded correctly
			resolve(size === 0 ? undefined : Buffer.concat(chunks).toString('utf8'));
		};

		const onError = (err: Error) => {
			cleanup();
			reject(err);
		};

		req.on('data', onData);
		req.on('end', onEnd);
		req.on('error', onError);
	});
}

/**
 * Works out the body to pass to the road
 *
 * @param {ExpressRequest} req - The Express request
 * @param {number} limit - The largest body to read, in bytes
 * @throws {TypeError} If another Express middleware already parsed the body into an object
 */
function getBody (req: ExpressRequest, limit: number): Promise<string | undefined> {
	// Another Express middleware, such as express.text() or express.raw(), already read the body
	if (typeof req.body === 'string') {
		return Promise.resolve(req.body);
	}

	if (Buffer.isBuffer(req.body)) {
		return Promise.resolve(req.body.toString('utf8'));
	}

	if (isUnreadStream(req)) {
		return readBody(req, limit);
	}

	// express.json() and express.urlencoded() read the body and leave an object, so the original text is gone
	if (typeof req.body === 'object' && req.body !== null) {
		return Promise.reject(new TypeError('expressConnector received a request body that another Express ' +
			'middleware already parsed into an object, such as express.json() or express.urlencoded(). ' +
			'Remove that middleware. Roads reads the body itself, and the parse body middleware in your road ' +
			'turns JSON and forms into objects'));
	}

	return Promise.resolve(undefined);
}

/**
 * Creates an Express middleware that passes every request to `road.request`, then copies the status,
 * 	headers and body of the road's response into the Express response.
 *
 * The middleware reads the request body as a UTF-8 string. If another Express middleware has already read it
 * 	as a string or a Buffer, such as express.text() or express.raw(), that body is used instead.
 *
 * @param {Road} road - The road that handles each request
 * @param {object} [options]
 * @param {number} [options.limit] - The largest request body, in bytes. Defaults to 100kb
 * @returns {Function} an Express middleware. Errors from the road, and bodies over the limit, are passed to
 * 	Express with `next(err)`
 */
export function expressConnector (road: Road, options: ExpressConnectorOptions = {}) {
	const limit = options.limit ?? DEFAULT_LIMIT;

	return async function (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void): Promise<void> {
		try {
			const body = await getBody(req, limit);
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
