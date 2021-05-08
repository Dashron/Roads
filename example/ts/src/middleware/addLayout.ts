/**
 * addLayout.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to apply HTML layouts via a middleware system
 */

import { Context, Middleware } from 'roads/types/core/road';
import { Response } from '../../../../types';

/**
  * Example function to wrap an HTML body in the required surrounding HTML tags (commonly called a layout)
  *
  * @param {string} body - The custom HTML to be rendered within the layout
  * @param {string} title - The page title
  * @param {boolean} ignore_layout - If true, the layout is not used, and we return the body as is
  */
function wrapLayout(body, title, ignore_layout) {
	if (ignore_layout) {
		return body;
	}

	return `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
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
const addLayoutMiddleware: Middleware<Context> = function addLayoutMiddleware (method, url, body, headers, next) {
	// eslint-disable-next-line @typescript-eslint/no-this-alias
	const _self = this;

	return next()
		.then((response) => {
			if (!(response instanceof Response)) {
				response = new Response(response);
			}

			response.body = wrapLayout(response.body, _self._page_title ? _self._page_title : '',
				_self.ignore_layout ? true : false);
			return response;
		});
};

export default addLayoutMiddleware;