/**
 * client.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of using roads router in the client. It's bundled into public/client.js by `npm run build`
 */

import { Request } from 'roads';
import buildClientRoad from './buildClientRoad.js';

const { pjax } = buildClientRoad(document, window);

// Start handling clicks on links and forms that have a data-roads-pjax attribute
pjax.register();
// The home link is outside of the container, so PJAX needs to be told about it
pjax.registerAdditionalElement(document.getElementById('home') as HTMLAnchorElement);

const port = Number(window.location.port);
// The Request class sends real HTTP requests. Its paths can't change the host it was created with
const sameOrigin = new Request(window.location.protocol === 'https:', window.location.hostname, port);
// localhost and 127.0.0.1 are different origins, so whichever one this page isn't on is cross origin
const otherOrigin = new Request(false, window.location.hostname === 'localhost' ? '127.0.0.1' : 'localhost', port);

/**
 * Handles the buttons on /client-requests. We listen on the document because PJAX
 * 	replaces the page content, which would remove listeners added to the buttons themselves
 */
document.addEventListener('click', (event) => {
	const button = event.target instanceof Element ? event.target.closest('[data-example-action]') : null;
	const output = document.getElementById('request-output');

	if (!(button instanceof HTMLElement) || !output) {
		return;
	}

	let request;

	if (button.dataset['exampleAction'] === 'fetch-json') {
		request = sameOrigin.request('GET', '/server-only-json');
	} else if (button.dataset['exampleAction'] === 'create-post') {
		// application/json isn't a "simple" content type, so the browser asks the API's CORS middleware
		//		for permission with an OPTIONS request before it sends this
		request = otherOrigin.request('POST', '/api/posts', JSON.stringify({ title: 'Made with CORS' }), {
			'content-type': 'application/json'
		});
	} else {
		return;
	}

	request
		.then((response) => {
			// The Request class always resolves with a string body, so JSON needs to be parsed
			const body: unknown = response.headers['content-type']?.includes('application/json') ?
				JSON.parse(response.body.toString()) : response.body;
			output.textContent = JSON.stringify({ status: response.status, body }, null, 2);
		})
		.catch((err: Error) => {
			// fetch rejects when CORS blocks the request
			output.textContent = `Request failed: ${err.message}`;
		});
});
