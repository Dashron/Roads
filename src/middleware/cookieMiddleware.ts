/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help with cookies
 */

/**
 * Middleware to make it easier for roads to work with cookies.
 *
 * Any parsed cookies from the request header are added as key value pairs on the
 * request context under the "cookie" property.
 *
 * If you want to set new cookies, helper methods have been added onto the request context's
 * Response object. If you create a new Response object using new this.Response, it will receive
 * a `setCookie` method for updating cookies, and a `getCookieHeader` method for retrieval.
 *
 * The `setCookie` method uses the [cookie module[(https://github.com/jshttp/cookie). This module
 * accepts the following cookie options
 *
 * - path
 * - expires
 * - maxAge
 * - domain
 * - secure
 * - httpOnly
 * - firstPartyOnly
 *
 */
import * as cookie from 'cookie';
import { Context, Middleware } from '../core/road';
import Response from '../core/response';

export interface CookieContext extends Context {
	setCookie: (name: string, value?: string, options?: cookie.CookieSerializeOptions) => void,
	getCookies: () => {[x: string]: string}
	newCookies: NewCookies
}

interface SetCookies {[key: string]: string}
interface NewCookies {[key: string]: {
	value: string,
	options: cookie.CookieSerializeOptions
}}

function getCookieValues(newCookies: NewCookies): SetCookies {
	const cookies: SetCookies = {};

	const cookieKeys = Object.keys(newCookies);

	for (let i = 0; i < cookieKeys.length; i++) {
		const newCookie = newCookies[cookieKeys[i]];
		cookies[cookieKeys[i]] = newCookie.value;
	}

	return cookies;
}

const cookieMiddleware: Middleware<CookieContext> = function (route_method, route_path, route_body, route_headers, next) {
	let cookies: SetCookies = {};
	this.newCookies = {};

	// Find the cookies from the request and store them locally
	if (route_headers.cookie) {
		cookies = cookie.parse(
			// todo: hmm... Can we get an array of cookies? I don't think so... this handles it properly if we do though.
			Array.isArray(route_headers.cookie) ? route_headers.cookie.join('; ') : route_headers.cookie);
	}

	// Add a cookie method to the middleware context
	this.setCookie = function (name, value, options?) {
		this.newCookies[name] = {
			value: value ?? '',
			options: options ? options : {}
		};
	};

	// Return the inital cookies with any new cookies merged on top.
	this.getCookies = () => {
		return {...cookies, ...getCookieValues(this.newCookies)};
	};

	// Apply the cookie headers to the response
	return next().then((response) => {
		const cookieKeys = Object.keys(this.newCookies);

		// If there are new cookies to transmit
		if (cookieKeys.length) {
			// Ensure we're dealing with a response object and not a string
			if (!(response instanceof Response)) {
				response = new Response(response);
			}

			// Initalize the header
			if (!response.headers['Set-Cookie']) {
				response.headers['Set-Cookie'] = [];
			}

			// Apply all the cookies
			for (let i = 0; i < cookieKeys.length; i++) {
				(response.headers['Set-Cookie'] as Array<string>).push(
					cookie.serialize(cookieKeys[i],
						this.newCookies[cookieKeys[i]].value, this.newCookies[cookieKeys[i]].options));
			}
		}

		return response;
	});
};

export const clientCookieMiddleware: (pageDocument: Document) => Middleware<CookieContext> = (pageDocument) => {

	return function (route_method, route_path, route_body, route_headers, next) {

		// Reuse the cookie middleware, but automatically inject and extract cookies from the document
		return cookieMiddleware.call(this, route_method, route_path, route_body, {
			...route_headers, cookie: pageDocument.cookie
		}, next)
			.then((response: Response) => {

				Object.keys(this.newCookies).forEach((key) => {
					pageDocument.cookie = cookie.serialize(key, this.newCookies[key].value, this.newCookies[key].options);
				});

				return response;
			});
	};
};

export default cookieMiddleware;