/**
 * addLayout.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */

import { Response, RoadModule, StoreValsMiddleware } from 'roads';
import { escapeHtml, IGNORE_LAYOUT_KEY, SiteContext, TITLE_KEY } from '../shared.js';

/**
 * Example function to wrap an HTML body in the required surrounding HTML tags (commonly called a layout)
 *
 * @param {string} body - The custom HTML to be rendered within the layout
 * @param {string} title - The page title
 * @param {string} siteName - The site name, from ApplyToContextMiddleware
 */
function wrapLayout(body: string | Buffer, title: string, siteName: string) {
	// In the real world the layout should be created from a template engine, which escapes values for you.
	//		The script tag is outside of the container, because RoadsPJAX replaces everything inside the container
	return `<!DOCTYPE html>
<html>
<head><title>${escapeHtml(title)}</title></head>
<body>
	<nav>
		<strong>${siteName}</strong>
		<a id="home" data-roads-pjax="link" href="/">Home</a>
	</nav>
	<div id="container">${body}</div>
	<script src="/client.js"></script>
</body>
</html>`;
}

/**
 * Returns true if the response should be sent as is, without the layout
 *
 * @param {Response} response - The response from the rest of the request chain
 * @param {boolean} ignoreLayout - True if the route asked to skip the layout
 */
function skipLayout(response: Response, ignoreLayout: boolean): boolean {
	const contentType = response.headers['content-type'];

	return ignoreLayout ||
		// Redirects and 304 Not Modified responses must not have a body
		(response.status >= 300 && response.status < 400) ||
		// Only HTML gets the HTML layout. Responses without a content type are assumed to be HTML
		(typeof contentType === 'string' && !contentType.startsWith('text/html'));
}

/**
 * This middleware wraps the response in a standard HTML layout. It reads two values from StoreValsMiddleware
 * - TITLE_KEY - The title of the page
 * - IGNORE_LAYOUT_KEY - If true, the layout is skipped. Redirects, 304s and non-HTML responses always skip it
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
const addLayoutMiddleware: RoadModule.Middleware<StoreValsMiddleware.StoreValsContext & SiteContext> =
	function addLayoutMiddleware (method, url, body, headers, next) {
		return next()
			.then((response) => {
				if (!(response instanceof Response)) {
					response = new Response(response);
				}

				if (skipLayout(response, this.getVal(IGNORE_LAYOUT_KEY) === true)) {
					return response;
				}

				// RoadsPJAX sets document.title from the same value when it renders a page in the browser
				const pageTitle = this.getVal(TITLE_KEY);
				const title = typeof pageTitle === 'string' ? pageTitle : this.siteName;

				response.body = wrapLayout(response.body, title, this.siteName);
				return response;
			});
	};

export default addLayoutMiddleware;
