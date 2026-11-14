/**
 * expressConnector.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes an Express middleware that sends each request through a road
 */

import RoadsResponse from '../core/response.js';
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
	resume?(): unknown
}

export interface ExpressResponse {
	status (code: number): unknown,
	header (name: string, value: string | Array<string>): unknown,
	send (body: string | Buffer): unknown
}

export interface ExpressConnectorOptions {
	/**
	 * The largest request body, in bytes, that the connector keeps. A request with a larger body does not reach
	 * 	the road. Defaults to 100kb, the same as Express's body parsers
	 */
	limit?: number,
	/**
	 * Called with the Express request when its body is over the limit. The connector sends the response it
	 * 	returns. A string is sent with a status of 413. Without this function, the connector passes an error
	 * 	with a status of 413 to Express
	 */
	onBodyTooLarge?: (req: ExpressRequest) => RoadsResponse | string | Promise<RoadsResponse | string>
}

const DEFAULT_LIMIT = 100 * 1024;

type UnreadRequest = ExpressRequest & Required<Pick<ExpressRequest, 'on' | 'off' | 'resume'>>;

/**
 * The body to pass to the road. `tooLarge` is set when the body was over the limit, and then there is no body
 * 	and the road does not run
 */
interface RequestBody {
	body: string | undefined,
	tooLarge?: true
}

/**
 * Returns true if the request is a stream that nothing has read yet
 */
function isUnreadStream (req: ExpressRequest): req is UnreadRequest {
	return req.readableDidRead === false && typeof req.on === 'function' && typeof req.off === 'function' &&
		typeof req.resume === 'function';
}

/**
 * An error with the HTTP status Express's default error handler should respond with
 */
function httpError (message: string, status: number): Error & { status: number, statusCode: number } {
	return Object.assign(new Error(message), { status, statusCode: status });
}

/**
 * Reads the request body from the stream as a UTF-8 string. An empty body becomes undefined, like a request
 * 	without a body. A body over the limit is not read to the end, and resolves without a body.
 *
 * @param {ExpressRequest} req - The request, which must be an unread stream
 * @param {number} limit - The largest body to read, in bytes
 */
function readBody (req: UnreadRequest, limit: number): Promise<RequestBody> {

	const contentLength = Number(req.headers['content-length']);

	// Don't read a body that says it's too large
	if (contentLength > limit) {
		return Promise.resolve({ body: undefined, tooLarge: true });
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
				// Stop keeping the body, but leave the connection open so a response can be sent. With no listeners
				// 	left, the rest of the body is read and thrown away, which is also what Node does with a body
				// 	nothing read. If the stream was paused instead, the unread body would block the next request
				// 	on a keep-alive connection
				cleanup();
				req.resume();
				resolve({ body: undefined, tooLarge: true });
				return;
			}

			chunks.push(buffer);
		};

		const onEnd = () => {
			cleanup();
			// Join the chunks before decoding, so a character split across two chunks is decoded correctly
			resolve({ body: size === 0 ? undefined : Buffer.concat(chunks).toString('utf8') });
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
function getBody (req: ExpressRequest, limit: number): Promise<RequestBody> {
	// Another Express middleware, such as express.text() or express.raw(), already read the body
	if (typeof req.body === 'string') {
		return Promise.resolve({ body: req.body });
	}

	if (Buffer.isBuffer(req.body)) {
		return Promise.resolve({ body: req.body.toString('utf8') });
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

	return Promise.resolve({ body: undefined });
}

/**
 * Copies the status, headers and body of a response into the Express response
 */
function sendResponse (res: ExpressResponse, response: RoadsResponse): void {
	res.status(response.status);

	for (const [name, value] of Object.entries(response.headers)) {
		if (value !== undefined) {
			res.header(name, value);
		}
	}

	res.send(response.body);
}

/**
 * Creates an Express middleware that passes every request to `road.request`, then copies the status,
 * 	headers and body of the road's response into the Express response.
 *
 * The middleware reads the request body as a UTF-8 string. If another Express middleware has already read it
 * 	as a string or a Buffer, such as express.text() or express.raw(), that body is used instead.
 *
 * A body over the limit is not kept, and the road does not run. If `options.onBodyTooLarge` is set, the
 * 	connector sends the response it returns. Otherwise the connector passes an error with a status of 413 to
 * 	Express.
 *
 * @param {Road} road - The road that handles each request
 * @param {object} [options]
 * @param {number} [options.limit] - The largest request body, in bytes. Defaults to 100kb
 * @param {Function} [options.onBodyTooLarge] - Builds the response for a request with a body over the limit
 * @returns {Function} an Express middleware. Errors from the road, and errors reading the body, are passed to
 * 	Express with `next(err)`
 */
export function expressConnector (road: Road, options: ExpressConnectorOptions = {}) {
	const limit = options.limit ?? DEFAULT_LIMIT;

	return async function (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void): Promise<void> {
		try {
			const { body, tooLarge } = await getBody(req, limit);

			if (tooLarge) {
				if (!options.onBodyTooLarge) {
					next(httpError(`The request body is larger than the limit of ${limit} bytes`, 413));
					return;
				}

				const tooLargeResponse = await options.onBodyTooLarge(req);
				sendResponse(res, typeof tooLargeResponse === 'string' ?
					new RoadsResponse(tooLargeResponse, 413) : tooLargeResponse);
				return;
			}

			sendResponse(res, await road.request(req.method, req.url, body, req.headers));
		} catch (err) {
			next(err);
		}
	};
}
