/**
 * build.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */

import * as browserify from 'browserify';
import * as babelify from 'babelify';
import * as fs from 'fs';
import * as watchify from 'watchify';

/**
 * @param  {Object} [options.browserifyOptions] An object containing parameters to pass to browserify
 * @param  {Object} [options.babelifyOptions] An object containing parameters to pass to the babelify transform
 * @param  {Object} [options.watchifyOptions] An object containing parameters to pass to watchify
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 */
interface RoadsBuildOptions {
	browserifyOptions?: browserify.Options,
	babelifyOptions?: babelify.BabelifyOptions,
	watchifyOptions?: watchify.Options,
	ignore?: string | Array<string>,
	exclude?: string | Array<string>
}

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
export default function build (
	input_file: string, output_file: string, options: RoadsBuildOptions, watch = false
): Promise<void> {

	return new Promise((resolve, reject) => {
		console.log(`starting to build ${  output_file  } from source ${  input_file}`);

		if (watch) {
			if (!options.browserifyOptions) {
				options.browserifyOptions = {};
			}

			if (!options.browserifyOptions.cache) {
				options.browserifyOptions.cache = {};
			}

			if (!options.browserifyOptions.packageCache) {
				options.browserifyOptions.packageCache = {};
			}
		}

		const builder = browserify(input_file, options.browserifyOptions)
			.transform('babelify', fixBabelify(options.babelifyOptions));

		if (watch) {
			builder.plugin('watchify', options.watchifyOptions);
		}

		builder.on('dep', function(dep: { file: string; }) {
			console.log(`adding dependency ${  dep.file}`);
		});

		if (options.ignore) {
			// Ignore also takes an array, but the types file doesn't think so
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore Argument of type 'string[]' is not assignable to parameter of type 'string'.ts(2345)
			builder.ignore(options.ignore);
		}

		if (options.exclude) {
			// Exclude also takes an array, but the types file doesn't think so
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore Argument of type 'string | string[] | undefined' is not assignable to parameter
			//		of type 'string'. Type 'undefined' is not assignable to type 'string'.ts(2345)
			builder.exclude(options.exclude);
		}

		function bundle() {
			builder.bundle()
				.on('end', resolve)
				.on('error', reject)
				.pipe(fs.createWriteStream(output_file));
		}

		if (watch) {
			builder.on('update', bundle);
		}

		bundle();


	});
}