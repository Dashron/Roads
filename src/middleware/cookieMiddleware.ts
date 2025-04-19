/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Middleware for managing cookies
 */
import * as cookie from 'cookie';
import { Context, Middleware } from '../core/road.js';
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
	 */
	setCookie: (name: string, value?: string, options?: cookie.SerializeOptions) => void,
	/**
	 * Returns an object with all the cookies. It defaults to
	 * 	all the request cookies, but merges anything applied via
  	 * 	setCookie on top (i.e. setCookie will override the request cookie)
	 */
	getCookies: () => Record<string, string | undefined>
	newCookies: NewCookies
}

interface SetCookies {[key: string]: string | undefined}
interface NewCookies {[key: string]: {
	value: string,
	options: cookie.SerializeOptions
}}

/**
 * Translates all the cookies that have been set during this
 * 	request into a collection of key:value pairs. All the additional
 * 	metadata will be dropped.
 *
 * @param newCookies
 * @returns
 */
function getCookieValues(newCookies: NewCookies): SetCookies {
	const cookies: SetCookies = {};

	const cookieKeys = Object.keys(newCookies);

	for (let i = 0; i < cookieKeys.length; i++) {
		const newCookie = newCookies[cookieKeys[i]];
		cookies[cookieKeys[i]] = newCookie.value;
	}

	return cookies;
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
export const serverMiddleware: Middleware<CookieContext> =
function (route_method, route_path, route_body, route_headers, next) {
	let cookies: SetCookies = {};
	this.newCookies = {};

	// Find the cookies from the request and store them locally
	if (route_headers && route_headers.cookie) {
		cookies = cookie.parse(
			Array.isArray(route_headers.cookie) ? route_headers.cookie.join('; ') : route_headers.cookie);
	}

	// Add a setCookie method to the middleware context
	this.setCookie = function (name, value, options?) {
		this.newCookies[name] = {
			value: value ?? '',
			options: options ? options : {}
		};
	};

	// adds a getCookies method to the middleware context
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

			// Force the set cookie response header to be an array, for ease of applying them below.
			if (!response.headers['Set-Cookie']) {
				response.headers['Set-Cookie'] = [];
			}

			if (typeof response.headers['Set-Cookie'] === 'string') {
				response.headers['Set-Cookie'] = [response.headers['Set-Cookie']];
			}

			// Apply all the cookies
			for (let i = 0; i < cookieKeys.length; i++) {
				(response.headers['Set-Cookie']).push(
					cookie.serialize(cookieKeys[i],
						this.newCookies[cookieKeys[i]].value, this.newCookies[cookieKeys[i]].options));
			}
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
			.then((response: Response) => {

				Object.keys(this.newCookies).forEach((key) => {
					pageDocument.cookie = cookie.serialize(key, this.newCookies[key].value, this.newCookies[key].options);
				});

				return response;
			});
	};
};