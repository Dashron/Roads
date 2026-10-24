/**
 * applyServerOnlyRoutes.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some server only routes to a road server
 */

import * as fs from 'fs';
import {
	CookieMiddleware, CSRFMiddleware, ModifiedSinceMiddleware, StoreValsMiddleware, RouterMiddleware, Response
} from 'roads';
import { ApiContext, Post } from '../api/buildApiRoad.js';
import { IGNORE_LAYOUT_KEY, SiteContext, TITLE_KEY } from '../shared.js';

const __dirname = import.meta.dirname;

type RouterContext = StoreValsMiddleware.StoreValsContext & SiteContext;

/**
  * These routes are only added to the server road (buildServerRoad.ts), so they can use server only
  * code like the file system. RoadsPJAX can't render them in the browser, so links to them must not have a
  * data-roads-pjax attribute.
  *
  * @param {Router} router - The router that the routes will be added to
  */
export default function applyServerOnlyRoutes(router: RouterMiddleware.Router<RouterContext>): void {
	router.addRoute<CookieMiddleware.CookieContext>('GET', '/server-only', async function () {
		this.storeVal(TITLE_KEY, 'Server Only Resource');
		this.setCookie('http_only_cookie', 'foo', {
			httpOnly: true
		});

		this.setCookie('browser_readable_cookie', 'bar', {
			httpOnly: false
		});

		return new Response(
			`This is a server only resource. It's available to the server, but is not built in the client!
			It just set two cookies. Visit the <a href="/browser-safe" data-roads-pjax="link">browser safe page</a>
			and only the one without httpOnly shows up in the browser.<br />`);
	});

	// addLayout skips any response that isn't text/html, so JSON doesn't get wrapped in the layout
	router.addRoute('GET', '/server-only-json', async function () {
		return new Response(JSON.stringify({'server-only-success': true}), 200, {
			'content-type': 'application/json'
		});
	});

	router.addRoute('GET', '/client.js', async function () {
		// This response has a content type, so addLayout would skip it anyway. IGNORE_LAYOUT_KEY is how
		//		a route skips the layout for any other response
		this.storeVal(IGNORE_LAYOUT_KEY, true);
		return new Response(fs.readFileSync(`${__dirname}/../../../public/client.js`).toString('utf-8'), 200, {
			'content-type': 'application/javascript; charset=UTF-8'
		});
	});

	// this.api comes from RerouteMiddleware. It sends the request to the API road without a network request,
	//		so the website and the API can share one set of routes
	router.addRoute<ApiContext & CSRFMiddleware.CSRFContext>('GET', '/posts', async function () {
		this.storeVal(TITLE_KEY, 'Posts');
		const posts = JSON.parse((await this.api('GET', '/posts')).body.toString()) as Post[];

		// HTML forms can only send GET or POST. The hidden _method field makes MethodOverrideMiddleware
		//		send this POST to the DELETE route instead
		const list = posts.map((post) => `<li>
			<a href="/posts/${post.id}">${post.title}</a>
			<form method="POST" action="/posts/${post.id}" style="display: inline">
				${this.getCSRFFormElement()}
				<input type="hidden" name="_method" value="DELETE">
				<input type="submit" value="Delete">
			</form>
		</li>`).join('');

		return new Response(`<ul>${list}</ul>
		 <form method="POST" action="/posts">
			${this.getCSRFFormElement()}
			Title: <input type="text" name="title">
			<input type="submit" value="Create post">
		 </form>`);
	});

	router.addRoute<ApiContext, { title?: string } | undefined>('POST', '/posts', async function (method, url, body) {
		const response = await this.api('POST', '/posts', JSON.stringify({ title: body?.title }), {
			'content-type': 'application/json'
		});

		if (response.status !== 201) {
			return new Response(`Could not create the post: ${response.body.toString()}`, response.status);
		}

		return new Response('', 303, { location: '/posts' });
	});

	// A route can be an array of functions. They run in order like middleware, and each one calls next()
	//		to continue to the next function. This is useful for steps that many routes share, like loading data
	router.addRoute<ApiContext & ModifiedSinceMiddleware.ModifiedSinceContext>('GET', '/posts/#id', [
		async function (method, url, body, headers, next) {
			const response = await this.api('GET', `/posts/${url.args?.['id']}`);

			if (response.status !== 200) {
				return new Response('Post not found', 404);
			}

			this.storeVal('post', JSON.parse(response.body.toString()));
			// next() can resolve with a string, but routes must resolve with a Response
			const result = await next();
			return result instanceof Response ? result : new Response(result);
		},
		async function () {
			const post = this.getVal('post') as Post;

			// ModifiedSinceMiddleware compares this date to the request's if-modified-since header. If the
			//		browser already has this version, send an empty 304 response so it uses its cached copy.
			//		Reload this page and check the network tab to see the 304
			if (this.shouldReturnNotModifiedResponse(post.updatedAt)) {
				return this.buildNotModifiedResponse();
			}

			this.storeVal(TITLE_KEY, post.title);
			// The middleware adds the last-modified header to this response
			return new Response(`<h1>${post.title}</h1>
			 <p>Last updated ${post.updatedAt}</p>
			 <a href="/posts">Back to all posts</a>`, 200, {
				// Without this the browser may reuse the page without asking the server, so you wouldn't see the 304
				'cache-control': 'no-cache'
			});
		}
	]);

	router.addRoute<ApiContext>('DELETE', '/posts/#id', async function (method, url) {
		await this.api('DELETE', `/posts/${url.args?.['id']}`);
		return new Response('', 303, { location: '/posts' });
	});

	// Errors thrown by a route reject the promise from road.request. The Express connector passes them to
	//		Express, so Express's error handling (or something like Sentry) deals with them
	router.addRoute('GET', '/error', async function () {
		throw new Error('This is an example error');
	});
}
