/**
 * cors.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This exposes a function that helps you manage CORS in your roads service
 */

import { Context, IncomingHeaders, Middleware } from '../core/road.js';
import Response, { OutgoingHeaders } from '../core/response.js';

function getSingleHeader(headers: IncomingHeaders | OutgoingHeaders, key: string): string | undefined {
	if (headers) {
		// This is a little weirder than I would like, but it works better with typescript
		const val = headers[key];

		if (Array.isArray(val)) {
			return val[0];
		}

		return val;
	}
}

/**
 * Validates that an origin string matches the proper format: scheme://host[:port]
 * Also handles the special "null" origin case for sandboxed contexts
 * @param origin - The origin string to validate
 * @returns true if the origin is valid, false otherwise
 */
function isValidOrigin(origin: string): boolean {
	// Handle the special "null" origin case
	if (origin === 'null') {
		return true;
	}

	try {
		// Use URL constructor to validate origin format
		const url = new URL(origin);
		// Origin should only contain scheme, host, and port - no path, query, or fragment
		return url.pathname === '/' && url.search === '' && url.hash === '';
	} catch {
		return false;
	}
}

/**
 * Determines if a request qualifies as a CORS simple request that can skip preflight validation
 * Simple requests use safe methods and headers that don't require preflight checks
 * @param method - HTTP method
 * @param headers - Request headers
 * @returns true if this is a simple request, false otherwise
 */
