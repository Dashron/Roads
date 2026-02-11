/**
 * headers.ts
 * Copyright(c) 2024 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Utility functions for working with HTTP headers
 */

import { IncomingHeaders } from '../core/road.js';
import { OutgoingHeaders } from '../core/response.js';

/**
 * Extracts a single header value from headers object.
 * If the header is an array, returns the first value.
 * If the header is a string, returns it as-is.
 * If the header doesn't exist, returns undefined.
 *
 * @param headers - The headers object (incoming or outgoing)
 * @param key - The header key to retrieve
 * @returns The header value as a string, or undefined if not found
 */
export function getSingleHeader(headers: IncomingHeaders | OutgoingHeaders, key: string): string | undefined {
	const val = headers[key];

	if (Array.isArray(val)) {
		return val[0];
	}

	return val;
}
