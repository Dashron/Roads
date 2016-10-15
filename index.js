"use strict";
/**
* index.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

module.exports.Promise = Promise;
module.exports.response_lib = require('./src/response.js');
module.exports.Response = module.exports.response_lib.Response;
module.exports.Road = require('./src/road.js');
module.exports.Server = require('./src/httpServer.js');
module.exports.PJAX = require('./src/client/pjax');

/**
 * Compiles the input_file node script to be used in the browser.
 * 
 * @param  {String} input_file  The source file that will be converted to use in the browser
 * @param  {String} output_file The output file that will be accessible by your browser
 * @param  {Object} options     A set of options that can influence the build process. See all fields below
 * @param  {Boolean} options.use_sourcemaps  Whether or not the build process should include source maps.
 * @param  {Array} options.external     An array of dependencies that should be included from exernal resources instead of built into the project
 * @param  {Object} options.envify     An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} options.exclude An array of files that should not be included in the build process.
 * @param  {Object} options.babelify An object containing parameters to pass to the babelify transform
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
	 * @param  Road road The Road object that contains all routing information for this integration.
	 * @return function A middleware function to use with Koa's use method.
	 */
	koa: function (road) {
		return require('./src/integrations/koa.js')(road);
	}
};

// Expose all middleware functions
module.exports.middleware = {
	applyToContext: require('./src/middleware/applyToContext.js'),
	/**
	 * Apply proper cors headers
	 * 
	 * @param  Array|String allow_origins Either * to allow all origins, or an explicit list of valid origins.
	 * @param  Array allow_headers (optional) A white list of headers that the client is allowed to send in their requests
	 * @return Function The middleware to bind to your road
	 */
	cors:  function (allow_origins, allow_headers) {
		return require('./src/middleware/cors.js')(allow_origins, allow_headers);
	},
	cookie: require('./src/middleware/cookie.js'),
	killSlash: require('./src/middleware/killSlash.js'),
	reroute: require('./src/middleware/reroute.js'),
	setTitle: require('./src/middleware/setTitle.js')
};

// Expose a useful http error class
module.exports.HttpError = require('./src/httperror.js');