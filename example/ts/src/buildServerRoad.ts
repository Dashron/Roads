/**
 * buildServerRoad.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file builds the road that renders the website on the server. It doesn't start an HTTP server,
 * 	so you can also call `buildServerRoad(apiRoad).request(...)` directly, e.g. from tests.
 * 	The order of road.use calls matters, so each middleware explains why it's where it is.
 */

import {
	Road, CookieMiddleware, CSRFMiddleware, RouterMiddleware, MethodOverrideMiddleware,
	RerouteMiddleware, ApplyToContextMiddleware, StoreValsMiddleware, attachCommonMiddleware
} from 'roads';

import addLayout from './middleware/addLayout.js';
import notFound from './middleware/notFound.js';
import applyBrowserSafeRoutes from './routes/applyBrowserSafeRoutes.js';
import applyServerOnlyRoutes from './routes/applyServerOnlyRoutes.js';
import { sign, verify } from './csrfSigner.js';
import { SITE_NAME, SiteContext } from './shared.js';

/**
 * @param {Road} apiRoad - The API road from buildApiRoad.ts. Routes can call it with `this.api(...)`
 */
export default function buildServerRoad (apiRoad: Road): Road {
	const road = new Road();

	road.use(function (method, url, body, headers, next) {
		console.log(`${method} ${url}`);
		return next();
	});

	// This adds the four middleware that almost every road wants:
	//	- RemoveTrailingSlash: redirects /browser-safe/ to /browser-safe, so each page has one url
	//	- StoreVals: this.storeVal / this.getVal, used for the page title and the layout
	//	- ParseBody: turns JSON and form bodies into objects
	//	- ModifiedSince: this.shouldReturnNotModifiedResponse, used by GET /posts/#id
	attachCommonMiddleware(road);
	// Adds this.siteName to every request. Use this to give routes shared objects such as config or a db connection
	road.use(ApplyToContextMiddleware.build<SiteContext, 'siteName'>('siteName', SITE_NAME));
	// Adds this.api(method, path, body, headers), which sends a request straight into the API road
	road.use(RerouteMiddleware.build('api', apiRoad));
	road.use(CookieMiddleware.serverMiddleware);
	// This must come after the cookie middleware and the parse body middleware (which is part of the common middleware).
	//		Every POST, PUT, PATCH and DELETE request below this point needs a valid CSRF token
	road.use(CSRFMiddleware.build({
		sign,
		verify,
		// This example runs over plain http on localhost, so it can't use a Secure cookie.
		//		Never set this in the real world. Without it the cookie is Secure and locked to your exact host
		insecureCookie: true
	}));
	// HTML forms can only send GET and POST. This lets a POST form with a hidden `_method` field
	//		(or an x-http-method-override header) reach a DELETE, PUT or PATCH route.
	//		It must come after CSRF, so the token is checked against the real POST, and before the router
	road.use(MethodOverrideMiddleware.build());
	// The browser safe routes can also be rendered in the browser, which reads the token from the cookie (see buildClientRoad.ts).
	//		Creating the token on every page load makes sure the cookie is there before the browser needs it
	road.use<CSRFMiddleware.CSRFContext>(function (method, url, body, headers, next) {
		if (method === 'GET') {
			this.getCSRFToken();
		}

		return next();
	});
	// The layout wraps whatever the router returns, so it must come before the router
	road.use(addLayout);

	const router = new RouterMiddleware.Router<StoreValsMiddleware.StoreValsContext & SiteContext>(road);
	applyBrowserSafeRoutes(router);
	applyServerOnlyRoutes(router);
	// This runs when no route matched. It comes after the router, so its 404 still gets the layout
	road.use(notFound);

	return road;
}
