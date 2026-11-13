/**
 * client.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of using roads router in the client. It's bundled into public/client.js by `npm run build`
 */

import buildClientRoad from './buildClientRoad.js';

const { pjax } = buildClientRoad(document, window);

// Start handling clicks on links and forms that have a data-roads-pjax attribute
pjax.register();
// The home link is outside of the container, so PJAX needs to be told about it
pjax.registerAdditionalElement(document.getElementById('home') as HTMLAnchorElement);

// localhost and 127.0.0.1 are different origins, so whichever one this page isn't on is cross origin
const otherOrigin = `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : 'localhost'}:${window.location.port}`;

/**
 * Handles the button on /client-requests. We listen on the document because PJAX
 * 	replaces the page content, which would remove listeners added to the button itself
 */
document.addEventListener('click', (event) => {
	const button = event.target instanceof Element ? event.target.closest('[data-example-action="create-post"]') : null;
	const output = document.getElementById('request-output');

	if (!button || !output) {
		return;
	}

	// application/json isn't a "simple" content type, so the browser asks the API's CORS middleware
	//		for permission with an OPTIONS request before it sends this
	fetch(`${otherOrigin}/api/posts`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ title: 'Made with CORS' })
	})
		.then(async (response) => {
			const body: unknown = response.headers.get('content-type')?.includes('application/json') ?
				await response.json() : await response.text();
			output.textContent = JSON.stringify({ status: response.status, body }, null, 2);
		})
		.catch((err: Error) => {
			// fetch rejects when CORS blocks the request
			output.textContent = `Request failed: ${err.message}`;
		});
});
