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

export const middleware: Middleware<ModifiedSinceContext> = function (method, url, body, headers, next) {
	let lastMod: Date | null = null;

	// This is a mouthful, but I can't think of a better, clear function name
	this.shouldReturnNotModifiedResponse = (lastModifiedTime: Date | string) => {
		lastMod = (lastModifiedTime instanceof Date) ? lastModifiedTime : new Date(lastModifiedTime);

		if (headers && headers['if-modified-since']) {
			const lastModified = lastMod;
			const ifModifiedSince = new Date(Array.isArray(headers['if-modified-since']) ?
				headers['if-modified-since'][0] : headers['if-modified-since']);

			// If the time the document was last modified is older than or equal to the client's
			//		provided if-modified-since header, consider it "not modified"
			if (lastModified.getTime() <= ifModifiedSince.getTime()) {
				return true;
			}
		}

		// Always consider the document modified if the client doesn't provide an if-modified-since header
		return false;
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