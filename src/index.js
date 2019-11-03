"use strict";
/**
 * index.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * Exposes all of the core components of the Roads library
 */

module.exports.Promise = Promise;
module.exports.Response = require('./response.js').Response;
module.exports.Road = require('./road.js');
module.exports.PJAX = require('./client/pjax');
module.exports.Client = require('./client/request');

/**
 * 
 * @see ./src/client/build.js
 */
module.exports.build = function (input_file, output_file, options) {
	return require('./client/build.js')(input_file, output_file, options);
};

// Expose all middleware functions
module.exports.middleware = {
	applyToContext: require('./middleware/applyToContext.js'),
	// this is done to reduce browserify errors. we don't need to call this on page load for broserify
	cors: (options) => {
		return require('./middleware/cors.js')(options);
	},
	cookie: require('./middleware/cookie.js'),
	killSlash: require('./middleware/killSlash.js'),
	reroute: require('./middleware/reroute.js'),
	setTitle: require('./middleware/setTitle.js'),
	SimpleRouter: require('./middleware/simpleRouter.js'),
	parseBody: require('./middleware/parseBody.js')
};