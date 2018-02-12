"use strict";
/**
 * build.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */

const browserify = require('browserify');
const envify = require('envify/custom');
const fs = require('fs');

/*function fixExternal (external) {
	if (!external) {
		external = {};
	}

	return external;
}*/

/**
 * Applys some defaults and useful standards to the babel options
 * 
 * @param {object} babel_options - The options object that is passed to babel
 * @returns {object} babel_options with defaults applied
 */
function fixBabelify (babel_options) {
	if (!babel_options) {
		babel_options = {};
	}

	if (!Array.isArray(babel_options.presets)) {
		babel_options.presets = [];
	}

	babel_options.presets.push('es2017');
	return babel_options;
}

/**
 * An array of files or node modules to ignore in browserify. Ignored modules are replaced with an
 * empty object {}.
 * 
 * @param {Array} ignore_list - Array of file paths or node module names to ignore
 * @returns {Array} ignore_list with defaults applied
 */
function fixIgnore(ignore_list) {
	if (!ignore_list) {
		ignore_list = [];
	}

	return ignore_list;
}

/**
 * An array of files or node modules to exclude in browserify. Excluded modules will throw an exception
 * if they are required
 * 
 * @param {Array} exclude_list - Array of file paths or node module names to exclude
 * @returns {Array} exclude_list with defaults applied
 */
function fixExclude(exclude_list) {
	if (!exclude_list) {
		exclude_list = [];
	}

	exclude_list.push(__filename);
	exclude_list.push(__dirname + '/../../tests');
	exclude_list.push(__dirname + '/../integrations/koa.js');
	exclude_list.push(__dirname + '/../integrations/express.js');
	exclude_list.push(__dirname + '/../middleware/cors.js');
	return exclude_list;
}

/**
 * Applies defaults and cleanup to the options sent to the method exposed by this file
 * 
 * @param {object} options - The options passed into the function exposed by this file
 * @returns {object} options with defaults applied
 */
function fixOptions (options) {
	if (!options) {
		options = {};
	}

	options.use_sourcemaps = options.use_sourcemaps ? true : false;

	options.babelify = fixBabelify(options.babelify);
	// options.external = fixExternal(options.external);
	options.ignore = fixIgnore(options.ignore);
	options.exclude = fixExclude(options.exclude);
	return options;
}

/**
 * Compiles the input_file node script to be used in the browser.
 * 
 * @param  {String} input_file  The source file that will be converted to use in the browser
 * @param  {String} output_file The output file that will be accessible by your browser
 * @param  {Object} [options] A set of options that can influence the build process. See all fields below
 * @param  {boolean} [options.use_sourcemaps] Whether or not the build process should include source maps.
 * @param  {Object} [options.envify] An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 * @param  {Object} [options.babelify] An object containing parameters to pass to the babelify transform
 * @todo tests
 */
module.exports = function (input_file, output_file, options) {
	/**
	 * Externals has been commented out because the code didn't make any sense, and didn't match the docs. It will be returned
	 * oonce there is an appropriate, well understood, well documented purpose
	 * 
	 * let externals = {};
	 */

	options = fixOptions(options);

	let builder = browserify(input_file, {
		debug: options.use_sourcemaps,
		ignoreMissing: options.ignore_missing
	})
	.transform("babelify", options.babelify);

	/*for (let key in options.external) {
		if (options.external.hasOwnProperty(key)) {
			builder.external(key);
			externals[key] = options.external[key];
		}
	}*/

	builder.ignore(options.ignore);
	builder.exclude(options.exclude);

	builder
		.transform(envify(options.envify))
		.bundle()
		.pipe(fs.createWriteStream(output_file));

	/*for (let key in externals) {
		if (externals.hasOwnProperty(key)) {
			browserify(null, {	
				debug: options.use_sourcemaps
			})
			.transform("babelify", options.babelify)
			.require(key)
			.bundle()
			.pipe(fs.createWriteStream(externals[key].output_file));
		}
	}*/
};

