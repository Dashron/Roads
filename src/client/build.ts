/**
 * build.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */

import * as browserify from 'browserify';
import * as babelify from 'babelify';
import * as fs from 'fs';
// I don't like this, but it seems to be the only option with envify's current module declaration
import envify = require('envify/custom');

/**
 * @param  {boolean} [options.use_sourcemaps] Whether or not the build process should include source maps.
 * @param  {Object} [options.envify] An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 * @param  {Object} [options.babelify] An object containing parameters to pass to the babelify transform
 */
interface RoadsBuildOptions { 
	use_sourcemaps?: any; 
	ignore_missing?: any; 
	babelify?: any; 
	ignore?: any; 
	exclude?: any; 
	envify?: any; 
};

/**
 * Applys some defaults and useful standards to the babel options
 * 
 * @param {babelify.BabelifyOptions} babel_options - The options object that is passed to babel
 * @returns {babelify.BabelifyOptions} babel_options with defaults applied
 */
function fixBabelify (babel_options: babelify.BabelifyOptions): babelify.BabelifyOptions {
	if (!babel_options) {
		babel_options = {};
	}

	if (!Array.isArray(babel_options.presets)) {
		babel_options.presets = [];
	}

	babel_options.presets.push('@babel/preset-env');
	return babel_options;
}

/**
 * An array of files or node modules to ignore in browserify. Ignored modules are replaced with an
 * empty object {}.
 * 
 * @param {Array<string>} ignore_list - Array of file paths or node module names to ignore
 * @returns {Array<string>} ignore_list with defaults applied
 */
function fixIgnore(ignore_list?: Array<string>):  Array<string> {
	if (!ignore_list) {
		ignore_list = [];
	}

	return ignore_list;
}

/**
 * An array of files or node modules to exclude in browserify. Excluded modules will throw an exception
 * if they are required
 * 
 * @param {Array<string>} exclude_list - Array of file paths or node module names to exclude
 * @returns {Array<string>} exclude_list with defaults applied
 */
function fixExclude(exclude_list?: Array<string>): Array<string>{
	if (!exclude_list) {
		exclude_list = [];
	}

	exclude_list.push(__filename);
	return exclude_list;
}

/**
 * Applies defaults and cleanup to the options sent to the method exposed by this file
 * 
 * @param {object} options - The options passed into the function exposed by this file
 * @returns {object} options with defaults applied
 */
function fixOptions (options?: RoadsBuildOptions): RoadsBuildOptions {
	if (!options) {
		options = {};
	}

	options.use_sourcemaps = options.use_sourcemaps ? true : false;

	options.babelify = fixBabelify(options.babelify);
	options.ignore = fixIgnore(options.ignore);
	options.exclude = fixExclude(options.exclude);
	return options;
}

/**
 * Compiles the input_file node script to be used in the browser.
 * 
 * @param  {string} input_file  The source file that will be converted to use in the browser
 * @param  {string} output_file The output file that will be accessible by your browser
 * @param  {RoadsBuildOptions} [options] A set of options that can influence the build process. See all fields below
 * @todo tests
 */
export default function build (input_file: string, output_file: string, options: RoadsBuildOptions): void {
	console.log('starting to build ' + output_file + ' from source ' + input_file);
	options = fixOptions(options);

	let builder = browserify(input_file, {
		debug: options.use_sourcemaps,
		ignoreMissing: options.ignore_missing
	})
	.transform("babelify", options.babelify)
	.transform("brfs");

	builder.on('dep', function(dep: { file: string; }) {
		console.log('adding dependency ' + dep.file);
	});

	builder.ignore(options.ignore);
	builder.exclude(options.exclude);
	builder
		.transform(envify(options.envify))
		.bundle()
		.pipe(fs.createWriteStream(output_file));
};

