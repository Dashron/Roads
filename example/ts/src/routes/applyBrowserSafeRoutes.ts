/**
 * applyBrowserSafeRoutes.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some browser safe routes to a roads server
 */

import { Response, RoadModule, RouterMiddleware, StoreValsMiddleware, CookieMiddleware, CSRFMiddleware } from 'roads';
import { SiteContext, TITLE_KEY } from '../shared.js';

interface ExampleRequestBody {
	message?: string
}

/**
  * These routes are added to the server road (buildServerRoad.ts) and the browser road (buildClientRoad.ts),
  * so they can't use anything that only exists on the server, like the file system or the CSRF secret.
  * In the browser, RoadsPJAX runs them when you click a link or submit a form with a data-roads-pjax attribute.
  *
  * @param {Router} router - The router that the routes will be added to
  */
export default function applyBrowserSafeRoutes(
	router: RouterMiddleware.Router<StoreValsMiddleware.StoreValsContext & SiteContext>
): void {
	router.addRoute('GET', '/', async function () {
		this.storeVal(TITLE_KEY, 'Root Resource');

		// In the real world the body of the response should be created from a template engine.
		return new Response(`<h1>Welcome to ${this.siteName}</h1>
		 <p>Links with <code>data-roads-pjax="link"</code> are rendered in the browser. Ctrl-click any of them
		 to load the page from the server instead. Check your console to see which one ran.</p>
		 <ul>
			<li><a href="/browser-safe" data-roads-pjax="link">Browser safe page</a>: cookies, CSRF and a PJAX form</li>
			<li><a href="/tags/roads?sort=newest" data-roads-pjax="link">/tags/$slug</a>: url variables and the query string</li>
			<li><a href="/client-requests" data-roads-pjax="link">Client requests</a>: the Request class and CORS</li>
			<li><a href="/server-only">Server only page</a>: sets cookies, and is not available in the browser road</li>
			<li><a href="/posts">Posts</a>: the reroute, method override and modified since middleware</li>
			<li><a href="/posts/abc">/posts/abc</a>: # variables only match numbers, so this is a 404</li>
			<li><a href="/browser-safe/">/browser-safe/</a>: the trailing slash middleware redirects this to /browser-safe</li>
			<li><a href="/postdata">GET /postdata</a>: only POST is routed here, so this is a 405 Method Not Allowed</li>
			<li><a href="/error">Error</a>: a route that throws, so Express handles the error</li>
		 </ul>`, 200, {
			// A header can have several values. The Express connector sends each one as its own header line
			duplicateHeaders: ['first', 'second']
		});
	});

	router.addRoute<CookieMiddleware.CookieContext & CSRFMiddleware.CSRFContext>('GET', '/browser-safe', async function () {
		this.storeVal(TITLE_KEY, 'Browser Safe Resource');
		console.log('Here are all cookies accessible to this code: ', this.getCookies());
		console.log('Cookies are not set until you access the server only route.');
		console.log('Notice that the http only cookies do not show in your browser\'s console.log');

		// getCSRFFormElement adds a hidden input with the CSRF token. Every form that isn't a GET needs one,
		//		or the server responds with a 403
		const html = `<p>Hello!
		 The page you are looking at can be rendered via server or client.
		 The landing page can too, so try going back <a href="/" data-roads-pjax="link">home</a>!</p>
		 <p>Cookies visible to this route: <code>${JSON.stringify(this.getCookies())}</code></p>
		 <form method="POST" action="/postdata" data-roads-pjax="form">
			${this.getCSRFFormElement()}
			Message: <input type="text" name="message">
			<input type="submit" value="Send message" data-roads-pjax="submit">
		 </form>`;

		return new Response(html);
	});

	// ParseBodyMiddleware turned the form body into an object, so the second type parameter describes it.
	//		When this runs in the browser the message only goes to the browser console
	router.addRoute<RoadModule.Context, ExampleRequestBody | undefined>('POST', '/postdata', async function (method, url, body) {
		console.log(`You sent the message: ${body?.message}`);
		// RoadsPJAX follows the redirect and renders /browser-safe
		return new Response('', 302, { location: '/browser-safe' });
	});

	// $ matches any value in that part of the path, and # only matches numbers. Matches are in url.args.
	//		The query string is parsed into url.query
	router.addRoute('GET', '/tags/$slug', async function (method, url) {
		const slug = String(url.args?.['slug']);
		const sort = url.query['sort'] ?? 'oldest';
		this.storeVal(TITLE_KEY, `Tag: ${slug}`);

		return new Response(`<p>url.args.slug is <code>${slug}</code>, url.query.sort is <code>${sort}</code></p>
		 <form method="GET" action="/tags/${slug}" data-roads-pjax="form">
			<select name="sort">
				<option value="oldest">oldest</option>
				<option value="newest">newest</option>
			</select>
			<input type="submit" value="Sort" data-roads-pjax="submit">
		 </form>
		 <p>Try <a href="/tags/typescript" data-roads-pjax="link">another tag</a>.</p>`);
	});

	// The button on this page is handled in client.ts
	router.addRoute('GET', '/client-requests', async function () {
		this.storeVal(TITLE_KEY, 'Client Requests');

		// /server-only-json isn't in the browser road, so the link doesn't have data-roads-pjax
		return new Response(`<p><a href="/server-only-json">/server-only-json</a> is a server only route that
		 responds with JSON instead of a page.</p>
		 <p>The API road is served at /api, and only allows requests from the origins listed in server.ts.
		 Open this page at <code>127.0.0.1</code> instead of <code>localhost</code> (or the other way around)
		 and this button uses the roads <code>Request</code> class to make a cross origin request.
		 Watch the network tab for the OPTIONS preflight request. This needs JavaScript.</p>
		 <p><button type="button" data-example-action="create-post">POST JSON to the API on the other host</button></p>
		 <pre id="request-output"></pre>`);
	});
}
