/**
 * csrf.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes middleware that helps manage cross site request forgery protection
 */

import * as cookie from 'cookie';
import { Context, IncomingHeaders, Middleware } from '../core/road.js';
import Response from '../core/response.js';
import { CookieContext } from './cookieMiddleware.js';
import { StoreValsContext } from './storeVals.js';
import { getSingleHeader } from '../util/headers.js';

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24; // 1 day
// Browsers only accept a cookie with this prefix if it is Secure, has a path of / and has no Domain.
//		That locks the cookie to this exact host, so another subdomain can't replace it with a token of its own
const HOST_PREFIX = '__Host-';
export const CSRF_COOKIE_NAME = `${HOST_PREFIX}csrf`;
// The default cookie name when insecureCookie is true, because browsers refuse the prefix without the Secure flag
export const CSRF_INSECURE_COOKIE_NAME = 'csrf';
export const CSRF_BODY_NAME = 'csrf_token';

/**
 * When using typescript you can pass this when adding middleware or
 * 	routes to see proper typing on `this`.
 */
export interface CSRFContext extends Context {
	/**
	 * Returns the CSRF token for this user, creating it (and its cookie) if there isn't a usable one yet.
	 * 	`data` is only added to the token when a new one is created.
	 */
	getCSRFToken: (data?: Record<string, unknown>) => string;
	/**
	 * Returns a hidden input element containing the CSRF token. Put this in every form that isn't a GET.
	 */
	getCSRFFormElement: (data?: Record<string, unknown>) => string;
	/**
	 * Returns true if the request came from this site and its body contains a CSRF token that matches the CSRF cookie
	 */
	isValidCSRFToken: () => boolean;
	/**
	 * Always true once this middleware has run. Other middleware can use this to require CSRF protection.
	 */
	csrfProtected: true;
}

export type CSRFBody = {
	[CSRF_BODY_NAME]: string;
};

export interface CSRFOptions {
	/**
	 * Turns the token data into a signed string. Roads does not ship any signing logic,
	 * 	so this is where you connect your signing library and secret.
	 * 	e.g. `(payload) => jwt.sign(payload, secret)`
	 */
	sign: (payload: Record<string, unknown>) => string;
	/**
	 * Checks the signature of a token and returns the data that was passed to `sign`.
	 * 	If the token is invalid this should throw, or return anything that is not an object.
	 * 	e.g. `(token) => jwt.verify(token, secret)`
	 */
	verify: (token: string) => unknown;
	/**
	 * The name of the cookie that will hold the CSRF token. Defaults to `__Host-csrf`.
	 * 	The name must start with `__Host-` unless `insecureCookie` is true.
	 */
	cookieName?: string;
	/**
	 * Only set this to true for local development over plain http. It removes the Secure flag
	 * 	from the cookie and the `__Host-` prefix from its name (the default name becomes `csrf`),
	 * 	which lets other subdomains of your site replace the cookie.
	 */
	insecureCookie?: boolean;
	/**
	 * Requests that come from another origin are rejected. If you have other origins that
	 * 	should be allowed to send forms to this one, or a proxy that changes the Host header,
	 * 	list the full origins here. e.g. `['https://www.example.com']`
	 */
	trustedOrigins?: string[];
	/**
	 * How long a token is valid for, in seconds. Defaults to one day.
	 */
	expiresIn?: number;
	/**
	 * Returns the ID of the logged in user, if there is one. Tokens are tied to this ID,
	 * 	so a token created before logging in will not work afterwards.
	 */
	getUserId?: (context: Context) => unknown;
}

type CSRFMiddlewareContext = CSRFContext & CookieContext & Partial<StoreValsContext>;

