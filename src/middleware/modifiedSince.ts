/**
 * modifiedSince.ts
 * Copyright(c) 2022 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes middleware that helps manage the if-modified-since caching headers
 */
import { Context, Middleware } from '../core/road';
import Response from '../core/response';

export interface ModifiedSinceContext extends Context {
	checkModifiedSince: (lastModifiedTime: string | Date) => boolean;
	buildNotModifiedResponse: () => Response;
}

export const middleware: Middleware<ModifiedSinceContext> = function (method, url, body, headers, next) {
	let lastMod: Date | null = null;

	this.checkModifiedSince = (lastModifiedTime) => {
		lastMod = (lastModifiedTime instanceof Date) ? lastModifiedTime : new Date(lastModifiedTime);

		if (headers['if-modified-since']) {
			const lastModified = lastMod;
			const ifModifiedSince = new Date(Array.isArray(headers['if-modified-since']) ?
				headers['if-modified-since'][0] : headers['if-modified-since']);

			if (lastModified.getTime() <= ifModifiedSince.getTime()) {
				return true;
			}
		}

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