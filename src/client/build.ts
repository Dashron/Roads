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

/**
 * @param  {boolean} [options.use_sourcemaps] Whether or not the build process should include source maps.
 * @param  {Object} [options.envify] An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 * @param  {Object} [options.babelify] An object containing parameters to pass to the babelify transform
 */
interface RoadsBuildOptions { 
	browserifyOptions?: browserify.Options,
	babelifyOptions?: babelify.BabelifyOptions,
	ignore?: string | Array<string>,
	exclude?: string | Array<string> 
};

/**
 * Applys some defaults and useful standards to the babel options
 * 
 * @param {babelify.BabelifyOptions} babel_options - The options object that is passed to babel
 * @returns {babelify.BabelifyOptions} babel_options with defaults applied
 */
function fixBabelify (babel_options?: babelify.BabelifyOptions): babelify.BabelifyOptions {
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
 * Compiles the input_file node script to be used in the browser.
 * 
 * @param  {string} input_file  The source file that will be converted to use in the browser
 * @param  {string} output_file The output file that will be accessible by your browser
 * @param  {RoadsBuildOptions} [options] A set of options that can influence the build process. See all fields below
 * @todo tests
 */
export default function build (input_file: string, output_file: string, options: RoadsBuildOptions): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log('starting to build ' + output_file + ' from source ' + input_file);

		let builder = browserify(input_file, options.browserifyOptions)
		.transform("babelify", fixBabelify(options.babelifyOptions));

		builder.on('dep', function(dep: { file: string; }) {
			console.log('adding dependency ' + dep.file);
		});

		if (options.ignore) {
			// Ignore also takes an array, but the types file doesn't think so
			// @ts-ignore Argument of type 'string[]' is not assignable to parameter of type 'string'.ts(2345)
			builder.ignore(options.ignore);
		}
		
		if (options.exclude) {
			// Exclude also takes an array, but the types file doesn't think so
			// @ts-ignore Argument of type 'string | string[] | undefined' is not assignable to parameter of type 'string'. Type 'undefined' is not assignable to type 'string'.ts(2345)
			builder.exclude(options.exclude);
		}
		
		let stream = builder.bundle();
		stream.on('end', resolve);
		stream.on('error', reject);
		stream.pipe(fs.createWriteStream(output_file));
	});
};

