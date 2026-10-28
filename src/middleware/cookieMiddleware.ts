/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Middleware for managing cookies
 */
import * as cookie from 'cookie';
import { Context, IncomingHeaders, Middleware } from '../core/road.js';
import { NextCallback } from '../core/requestChain.js';
import Response from '../core/response.js';

/**
 * The Cookie Context represents the request context when either the
 * 	server or client middleware are used. This context includes two functions.
 *
 * When you're using typescript you can pass this context to one of
 * 	the middleware or route's generics to get proper typing on the request context.
 *
 * See the readme for examples.
 */
export interface CookieContext extends Context {
	/**
	 * Calling this function will store your new cookies.
	 * 	The parameters directly map to the [cookie](https://github.com/jshttp/cookie) module.
	 * 	Pass null as the value to remove the cookie. When removing, pass the same path and
	 * 	domain the cookie was set with.
	 */
	setCookie: (name: string, value?: string | null, options?: cookie.SerializeOptions) => void,
	/**
	 * Returns an object with all the cookies. It defaults to
	 * 	all the request cookies, but merges anything applied via
  	 * 	setCookie on top (i.e. setCookie will override the request cookie)
	 */
	getCookies: () => Record<string, string | undefined>
	newCookies: NewCookies
}

interface SetCookies {[key: string]: string | undefined}
// A null value means the cookie is being removed
interface NewCookies {[key: string]: {
	value: string | null,
	options: cookie.SerializeOptions
}}

/**
 * Merges all the cookies that have been set during this request on top
 * 	of the request cookies, as a collection of key:value pairs. Removed cookies
 * 	are left out, and all the additional metadata will be dropped.
 *
 * @param requestCookies
 * @param newCookies
 * @returns
 */
function getCookieValues(requestCookies: SetCookies, newCookies: NewCookies): SetCookies {
	const cookies: SetCookies = {...requestCookies};

	for (const [key, newCookie] of Object.entries(newCookies)) {
		if (newCookie.value === null) {
			delete cookies[key];
		} else {
			cookies[key] = newCookie.value;
		}
	}

	return cookies;
}

/**
 * Builds a Set-Cookie header value from a cookie set via setCookie.
 * 	Removed cookies are sent empty and already expired.
 *
 * @param name
 * @param newCookie
 * @returns
 */
function serializeCookie(name: string, newCookie: NewCookies[string]): string {
	if (newCookie.value === null) {
		return cookie.stringifySetCookie({
			...newCookie.options, name, value: '', expires: new Date(0), maxAge: 0
		}, newCookie.options);
	}

	return cookie.stringifySetCookie({ ...newCookie.options, name, value: newCookie.value }, newCookie.options);
}

/**
 * Middleware to attach to your road via `road.use`.
 * 	This middleware will add any new cookies to the response object
 * 	and thus is most useful server-side
 *
 * @param route_method
 * @param route_path
 * @param route_body
 * @param route_headers
 * @param next
 * @returns
 */
export const serverMiddleware = function (
	this: CookieContext,
	route_method: string,
	route_path: string,
	route_body: unknown,
	route_headers: IncomingHeaders,
	next: NextCallback
): Promise<Response | string> {
	let cookies: SetCookies = {};
	this.newCookies = {};

	// Find the cookies from the request and store them locally
	if (route_headers.cookie) {
		cookies = cookie.parseCookie(
			Array.isArray(route_headers.cookie) ? route_headers.cookie.join('; ') : route_headers.cookie);
	}

	// Add a setCookie method to the middleware context
	this.setCookie = (name, value, options?) => {
		this.newCookies[name] = {
			value: value === undefined ? '' : value,
			options: options ? options : {}
		};
	};

	// adds a getCookies method to the middleware context
	this.getCookies = () => {
		return getCookieValues(cookies, this.newCookies);
	};

	// Apply the cookie headers to the response
	return next().then((response: Response | string) => {
		const newCookiesEntries = Object.entries(this.newCookies);

		// If there are new cookies to transmit
		if (newCookiesEntries.length) {
			// Ensure we're dealing with a response object and not a string
			if (!(response instanceof Response)) {
				response = new Response(response);
			}

			// Header names are case-insensitive, so collect every casing of set-cookie the route might have used
			// 		into one array. This way we end up with a single header and none of the cookies are lost.
			let setCookies: Array<string> = [];

			for (const key of Object.keys(response.headers)) {
				if (key.toLowerCase() === 'set-cookie') {
					setCookies = setCookies.concat(response.headers[key] || []);
					delete response.headers[key];
				}
			}

			// Apply all the cookies
			for (const [cookieKey, cookieValue] of newCookiesEntries) {
				setCookies.push(serializeCookie(cookieKey, cookieValue));
			}

			response.headers['set-cookie'] = setCookies;
		}

		return response;
	});
};

/**
 * Creates a middleware function to attach to your road via `road.use`.
 * 	This middleware will add the cookie to document.cookie,
 * 	so it's most useful to be used client side
 *
 * @param pageDocument The pages Document object
 * @returns Middleware
 */
export const buildClientMiddleware: (pageDocument: Document) => Middleware<CookieContext> = (pageDocument) => {

	return function (route_method, route_path, route_body, route_headers, next) {

		// Reuse the cookie middleware, but automatically inject and extract cookies from the document
		return serverMiddleware.call(this, route_method, route_path, route_body, {
			...route_headers, cookie: pageDocument.cookie
		}, next)
			.then((response) => {

				for (const [key, cookieValue] of Object.entries(this.newCookies)) {
					if (cookieValue) {
						pageDocument.cookie = serializeCookie(key, cookieValue);
					}
				}

				return response;
			});
	};
};