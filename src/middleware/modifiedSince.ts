/**
 * modifiedSince.ts
 * Copyright(c) 2022 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes middleware that helps manage the if-modified-since caching headers
 */
import { Context, Middleware } from '../core/road.js';
import Response from '../core/response.js';

export interface ModifiedSinceContext extends Context {
	shouldReturnNotModifiedResponse: (lastModifiedTime: string | Date) => boolean;
	buildNotModifiedResponse: () => Response;
}

/**
 * HTTP dates only have second precision, so milliseconds are dropped before comparing
 */
function toSeconds (date: Date): number {
	return Math.floor(date.getTime() / 1000);
}

export const middleware: Middleware<ModifiedSinceContext> = function (method, url, body, headers, next) {
	let lastMod: Date | null = null;

	// This is a mouthful, but I can't think of a better, clear function name
	this.shouldReturnNotModifiedResponse = (lastModifiedTime: Date | string) => {
		const lastModified = (lastModifiedTime instanceof Date) ? lastModifiedTime : new Date(lastModifiedTime);

		// An invalid date can't be compared, and shouldn't be sent as a last-modified header
		if (isNaN(lastModified.getTime())) {
			lastMod = null;
			return false;
		}

		lastMod = lastModified;

		// RFC 9110 13.1.3: if-modified-since only applies to GET and HEAD, and is ignored when
		//		the request also has an if-none-match header
		if ((method !== 'GET' && method !== 'HEAD') || !headers || headers['if-none-match']) {
			return false;
		}

		const ifModifiedSinceHeader = headers['if-modified-since'];
		const ifModifiedSinceValue = Array.isArray(ifModifiedSinceHeader) ?
			ifModifiedSinceHeader[0] : ifModifiedSinceHeader;

		// Always consider the document modified if the client doesn't provide an if-modified-since header
		if (!ifModifiedSinceValue) {
			return false;
		}

		const ifModifiedSince = new Date(ifModifiedSinceValue);

		// RFC 9110 13.1.3: an invalid date is ignored
		if (isNaN(ifModifiedSince.getTime())) {
			return false;
		}

		// If the time the document was last modified is older than or equal to the client's
		//		provided if-modified-since header, consider it "not modified"
		return toSeconds(lastModified) <= toSeconds(ifModifiedSince);
	};

	this.buildNotModifiedResponse = () => {
		return new Response('', 304);
	};

	return next()
		.then((response) => {
			if (response instanceof Response && lastMod) {
				response.headers['last-modified'] = lastMod.toUTCString();
			}

			return response;
		});
};