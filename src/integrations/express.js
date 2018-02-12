"use strict";
/**
 * Express.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file exposes a function that allows you to use roads within express.js
 */

/**
 * Express.js middleware to use a roads.js router.
 *
 * This middleware works best if the road provided is using the roads cookie middleware.
 * 
 * @param {Road} road - The Road object that contains all routing information for this integration.
 * @returns {function} A middleware function to use with Express's use method.
 * @todo tests
 */
module.exports = function (road) {
	// express middleware to translate express requests into roads requests, and roads responses into Express responses
	return function router (req, res, next) {
		// Execute the route
		return road.request(req.method, req.baseUrl, req.body, req.headers)
		.then((response) => {

			// Extract the cookies from the response object (getCookies is applied in the cookie middleware)
			if (response.getCookies) {
				let cookies = response.getCookies();

				// Pass all the cookies from the response object up to Express
				if (cookies) {
					// Kill the cookies set by the response object and rely on the Express cookie management
					delete response.headers['Set-Cookie'];
					for (let name in cookies) {
						if (cookies.hasOwnProperty(name)) {
							res.cookie(name, cookies[name].value, cookies[name].options);
						}
					}
				}
			}

			// Translate the Roads HTTP Status to Express
			response.status(response.status);

			// Translate the Roads Headers to Express
			for (let header in response.headers) {
				if (response.headers.hasOwnProperty(header)) {
					res.header(header, response.headers[header]);
				}
			}

			// Translate the Roads Body to Express
			if (response.body) {
				res.send(response.body);
			}
			
			next();
		})
		.err((err) => {
			console.log(err);
			res.status(500).send('Unknown server error');
		});
	};
};
