/**
 * addLayout.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts with the bundled LayoutMiddleware
 */

import { LayoutMiddleware, StoreValsMiddleware } from 'roads';
import { escapeHtml, IGNORE_LAYOUT_KEY, SiteContext, TITLE_KEY } from '../shared.js';

/**
 * Example function to wrap an HTML body in the required surrounding HTML tags (commonly called a layout)
 *
 * @param {string} body - The custom HTML to be rendered within the layout
 * @param {string} title - The page title
 * @param {string} siteName - The site name, from ApplyToContextMiddleware
 */
function wrapLayout(body: string, title: string, siteName: string) {
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
 * This middleware wraps the response in a standard HTML layout. It reads two values from StoreValsMiddleware
 * - TITLE_KEY - The title of the page
 * - IGNORE_LAYOUT_KEY - If true, the layout is skipped. LayoutMiddleware always skips redirects, 304s and
 * 	non-HTML responses
 */
const addLayoutMiddleware = LayoutMiddleware.build<StoreValsMiddleware.StoreValsContext & SiteContext>(
	function (body, context) {
		if (context.getVal(IGNORE_LAYOUT_KEY) === true) {
			return body;
		}

		// RoadsPJAX sets document.title from the same value when it renders a page in the browser
		const pageTitle = context.getVal(TITLE_KEY);
		const title = typeof pageTitle === 'string' ? pageTitle : context.siteName;

		return wrapLayout(body, title, context.siteName);
	});

export default addLayoutMiddleware;