function isSimpleCorsRequest(method: string, headers: IncomingHeaders): boolean {
	// CORS-safelisted methods only
	const simpleMethods = ['GET', 'HEAD', 'POST'];
	if (!simpleMethods.includes(method.toUpperCase())) {
		return false;
	}

	// Check for non-simple headers (beyond CORS-safelisted headers)
	const simpleHeaders = [
		'accept', 'accept-language', 'content-language', 'content-type',
		'cache-control', 'expires', 'last-modified', 'pragma'
	];

	for (const header in headers) {
		if (!simpleHeaders.includes(header.toLowerCase())) {
			return false;
		}
	}

	// For POST with Content-Type, validate it's a CORS-safelisted type
	if (method.toUpperCase() === 'POST') {
		const contentType = getSingleHeader(headers, 'content-type');
		if (contentType) {
			const simpleTypes = [
				'application/x-www-form-urlencoded',
				'multipart/form-data',
				'text/plain'
			];
			if (!simpleTypes.some(type => contentType.toLowerCase().startsWith(type))) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Sets up everything you need for your server to properly respond to CORS requests.
 *
 * @param {object} [options] - A collection of different cors settings.
 * @param {object} [options.validOrigins] - An array of origin urls that can send requests to this API
 * @param {object} [options.supportsCredentials] - A boolean, true if you want this endpoint to receive cookies
 * @param {object} [options.responseHeaders] - An array of valid HTTP response headers
 * @param {object} [options.requestHeaders] - An array of valid HTTP request headers
 * @param {object} [options.validMethods] - An array of valid HTTP methods
 * @param {object} [options.cacheMaxAge] - The maximum age to cache the cors information
 * @param {object} [options.returnCorsErrors] - Return specific CORS error responses instead of calling next()
 *                                            (default: true)
 *
 * @return {function} The middleware to bind to your road
 */
export function build (options: {
		validOrigins?: string[],
		supportsCredentials?: boolean,
		allowedResponseHeaders?: Array<string>,
		allowedRequestHeaders?: Array<string>,
		allowedMethods?: Array<string>,
		cacheMaxAge?: number,
		logger?: {log: (ley: string, data?: unknown) => void},
		returnCorsErrors?: boolean
	}): Middleware<Context> {

	const validOrigins = options.validOrigins || [];
	const supportsCredentials = options.supportsCredentials || false;
	const allowedResponseHeaders = options.allowedResponseHeaders || [];
	const allowedRequestHeaders = options.allowedRequestHeaders || [];
	const allowedMethods = options.allowedMethods || [];
	const cacheMaxAge = options.cacheMaxAge || null;
	const logger = options.logger || { log: () => { /* do nothing */ } };
	const returnCorsErrors = options.returnCorsErrors !== false;

	/*
	 * Helper function to handle CORS errors consistently
	 */
	const handleCorsError = (next: () => Promise<string | Response>, errorType: string,
		details?: string, statusCode = 403): Promise<Response> => {
		if (returnCorsErrors) {
			const errorMessage = details ? `CORS Error: ${errorType} - ${details}` : `CORS Error: ${errorType}`;
			logger.log(errorMessage);
			return Promise.resolve(new Response(errorMessage, statusCode, {
				'content-type': 'text/plain'
			}));
		} else {
			logger.log(`CORS ERROR: ${errorType}`, details);
			return next().then(result => {
				if (typeof result === 'string') {
					return new Response(result, 200);
				}
				return result;
			});
		}
	};

	/*
	Note: the comments below are pulled from the spec https://www.w3.org/TR/cors/ to help development
	*/
	const corsMiddleware: Middleware<Context> = function (method, url, body, headers, next) {
		const corsResponseHeaders: Record<string, string> = {};
		/*
		 * Terms
		 *	"list of origins" consisting of zero or more origins that are allowed access to the resource.
		 *		Note: This can include the origin of the resource itself though be aware that requests to
		 *		cross-origin resources can be redirected back to the resource.
		 *	"list of methods" consisting of zero or more methods that are supported by the resource.
		 *	"list of headers" consisting of zero or more header field names that are supported by the resource.
		 *	"list of exposed headers" consisting of zero or more header field names of headers other than
		 *		the simple response headers that the resource might use and can be exposed.
		 *	"supports credentials flag" that indicates whether the resource supports user credentials
		 *		in the request. It is true when the resource does and false otherwise.
		 *  "Simple Requests" If the Origin header is not present terminate this set of
		 * 		steps. The request is outside the scope of this specification. https://www.w3.org/TR/cors/#resource-requests
		 * 	"Actual Requests" https://www.w3.org/TR/cors/#resource-requests
		 *  "Preflight Requests":  If the Origin header is not present terminate this set of steps. The request is \
		 * 		outside the scope of this specification. https://www.w3.org/TR/cors/#resource-preflight-requests
		*/
		if (!headers || !headers.origin) {
			return next();
		}

		const preflight = method === 'OPTIONS' && headers['access-control-request-method'];
		const originHeader = getSingleHeader(headers, 'origin');

		// Optimize simple requests - skip complex validation for CORS-safelisted requests
		const isSimpleRequest = !preflight && isSimpleCorsRequest(method, headers);

		if (isSimpleRequest) {
			// Validate origin format
			if (originHeader && !isValidOrigin(originHeader)) {
				return handleCorsError(next, 'invalid origin format', originHeader, 400);
			}

			// Validate against allowed origins
			if (validOrigins[0] !== '*' && originHeader && !validOrigins.includes(originHeader)) {
				return handleCorsError(next, 'origin not allowed', originHeader, 403);
			}

			// For simple requests, set basic CORS headers
			if (originHeader) {
				corsResponseHeaders['access-control-allow-origin'] = originHeader;
				// Add Vary: Origin header for non-wildcard origins to prevent cache poisoning
				if (validOrigins[0] !== '*') {
					corsResponseHeaders['vary'] = 'Origin';
				}
			}

			if (supportsCredentials) {
				corsResponseHeaders['access-control-allow-credentials'] = 'true';
			}

			if (allowedResponseHeaders && allowedResponseHeaders.length) {
				corsResponseHeaders['access-control-expose-headers'] = allowedResponseHeaders.join(', ');
			}

			return next()
				.then((response: Response) => {
					for (const key in corsResponseHeaders) {
						response.headers[key] = corsResponseHeaders[key];
					}
					return response;
				});
		}


		/* Simple:
		If the value of the Origin header is not a case-sensitive match for any of the values in list of
		origins do not set any additional headers and terminate this set of steps.

		Note: Always matching is acceptable since the list of origins can be unbounded.
		*/

		/* Preflight:
		If the value of the Origin header is not a case-sensitive match for any of the values in list of
		origins do not set any additional headers and terminate this set of steps.

		Note: Always matching is acceptable since the list of origins can be unbounded.
		Note: The Origin header can only contain a single origin as the user agent will not follow redirects.
		Implementation Note: Resources that wish to enable themselves to be shared with multiple Origins but do not respond
			uniformly with "*" must in practice generate the Access-Control-Allow-Origin header dynamically in response to
			every request they wish to allow. As a consequence, authors of such resources should send a Vary: Origin HTTP
			header or provide other appropriate control directives to prevent caching of such responses, which may be
			inaccurate if re-used across-origins.
		*/

		// Validate origin format
		if (originHeader && !isValidOrigin(originHeader)) {
			return handleCorsError(next, 'invalid origin format', originHeader, 400);
		}

		if (validOrigins[0] !== '*' && originHeader && !validOrigins.includes(originHeader)) {
			return handleCorsError(next, 'origin not allowed', originHeader, 403);
		}

		if (preflight) {
			/*
			 *	Preflight
			 *	Let method be the value as result of parsing the Access-Control-Request-Method header.
			 *	If there is no Access-Control-Request-Method header or if parsing failed, do not set any additional headers
			 *	and terminate this set of steps. The request is outside the scope of this specification.
			*/
			const corsMethod = getSingleHeader(headers, 'access-control-request-method');

			/*
			preflight
			If method is not a case-sensitive match for any of the values in list of methods do not set any additional
				headers and terminate this set of steps.

			Note: Always matching is acceptable since the list of methods can be unbounded.
			*/
			if (corsMethod && !allowedMethods.includes(corsMethod)) {
				return handleCorsError(next, 'method not allowed', corsMethod, 405);
			}

			/*
			 *	preflight
			 *	Let header field-names be the values as result of parsing the Access-Control-Request-Headers headers.
			 *
			 *	Note: If there are no Access-Control-Request-Headers headers let header field-names be the empty list.
			 *	Note: If parsing failed do not set any additional headers and terminate this set of steps. The request
			 *		is outside the scope of this specification.
			*/
			let headerNames = undefined;
			const acRequestHeaders = getSingleHeader(headers, 'access-control-request-headers');

			try {
				headerNames = acRequestHeaders ? acRequestHeaders.split(',') : [];
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (e) {
				return handleCorsError(next, 'invalid request headers format', acRequestHeaders, 400);
			}

			/*
			preflight
			If any of the header field-names is not a ASCII case-insensitive match for any of the values in list of
				headers do not set any additional headers and terminate this set of steps.

			Note: Always matching is acceptable since the list of headers can be unbounded.
			*/

			for (let i = 0; i < headerNames.length; i++) {
				const headerName = headerNames[i]?.trim();
				if (headerName) {
					const isAllowed = allowedRequestHeaders.find(allowed =>
						allowed.toLowerCase() === headerName.toLowerCase()
					);
					if (!isAllowed) {
						return handleCorsError(next, 'header not allowed', headerName, 403);
					}
				}
			}

			/*
			 *	Preflight
			 *	Optionally add a single Access-Control-Max-Age header with as value the amount of seconds the user agent is
			 *	allowed to cache the result of the request.
			*/
			if (typeof(cacheMaxAge) === 'number') {
				corsResponseHeaders['access-control-max-age'] = String(cacheMaxAge);
			}

			/*
			 *	Preflight
			 *	If method is a simple method this step may be skipped.
			 *	Add one or more Access-Control-Allow-Methods headers consisting of (a subset of) the list of methods.
			 *	Note: If a method is a simple method it does not need to be listed, but this is not prohibited.
			 *	Note: Since the list of methods can be unbounded, simply returning the method indicated by
			 *		Access-Control-Request-Method (if supported) can be enough.
			*/
			corsResponseHeaders['access-control-allow-methods'] = allowedMethods.join(', ');

			/*
			 *	Preflight
			 *	If each of the header field-names is a simple header and none is Content-Type, this step may be skipped.
			 *	Add one or more Access-Control-Allow-Headers headers consisting of (a subset of) the list of headers.
			 *	Note: If a header field name is a simple header and is not Content-Type, it is not required to be listed.
			 *		Content-Type is to be listed as only a subset of its values makes it qualify as simple header.
			 *	Note: Since the list of headers can be unbounded, simply returning supported headers from
			 * 		Access-Control-Allow-Headers can be enough.
			*/
			corsResponseHeaders['access-control-allow-headers'] = allowedRequestHeaders.join(', ');
		} else {
			/*
			 *	Simple
			 *	If the list of exposed headers is not empty add one or more Access-Control-Expose-Headers headers,
			 *	with as values the header field names given in the list of exposed headers.
			 *
			 *	By not adding the appropriate headers resource can also clear the preflight result cache of all entries
			 *	where origin is a case-sensitive match for the value of the Origin header and url is a case-sensitive
			 *	match for the URL of the resource.
			*/
			if (allowedResponseHeaders && allowedResponseHeaders.length) {
				corsResponseHeaders['access-control-expose-headers'] = allowedResponseHeaders.join(', ');
			}
		}

		/*
		 *	preflight
		 *	If the resource supports credentials add a single Access-Control-Allow-Origin header,
		 *	with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials
		 *	header with the case-sensitive string "true" as value.
		 *
		 *	Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or
		 *		the string "*" as value.
		 *	Note: The string "*" cannot be used for a resource that supports credentials.
		*/

		/*
		 *	Simple
		 *	If the resource supports credentials add a single Access-Control-Allow-Origin header,
		 *	with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials
		 *	header with the case-sensitive string "true" as value
		 *
		 *	Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or
		 *		the string "*" as value.
		 *	Note: The string "*" cannot be used for a resource that supports credentials.
		*/

		if (originHeader) {
			corsResponseHeaders['access-control-allow-origin'] = originHeader;
			// Add Vary: Origin header for non-wildcard origins to prevent cache poisoning
			if (validOrigins[0] !== '*') {
				corsResponseHeaders['vary'] = 'Origin';
			}
		}

		if (supportsCredentials) {
			corsResponseHeaders['access-control-allow-credentials'] = 'true';
		}

		if (preflight) {
			return Promise.resolve(new Response('', 200, corsResponseHeaders));
		}

		return next()
			.then((response: Response) => {
				for (const key in corsResponseHeaders) {
					response.headers[key] = corsResponseHeaders[key];
				}

				return response;
			});
	};

	return corsMiddleware;
}