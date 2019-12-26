"use strict";

import { Middleware } from "../road";
import Response from '../response';

/**
 * cors.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This exposes a function that helps you manage CORS in your roads service
 */

/**
 * Apply proper cors headers
 * 
 * @param {object} [options] - A collection of different cors settings.
 * @param {object} [options.validOrigins] - An array of origin urls that can send requests to this API
 * @param {object} [options.supportsCredentials] - A boolean, true if you want this endpoint to receive cookies
 * @param {object} [options.responseHeaders] - An array of valid HTTP response headers
 * @param {object} [options.requestHeaders] - An array of valid HTTP request headers
 * @param {object} [options.validMethods] - An array of valid HTTP methods
 * @param {object} [options.cacheMaxAge] - The maximum age to cache the cors information
 * 
 * @return {function} The middleware to bind to your road
 */
export function cors (options: {
				validOrigins?: string[], 
				supportsCredentials?: boolean, 
				responseHeaders?: {[x: string]: any}, 
				requestHeaders?: {[x:string]: any}, 
				validMethods?: string[],
				cacheMaxAge?: number }) {

	let validOrigins = options.validOrigins || [];
	let supportsCredentials = options.supportsCredentials || false;
	let responseHeaders = options.responseHeaders || [];
	let requestHeaders = options.requestHeaders || [];
	// todo: lowercase all valid methods
	let validMethods = options.validMethods || [];
	let cacheMaxAge = options.cacheMaxAge || null;

	/*
	Note: the comments below are pulled from the spec https://www.w3.org/TR/cors/ to help development
	*/
	let corsMiddleware: Middleware = function (method, url, body, headers, next) {
		let corsResponseHeaders: { [x: string]: any };
		let preflight = method === 'OPTIONS' && headers['access-control-request-method'];
		corsResponseHeaders = {};
		// Terms
		/*
		list of origins consisting of zero or more origins that are allowed access to the resource.
			Note: This can include the origin of the resource itself though be aware that requests to cross-origin resources can be redirected back to the resource.
		list of methods consisting of zero or more methods that are supported by the resource.
		list of headers consisting of zero or more header field names that are supported by the resource.
		list of exposed headers consisting of zero or more header field names of headers other than the simple response headers that the resource might use and can be exposed.
		supports credentials flag that indicates whether the resource supports user credentials in the request. It is true when the resource does and false otherwise.
		*/

	// Simple Requests or Actual Requests https://www.w3.org/TR/cors/#resource-requests
	// Preflight Requests: https://www.w3.org/TR/cors/#resource-preflight-requests

		// Simple: If the Origin header is not present terminate this set of steps. The request is outside the scope of this 
		//         specification.
		// Preflight: If the Origin header is not present terminate this set of steps. The request is outside the scope of 
		//         this specification.
		if (!headers.origin) {
			return next();
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
			uniformly with "*" must in practice generate the Access-Control-Allow-Origin header dynamically in response to every 
			request they wish to allow. As a consequence, authors of such resources should send a Vary: Origin HTTP header 
			or provide other appropriate control directives to prevent caching of such responses, which may be inaccurate 
			if re-used across-origins.
		*/
		if (validOrigins[0] !== '*' && validOrigins.indexOf(headers.origin) === -1) {
			// this shouldn't use console.log, but boy it's such a pain in the ass to debug that I'm going to keep it here for a bit
			// todo: better debug tracking
			console.log('CORS ERROR: bad origin', headers.origin);
			return next();
		}

		if (preflight) {
			/*
			Preflight
			Let method be the value as result of parsing the Access-Control-Request-Method header.
			If there is no Access-Control-Request-Method header or if parsing failed, do not set any additional headers and terminate this set of steps. The request is outside the scope of this specification.
			*/
			let corsMethod = headers['access-control-request-method'];

			/*
			preflight
			If method is not a case-sensitive match for any of the values in list of methods do not set any additional 
				headers and terminate this set of steps.

			Note: Always matching is acceptable since the list of methods can be unbounded.
			*/

			// todo: lowercase valid methods and cors method
			if (validMethods.indexOf(corsMethod) === -1) {
				// this shouldn't use console.log, but boy it's such a pain in the ass to debug that I'm going to keep it here for a bit
				// todo: better debug tracking
				console.log('CORS Error: bad method', corsMethod);
				return next();
			}

			/*
			preflight
			Let header field-names be the values as result of parsing the Access-Control-Request-Headers headers.

			Note: If there are no Access-Control-Request-Headers headers let header field-names be the empty list.
			Note: If parsing failed do not set any additional headers and terminate this set of steps. The request is outside the scope of this specification.
			*/
			try {
				var headerNames = headers['access-control-request-headers'] ? headers['access-control-request-headers'].split(',') : [];
			} catch (e) {
				// this shouldn't use console.log, but boy it's such a pain in the ass to debug that I'm going to keep it here for a bit
				// todo: better debug tracking
				console.log('CORS Error: request headers parse fail');
				return next();
			}

			/*
			preflight
			If any of the header field-names is not a ASCII case-insensitive match for any of the values in list of 
				headers do not set any additional headers and terminate this set of steps.

			Note: Always matching is acceptable since the list of headers can be unbounded.
			*/

			for (let i = 0; i < headerNames.length; i++) {
				if (requestHeaders.indexOf(headerNames[i]) === -1) {
					// this shouldn't use console.log, but boy it's such a pain in the ass to debug that I'm going to keep it here for a bit
					// todo: better debug tracking
					console.log('CORS Error: invalid header requested', headerNames[i]);
					return next();
				}
			}

			/*
			Preflight
			Optionally add a single Access-Control-Max-Age header with as value the amount of seconds the user agent is allowed to cache the result of the request.
			*/
			if (typeof(cacheMaxAge) === "number") {
				corsResponseHeaders['access-control-max-age'] = cacheMaxAge;
			}

			/*
			Preflight
			If method is a simple method this step may be skipped.
			Add one or more Access-Control-Allow-Methods headers consisting of (a subset of) the list of methods.
			Note: If a method is a simple method it does not need to be listed, but this is not prohibited.
			Note: Since the list of methods can be unbounded, simply returning the method indicated by Access-Control-Request-Method (if supported) can be enough.
			*/
			corsResponseHeaders['access-control-allow-methods'] = validMethods.join(', ');

			/*
			Preflight
			If each of the header field-names is a simple header and none is Content-Type, this step may be skipped.
			Add one or more Access-Control-Allow-Headers headers consisting of (a subset of) the list of headers.
			Note: If a header field name is a simple header and is not Content-Type, it is not required to be listed. Content-Type is to be listed as only a subset of its values makes it qualify as simple header.
			Note: Since the list of headers can be unbounded, simply returning supported headers from Access-Control-Allow-Headers can be enough.
			*/
			corsResponseHeaders['access-control-allow-headers'] = requestHeaders.join(', ');
		} else {
			/*
			Simple
			If the list of exposed headers is not empty add one or more Access-Control-Expose-Headers headers, 
			with as values the header field names given in the list of exposed headers.

			By not adding the appropriate headers resource can also clear the preflight result cache of all entries 
			where origin is a case-sensitive match for the value of the Origin header and url is a case-sensitive 
			match for the URL of the resource.
			*/
			if (responseHeaders && responseHeaders.length) {
				corsResponseHeaders['access-control-expose-headers'] = responseHeaders.join(', ');
			}
		}

		/*
		preflight
		If the resource supports credentials add a single Access-Control-Allow-Origin header, 
		with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials 
		header with the case-sensitive string "true" as value.

		Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or 
			the string "*" as value.
		Note: The string "*" cannot be used for a resource that supports credentials.
		*/

		/*
		Simple
		If the resource supports credentials add a single Access-Control-Allow-Origin header, 
		with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials 
		header with the case-sensitive string "true" as value

		Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or
			the string "*" as value.
		Note: The string "*" cannot be used for a resource that supports credentials.
		*/

		if (supportsCredentials) {
			corsResponseHeaders['access-control-allow-origin'] = headers.origin;
			corsResponseHeaders['access-control-allow-credentials'] = 'true';
		} else {
			// We can't have allow-credentials if we use an asterisk for the origin headers.
			corsResponseHeaders['access-control-allow-origin'] = headers.origin;
		}

		if (preflight) {
			return Promise.resolve(new Response('', 200, corsResponseHeaders));
		}

		return next()
		.then((response: Response) => {
			for (let key in corsResponseHeaders) {
				response.headers[key] = corsResponseHeaders[key];
			}

			return response;
		});
	};

	return corsMiddleware;
};
