/**
 * buildApiRoad.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of a small JSON API built as its own road. server.ts makes it available two ways:
 *  - Over HTTP at /api, where other sites can call it. That's why it uses the CORS middleware
 *  - Directly from the web road through the reroute middleware, without any network request (see buildServerRoad.ts)
 */

import { Road, Response, CorsMiddleware, ParseBodyMiddleware, RouterMiddleware, RoadModule } from 'roads';

export interface Post {
	id: number,
	title: string,
	updatedAt: string
}

/**
 * The context that RerouteMiddleware adds to the web road. Calling `this.api(...)` from a web route
 * 	sends the request straight into this road and resolves with its response
 */
export interface ApiContext extends RoadModule.Context {
	api: (method: string, path: string, body?: string, headers?: RoadModule.IncomingHeaders) => Promise<Response>
}

// In the real world this would be a database
const posts: Post[] = [
	{ id: 1, title: 'Hello Roads', updatedAt: new Date('2026-01-01T00:00:00Z').toUTCString() },
	{ id: 2, title: 'Isomorphic routing', updatedAt: new Date('2026-02-01T00:00:00Z').toUTCString() }
];
let nextId = 3;

function json (data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), status, { 'content-type': 'application/json' });
}

/**
 * @param {string[]} validOrigins - The origins whose pages may call this API from the browser
 */
export default function buildApiRoad (validOrigins: string[]): Road {
	const road = new Road();

	// CORS must come before anything that can respond, so preflight (OPTIONS) requests are answered
	//		and every response gets the access-control headers.
	road.use(CorsMiddleware.build({
		validOrigins,
		// Methods and request headers other sites may use. Simple requests (GET, or a form-style POST)
		//		don't need to be listed. A POST with a JSON body is not simple, so the browser
		//		sends a preflight request first, and that request needs POST and content-type to be allowed here
		allowedMethods: ['GET', 'POST', 'DELETE'],
		allowedRequestHeaders: ['content-type'],
		// Response headers the other site's JavaScript is allowed to read
		allowedResponseHeaders: ['last-modified'],
		// How long, in seconds, the browser can reuse a preflight response
		cacheMaxAge: 600
	}));
	// Turns the JSON request body into an object
	road.use(ParseBodyMiddleware.middleware);

	const router = new RouterMiddleware.Router(road);

	router.addRoute('GET', '/posts', async function () {
		return json(posts);
	});

	// # only matches numbers, so /posts/abc falls through to the 404 below
	router.addRoute('GET', '/posts/#id', async function (method, url) {
		const post = posts.find((p) => p.id === url.args?.['id']);

		if (!post) {
			return json({ error: 'Post not found' }, 404);
		}

		return new Response(JSON.stringify(post), 200, {
			'content-type': 'application/json',
			'last-modified': post.updatedAt
		});
	});

	// ParseBodyMiddleware parsed the JSON, so the second type parameter describes the body
	router.addRoute<RoadModule.Context, { title?: unknown } | undefined>('POST', '/posts', async function (method, url, body) {
		if (typeof body?.title !== 'string' || !body.title) {
			return json({ error: 'Send a JSON body like {"title": "My post"}' }, 400);
		}

		const post: Post = { id: nextId++, title: body.title, updatedAt: new Date().toUTCString() };
		posts.push(post);

		return json(post, 201);
	});

	router.addRoute('DELETE', '/posts/#id', async function (method, url) {
		const index = posts.findIndex((p) => p.id === url.args?.['id']);

		if (index === -1) {
			return json({ error: 'Post not found' }, 404);
		}

		posts.splice(index, 1);
		return new Response('', 204);
	});

	// Anything the router didn't handle
	road.use(async function () {
		return json({ error: 'Not found' }, 404);
	});

	return road;
}
