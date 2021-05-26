/**
 * applyPrivateRoutes.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some private routes to a road server
 */

import * as fs from 'fs';
import { CookieContext } from 'roads/types/middleware/cookieMiddleware';
import { StoreValsContext } from 'roads/types/middleware/storeVals';
import { SimpleRouterMiddleware, StoreValsMiddleware } from 'roads';
const { TITLE_KEY } = StoreValsMiddleware;

/**
  * Before calling this function you should create your roads object and bind a SimpleRouter to that road.
  * You then pass the road to this function to assign a collection of example routes that should only
  * be rendered on the server.
  *
  * @param {SimpleRouter} router - The router that the routes will be added to
  */
export default function applyPrivateRotues(router: SimpleRouterMiddleware.SimpleRouter): void {
	router.addRoute('GET', '/private', async function (this: CookieContext & StoreValsContext) {
		this.storeVal(TITLE_KEY, 'Private Resource');
		this.setCookie('private_cookie', 'foo', {
			httpOnly: true
		});

		this.setCookie('public_cookie', 'bar', {
			httpOnly: false
		});

		return new this.Response(
			`This is a private resource. It's available to the server, but is not build in the client!
			The landing page can be rendered via the client though, so try going back
			<a href="/" data-roads="link">home</a>!<br />`);
	});

	router.addRoute('GET', '/privateJSON', async function (this: StoreValsContext, ) {
		this.storeVal('ignoreLayout', true);
		return new this.Response(JSON.stringify({'private-success': true}));
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	router.addRoute('GET', 'client.brws.js', async function (this: StoreValsContext, url, body, headers) {
		this.storeVal('ignoreLayout', true);
		// In the real world the body of the response should be created from a template engine.
		return new this.Response(fs.readFileSync(`${__dirname  }/../../browser/client.brws.js`).toString('utf-8'), 200, {
			'Content-Type': 'application/javascript; charset=UTF-8'
		});
	});
}