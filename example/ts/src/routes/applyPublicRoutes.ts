'use strict';
/**
 * applyPublicRoutes.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some public routes to a roads server
 */

import { SimpleRouter } from 'roads';
import { ParseBodyContext } from 'roads/types/middleware/parseBody';

interface ExampleRequestBody {
	message?: string
}

/**
  * Before calling this function you should create your roads object and bind a SimpleRouter to that road.
  * You then pass the road to this function to assign a collection of example routes that will be rendered
  * on both the client and the server
  *
  * @param {SimpleRouter} router - The router that the routes will be added to
  */
export default function applyPublicRotues(router: SimpleRouter): void {
	router.addRoute('GET', '/', async function () {
		// this.setTitle('Root Resource');

		// In the real world the body of the response should be created from a template engine.
		return new this.Response(`Hello!<br />
		 Try the <a href="/public" data-roads-pjax="link">public test link</a>.
		 It's available to the server and can be rendered from the client! Try clicking it for the client path,
		 or control clicking for a real request to the server.<br />
		 Try the <a href="/private">private test link</a>. Itt's available to the server, but is not build in the client!
		 Check your console for proof of the network request!`);
	});

	router.addRoute('GET', '/public', async function () {
		// this.setTitle('Public Resource');
		console.log('Here are all cookies accessible to this code: ', this.cookies);
		console.log('Cookies are not set until you access the private route.');
		console.log('Notice that the http only cookies do not show in your browser\'s console.log');

		const html = `Hello!<br />
		 The page you are looking at can be renderd via server or client.
		 The landing page can too, so try going back <a href="/" data-roads-pjax="link">home</a>!
		 <form method="POST" action="/postdata" data-roads-pjax="form">
			Message: <input type="text" name="message">
			<input type="submit" value="Send message" data-roads-pjax="submit">
		 </form>`;

		// todo: make a client request to /privateJSON and get { "private-success": true }

		return new this.Response(html);
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	router.addRoute('POST', '/postdata', async function (this: ParseBodyContext<ExampleRequestBody>, url, body, headers) {
		console.log(`You sent the message:${this.body.message}`);
		this.ignore_layout = true;
		return new this.Response('', 302, { location: '/public' });
	});
}