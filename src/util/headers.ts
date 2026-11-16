/**
 * headers.ts
 * Copyright(c) 2024 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Utility functions for working with HTTP headers
 */

/**
 * The headers of a request or a response. Each value is a string, or an array of strings when the header
 * 	appears more than once. Roads gives every request and response a headers object with case-insensitive
 * 	names, built by `caseInsensitiveHeaders`.
 */
export interface RoadsHeaders extends Record<string, string | Array<string> | undefined> {}

/**
 * Extracts a single header value from headers object.
 * If the header is an array, returns the first value.
 * If the header is a string, returns it as-is.
 * If the header doesn't exist, returns undefined.
 *
 * @param headers - The headers object (of a request or a response)
 * @param key - The header key to retrieve
 * @returns The header value as a string, or undefined if not found
 */
export function getSingleHeader(headers: RoadsHeaders, key: string): string | undefined {
	const val = headers[key];

	if (Array.isArray(val)) {
		return val[0];
	}

	return val;
}

/**
 * Builds a copy of a headers object with every header name lower-cased.
 * Header names are case-insensitive, so names that only differ by case are merged into a single header
 * that holds all of their values. Headers with an undefined value are dropped.
 *
 * @param headers - The headers object (of a request or a response). It is not modified.
 * @returns A new headers object with lower-case header names
 */
export function normalizeHeaders(headers: RoadsHeaders): Record<string, string | Array<string>> {
	const normalized: Record<string, string | Array<string>> = {};

	for (const [key, val] of Object.entries(headers)) {
		if (val === undefined) {
			continue;
		}

		const lowerKey = key.toLowerCase();
		const existing = normalized[lowerKey];

		if (existing === undefined) {
			normalized[lowerKey] = Array.isArray(val) ? [...val] : val;
		} else {
			normalized[lowerKey] = ([] as Array<string>).concat(existing, val);
		}
	}

	return normalized;
}

/**
 * Returns the lower-case form of a header name. Symbols are returned as is, because they are never header names
 */
function lowerCase (name: string | symbol): string | symbol {
	return typeof name === 'string' ? name.toLowerCase() : name;
}

/**
 * Builds a headers object that treats header names as case-insensitive, as HTTP does. Every name is stored
 * 	in lower case, and reading, assigning, checking or deleting a header finds it whatever casing is used.
 * 	Names in the given headers that only differ by case are merged into one header that holds every value.
 *
 * Roads uses this for the headers of every request and every response.
 *
 * @param headers - The starting headers (of a request or a response). This object is copied, not modified
 * @returns The case-insensitive headers object
 */
export function caseInsensitiveHeaders (headers: RoadsHeaders): RoadsHeaders {
	return new Proxy(normalizeHeaders(headers), {
		get (target, name, receiver) {
			const lowerName = lowerCase(name);

			// Fall back to the name as written, so methods such as hasOwnProperty are still found
			return Reflect.get(target, Object.hasOwn(target, lowerName) ? lowerName : name, receiver) as unknown;
		},
		set (target, name, value) {
			return Reflect.set(target, lowerCase(name), value);
		},
		has (target, name) {
			return Reflect.has(target, lowerCase(name)) || Reflect.has(target, name);
		},
		deleteProperty (target, name) {
			return Reflect.deleteProperty(target, lowerCase(name));
		},
		defineProperty (target, name, descriptor) {
			return Reflect.defineProperty(target, lowerCase(name), descriptor);
		},
		getOwnPropertyDescriptor (target, name) {
			return Reflect.getOwnPropertyDescriptor(target, lowerCase(name));
		}
	});
}

/**
 * Adds a field name to the Vary header without losing any field names that are already there.
 * Header names are case-insensitive, so every casing of "vary" is merged into a single header.
 * If the field name is already listed, or the header is "*" (which already covers everything), nothing is added.
 *
 * @param headers - The outgoing headers object to update
 * @param fieldName - The request header name to add to the Vary list (e.g. "Origin")
 */
export function appendVary(headers: RoadsHeaders, fieldName: string): void {
	const fieldNames: string[] = [];
	let varyKey: string | undefined;

	for (const key of Object.keys(headers)) {
		if (key.toLowerCase() !== 'vary') {
			continue;
		}

		const val = headers[key];
		const lines = Array.isArray(val) ? val : [val ?? ''];

		for (const line of lines) {
			for (const existing of line.split(',')) {
				if (existing.trim()) {
					fieldNames.push(existing.trim());
				}
			}
		}

		// Keep the first casing we find, and drop any others so we end up with one header
		if (varyKey === undefined) {
			varyKey = key;
		} else {
			delete headers[key];
		}
	}

	const alreadyCovered = fieldNames.some(existing =>
		existing === '*' || existing.toLowerCase() === fieldName.toLowerCase());

	if (!alreadyCovered) {
		fieldNames.push(fieldName);
	}

	headers[varyKey ?? 'vary'] = fieldNames.join(', ');
}
