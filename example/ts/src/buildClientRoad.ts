/**
 * buildClientRoad.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file builds the road that renders pages in the browser. It runs the same browser safe routes
 * 	as the server, with browser versions of the cookie and CSRF middleware.
 * 	It takes the document and window as parameters instead of using the globals, so it can also run in tests
 */

import {
	Road, RoadsPJAX, ParseBodyMiddleware, RouterMiddleware, CookieMiddleware, CSRFMiddleware,
	ApplyToContextMiddleware, StoreValsMiddleware
} from 'roads';
import applyBrowserSafeRoutes from './routes/applyBrowserSafeRoutes.js';
import { SITE_NAME, SiteContext, TITLE_KEY } from './shared.js';

export default function buildClientRoad (pageDocument: Document, pageWindow: Window): { road: Road, pjax: RoadsPJAX } {
	const road = new Road();

	road.use(function (method, url, body, headers, next) {
		console.log(`browser road ${method} request to`, url);
		return next();
	});

	const container = pageDocument.getElementById('container');

	if (!container) {
		throw new Error('The page needs an element with the id "container" for RoadsPJAX to render into');
	}

	const pjax = new RoadsPJAX(road, container, pageWindow);
	// This also adds StoreValsMiddleware. After each request PJAX sets document.title to the TITLE_KEY value
	pjax.addTitleMiddleware(TITLE_KEY);
	road.use(ApplyToContextMiddleware.build<SiteContext, 'siteName'>('siteName', SITE_NAME));
	road.use(ParseBodyMiddleware.middleware);
	// The browser version reads and writes document.cookie. It can't see httpOnly cookies
	road.use(CookieMiddleware.buildClientMiddleware(pageDocument));
	// The real CSRF middleware only runs on the server, because the browser must never have the signing secret.
	//		This reads the token from the cookie the server set, so the shared routes can build their forms in the browser.
	//		The cookie name is only needed because buildServerRoad.ts uses insecureCookie. In the real world leave it out
	road.use(CSRFMiddleware.buildClientMiddleware(pageDocument, CSRFMiddleware.CSRF_INSECURE_COOKIE_NAME));

	const router = new RouterMiddleware.Router<StoreValsMiddleware.StoreValsContext & SiteContext>(road);
	applyBrowserSafeRoutes(router);

	// The browser road only has some of the routes. Throwing when none of them matched makes RoadsPJAX
	//		fall back to a normal page load, so the server renders the page instead
	road.use(function (method, url, body, headers, next) {
		return next().then((response) => {
			if (!response) {
				throw new Error(`The browser road has no route for ${method} ${url}`);
			}

			return response;
		});
	});

	return { road, pjax };
}
