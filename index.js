"use strict";
/**
 * index.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes all of the core components of the Roads library
 */

module.exports.Promise = Promise;
module.exports.response_lib = require('./src/response.js');
/**
 * @todo this is a janky way of handling this. We should find a better option
 */
module.exports.Response = module.exports.response_lib.Response;
module.exports.Road = require('./src/road.js');
module.exports.PJAX = require('./src/client/pjax');
module.exports.Client = require('./src/client/request');
module.exports.HttpError = require('./src/httperror.js');

/**
 * 
 * @see ./src/client/build.js
 */
module.exports.build = function (input_file, output_file, options) {
	return require('./src/client/build.js')(input_file, output_file, options);
};

// Expose all integration helpers
module.exports.integrations = {
	/**
	 * Koa.js middleware to use a roads.js router.
	 *
	 * This middleware works best if the road provided is using the roads cookie middleware.
	 * 
	 * @see ./src/integrations/koa.js
	 */
	koa: function (road) {
		return require('./src/integrations/koa.js')(road)
	},

	/**
	 * Express.js middleware to use a roads.js router.
	 *
	 * This middleware works best if the road provided is using the roads cookie middleware.
	 * 
	 * @see ./src/integrations/express.js
	 */
	express: function (road) {
		return require('./src/integrations/express.js')(road);
	}
};

// Expose all middleware functions
module.exports.middleware = {
	applyToContext: require('./src/middleware/applyToContext.js'),
	/**
	 * Middleware to apply proper cors headers
	 * 
	 * @see ./src/middleware/cors.js
	 */
	cors: function (allow_origins, allow_headers) {
		return require('./src/middleware/cors.js')(allow_origins, allow_headers);
	},
	cookie: require('./src/middleware/cookie.js'),
	killSlash: require('./src/middleware/killSlash.js'),
	reroute: require('./src/middleware/reroute.js'),
	setTitle: require('./src/middleware/setTitle.js'),
	SimpleRouter: require('./src/middleware/simpleRouter.js'),
	parseBody: require('./src/middleware/parseBody.js')
};