/**
 * applyPrivateRoutes.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some private routes to a road server
 */

import * as fs from 'fs';
import { CookieContext } from 'roads/types/middleware/cookieMiddleware';
import { StoreValsContext } from 'roads/types/middleware/storeVals';
import { Response, Road } from 'roads';
const TITLE_KEY = 'page-title';

/**
  * Before calling this function you should create your roads object and bind a SimpleRouter to that road.
  * You then pass the road to this function to assign a collection of example routes that should only
  * be rendered on the server.
  *
  * @param {SimpleRouter} router - The router that the routes will be added to
  */
export default function applyPrivateRotues(road: Road<StoreValsContext>): void {
	road.addRoute<CookieContext & StoreValsContext>('GET', '/private', async function () {
		this.storeVal(TITLE_KEY, 'Private Resource');
		this.setCookie('private_cookie', 'foo', {
			httpOnly: true
		});

		this.setCookie('public_cookie', 'bar', {
			httpOnly: false
		});

		return new Response(
			`This is a private resource. It's available to the server, but is not build in the client!
			The landing page can be rendered via the client though, so try going back
			<a href="/" data-roads="link">home</a>!<br />`);
	});

	road.addRoute('GET', '/privateJSON', async function () {
		this.storeVal('ignoreLayout', true);
		return new Response(JSON.stringify({'private-success': true}));
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	road.addRoute('GET', 'client.js', async function (url, body, headers) {
		this.storeVal('ignoreLayout', true);
		// In the real world the body of the response should be created from a template engine.
		return new Response(fs.readFileSync(`${__dirname  }/../../../public/client.js`).toString('utf-8'), 200, {
			'Content-Type': 'application/javascript; charset=UTF-8'
		});
	});
}