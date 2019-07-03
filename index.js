"use strict";
/**
 * index.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes all of the core components of the Roads library
 */

module.exports.Promise = Promise;
module.exports.Response = require('./src/response.js').Response;
module.exports.Road = require('./src/road.js');
module.exports.PJAX = require('./src/client/pjax');
module.exports.Client = require('./src/client/request');

/**
 * 
 * @see ./src/client/build.js
 */
module.exports.build = function (input_file, output_file, options) {
	return require('./src/client/build.js')(input_file, output_file, options);
};

// Expose all middleware functions
module.exports.middleware = {
	applyToContext: require('./src/middleware/applyToContext.js'),
	// this is done to reduce browserify errors. we don't need to call this on page load for broserify
	cors: (options) => {
		return require('./src/middleware/cors.js')(options);
	},
	cookie: require('./src/middleware/cookie.js'),
	killSlash: require('./src/middleware/killSlash.js'),
	reroute: require('./src/middleware/reroute.js'),
	setTitle: require('./src/middleware/setTitle.js'),
	SimpleRouter: require('./src/middleware/simpleRouter.js'),
	parseBody: require('./src/middleware/parseBody.js'),
	emptyTo404: require('./src/middleware/emptyTo404.js')
};