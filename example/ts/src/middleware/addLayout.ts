/**
 * addLayout.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */

import { Middleware } from 'roads/types/core/road';
import { Response } from 'roads';
const TITLE_KEY = 'page-title';
import { StoreValsContext } from 'roads/types/middleware/storeVals';

/**
  * Example function to wrap an HTML body in the required surrounding HTML tags (commonly called a layout)
  *
  * @param {string} body - The custom HTML to be rendered within the layout
  * @param {string} title - The page title
  * @param {boolean} ignore_layout - If true, the layout is not used, and we return the body as is
  */
function wrapLayout(body: string, vals: {
	[TITLE_KEY]?: string,
	ignoreLayout?: boolean
}) {

	if (vals.ignoreLayout) {
		return body;
	}

	return `<!DOCTYPE html>
<html>
<head><title>${vals[TITLE_KEY]}</title></head>
<body>
	<a id="home" data-roads-pjax="link" href="/">Home</a>
	<div id="container">${body}
		<script src="/client.brws.js"></script>
    </div>
</body>
</html>`;
}

/**
 * This middleware wraps the response in a standard HTML layout. It looks for three fields in the request context.
 * - _page_title - The title of the page
 * - ignore_layout - If true, this middleware will not apply the layout (useful for JSON responses)
 *
 * @param {string} method - HTTP request method
 * @param {string} url - HTTP request url
 * @param {string} body - HTTP request body
 * @param {object} headers - HTTP request headers
 * @param {function} next - When called, this function will execute the next step in the roads method chain
 */
const addLayoutMiddleware: Middleware<StoreValsContext> = function addLayoutMiddleware (method, url, body, headers, next) {
	return next()
		.then((response) => {
			if (!(response instanceof Response)) {
				response = new Response(response);
			}

			let layoutData = {};

			if (this.getAllVals) {
				layoutData = this.getAllVals();
			}

			response.body = wrapLayout(response.body, layoutData);
			return response;
		});
};

export default addLayoutMiddleware;