function escapeAttribute (value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildFormElement (token: string): string {
	return `<input type="hidden" name="${CSRF_BODY_NAME}" value="${escapeAttribute(token)}">`;
}

/**
 * Makes sure the sign and verify functions work together, and that verify really checks the signature.
 * 	A verify function that accepts anything (such as one that only decodes the token) would silently
 * 	turn off the protection, so we refuse to start with one.
 */
function testSigner (sign: CSRFOptions['sign'], verify: CSRFOptions['verify']): void {
	const isAccepted = (token: string) => {
		try {
			const payload = verify(token);
			return !!payload && typeof payload === 'object';
		} catch {
			return false;
		}
	};

	const token = sign({ exp: Math.floor(Date.now() / 1000) + 60 });

	if (typeof token !== 'string' || !token) {
		throw new Error('The CSRF sign function must return a non-empty string');
	}

	if (!isAccepted(token)) {
		throw new Error('The CSRF verify function did not accept a token created by the sign function');
	}

	// Change one character in the middle of the token
	const middle = Math.floor(token.length / 2);
	const tampered = token.substring(0, middle) + (token[middle] === 'A' ? 'B' : 'A') + token.substring(middle + 1);

	if (isAccepted(tampered)) {
		throw new Error('The CSRF verify function accepted a token that was tampered with. ' +
			'Make sure it checks the signature (e.g. jwt.verify, not jwt.decode)');
	}
}

/**
 * Returns false if a browser tells us the request was sent by a page on another origin.
 * 	Requests without any of these headers (such as non-browser clients) are let through,
 * 	and still have to pass the token check.
 */
function isSameOrigin (headers: IncomingHeaders | undefined, trustedOrigins: string[]): boolean {
	if (!headers) {
		return true;
	}

	const origin = getSingleHeader(headers, 'origin');

	if (origin && trustedOrigins.includes(origin)) {
		return true;
	}

	// Modern browsers send this on every request to a secure site, and pages can not change it.
	//		"none" means the user started the request themselves, such as from the address bar
	const fetchSite = getSingleHeader(headers, 'sec-fetch-site');

	if (fetchSite) {
		return fetchSite === 'same-origin' || fetchSite === 'none';
	}

	if (!origin) {
		return true;
	}

	const host = getSingleHeader(headers, 'host');

	if (!host) {
		return false;
	}

	try {
		return new URL(origin).host === host.toLowerCase();
	} catch {
		// This includes the "null" origin that sandboxed pages send
		return false;
	}
}

/**
 * Creates the CSRF middleware. This must be added to your road after the cookie middleware and
 * 	the parse body middleware. It can only be used on the server. In the browser use `buildClientMiddleware`.
 *
 * Every POST, PUT, PATCH and DELETE request must come from this origin, and include a `csrf_token` body field
 * 	that matches the CSRF cookie, otherwise the request is rejected with a 403.
 *
 * @param {CSRFOptions} options
 * @returns {Middleware} The middleware function. This value should be passed to road.use(fn);
 */
export function build (options: CSRFOptions): Middleware<CSRFMiddlewareContext> {
	const { sign, verify } = options;
	const insecureCookie = options.insecureCookie === true;
	const cookieName = options.cookieName ?? (insecureCookie ? CSRF_INSECURE_COOKIE_NAME : CSRF_COOKIE_NAME);
	const trustedOrigins = options.trustedOrigins ?? [];
	const expiresIn = options.expiresIn ?? DEFAULT_EXPIRY_SECONDS;

	if (typeof document !== 'undefined') {
		throw new Error('The CSRF middleware can not be built in the browser, because your signing secret ' +
			'must never be part of your client code. Use CSRFMiddleware.buildClientMiddleware instead');
	}

	if (!insecureCookie && !cookieName.startsWith(HOST_PREFIX)) {
		throw new Error(`The CSRF cookie name must start with ${HOST_PREFIX} so other subdomains can not replace it. ` +
			'For local development over http you can set insecureCookie to true');
	}

	if (insecureCookie && cookieName.startsWith(HOST_PREFIX)) {
		throw new Error(`The CSRF cookie name can not start with ${HOST_PREFIX} when insecureCookie is true, ` +
			'because browsers refuse that prefix on cookies without the Secure flag');
	}

	testSigner(sign, verify);

	/**
	 * Returns the token's data, or undefined if the token has a bad signature or has expired
	 */
	function readToken (token: string): Record<string, unknown> | undefined {
		let payload: unknown;

		try {
			payload = verify(token);
		} catch {
			return undefined;
		}

		if (!payload || typeof payload !== 'object') {
			return undefined;
		}

		const exp = (payload as Record<string, unknown>).exp;

		if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) {
			return undefined;
		}

		return payload as Record<string, unknown>;
	}

	return function csrfMiddleware (method, url, body, headers, next) {
		if (typeof this.getCookies !== 'function' || typeof this.setCookie !== 'function') {
			throw new Error('The CSRF middleware requires the cookie middleware to be added to the road first');
		}

		const userId = options.getUserId ? options.getUserId(this) : undefined;

		this.csrfProtected = true;

		this.getCSRFToken = (data?) => {
			let token = this.getCookies()[cookieName];

			// If we get invalid cookie data or data for a diff user
			// (such as a logged out user logging in and now needing new data)
			// Reset it and give the user a new one
			if (token) {
				const payload = readToken(token);

				if (!payload || payload.userId !== userId) {
					token = undefined;
				}
			}

			if (!token) {
				token = sign({ ...data, userId, exp: Math.floor(Date.now() / 1000) + expiresIn });
				this.setCookie(cookieName, token, {
					path: '/',
					sameSite: 'strict',
					...(insecureCookie ? {} : { secure: true })
				});
			}

			return token;
		};

		this.getCSRFFormElement = (data?) => {
			const element = buildFormElement(this.getCSRFToken(data));

			if (typeof this.storeVal === 'function') {
				this.storeVal('csrfElement', element);
			}

			return element;
		};

		this.isValidCSRFToken = () => {
			const fail = (reason: string) => {
				console.error(`CSRF validation failed: ${reason}`, { path: url, method });
				return false;
			};

			if (!isSameOrigin(headers, trustedOrigins)) {
				return fail('request came from another origin');
			}

			const bodyToken: unknown = body && typeof body === 'object' ?
				(body as Record<string, unknown>)[CSRF_BODY_NAME] : undefined;

			if (Array.isArray(bodyToken)) {
				return fail('more than one CSRF token found in the request body');
			}

			if (typeof bodyToken !== 'string' || !bodyToken) {
				return fail('no CSRF token found in the request body');
			}

			const cookieToken = this.getCookies()[cookieName];

			if (!cookieToken) {
				return fail('missing cookie');
			}

			// The form must send back the exact token that is in the cookie. Checking the signature alone
			//		is not enough, because anyone can get a validly signed token of their own from the site
			if (bodyToken !== cookieToken) {
				return fail('body token does not match the cookie');
			}

			const payload = readToken(cookieToken);

			if (!payload) {
				return fail('token is expired or has a bad signature');
			}

			// we don't ensure there's a user ID here because we might use csrf on logged out pages
			if (payload.userId !== userId) {
				return fail('token belongs to a different user');
			}

			return true;
		};

		if ((method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') &&
			!this.isValidCSRFToken()) {
			return new Response(
				// eslint-disable-next-line max-len
				'You\'ve encountered an unexpected error. Please let us know you encountered this issue by contacting support.',
				403
			);
		}

		return next();
	};
}

/**
 * Creates the browser version of the CSRF middleware, for roads that render your routes in the browser.
 *
 * The browser must never have your signing secret, so this does not create or check tokens.
 * 	It reads the token that the server put in the CSRF cookie, so routes that call `getCSRFFormElement`
 * 	work the same in the browser as they do on the server. Requests that reach your server are
 * 	still checked there.
 *
 * @param {Document} pageDocument - The pages Document object
 * @param {string} [cookieName] - The name of the CSRF cookie. This must match the name used on the server
 * @returns {Middleware} The middleware function. This value should be passed to road.use(fn);
 */
export function buildClientMiddleware (
	pageDocument: Document, cookieName: string = CSRF_COOKIE_NAME
): Middleware<CSRFContext> {
	return function clientCSRFMiddleware (method, url, body, headers, next) {
		this.csrfProtected = true;

		this.getCSRFToken = () => {
			return cookie.parseCookie(pageDocument.cookie)[cookieName] ?? '';
		};

		this.getCSRFFormElement = () => {
			return buildFormElement(this.getCSRFToken());
		};

		// Requests on a browser road never leave the page, so there is nothing to check here
		this.isValidCSRFToken = () => {
			return true;
		};

		return next();
	};
}
