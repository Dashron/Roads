/**
 * server.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file starts up the HTTP roads server
 */

import { Road, Response, CookieMiddleware, CSRFMiddleware, RouterMiddleware, attachCommonMiddleware } from 'roads';

import express from 'express';
import addLayout from './middleware/addLayout.js';
import applyBrowserSafeRoutes from './routes/applyBrowserSafeRoutes.js';
import applyServerOnlyRoutes from './routes/applyServerOnlyRoutes.js';
import emptyTo404 from './middleware/emptyTo404.js';
import { expressConnector } from './middleware/expressConnector.js';
import { sign, verify } from './csrfSigner.js';

const road = new Road();

road.use(function (method, url, body, headers, next) {
	console.log(`${method} ${url}`);
	return next();
});

attachCommonMiddleware(road);
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
// The browser safe routes can also be rendered in the browser, which reads the token from the cookie (see client.ts).
//		Creating the token on every page load makes sure the cookie is there before the browser needs it
road.use<CSRFMiddleware.CSRFContext>(function (method, url, body, headers, next) {
	if (method === 'GET') {
		this.getCSRFToken();
	}

	return next();
});
road.use(addLayout);

const router = new RouterMiddleware.Router(road);
applyBrowserSafeRoutes(router);
applyServerOnlyRoutes(router);
road.use(emptyTo404);

const app = express();

app.set('etag', false);
// Roads expects the raw body as a string, and ParseBodyMiddleware handles JSON and forms
app.use(express.text({ type: '*/*' }));
app.use(expressConnector(road));

const host = 'localhost';
const port = 8081;

app.listen(port, host, function () {
	console.log(`server has started at http://${host}:${port}`);
});