/**
 * build.js
 * Copyright(c) 2020 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */
import * as browserify from 'browserify';
import * as babelify from 'babelify';
/**
 * @param  {boolean} [options.use_sourcemaps] Whether or not the build process should include source maps.
 * @param  {Object} [options.envify] An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 * @param  {Object} [options.babelify] An object containing parameters to pass to the babelify transform
 */
interface RoadsBuildOptions {
    browserifyOptions?: browserify.Options;
    babelifyOptions?: babelify.BabelifyOptions;
    ignore?: string | Array<string>;
    exclude?: string | Array<string>;
}
/**
 * Compiles the input_file node script to be used in the browser.
 *
 * @param  {string} input_file  The source file that will be converted to use in the browser
 * @param  {string} output_file The output file that will be accessible by your browser
 * @param  {RoadsBuildOptions} [options] A set of options that can influence the build process. See all fields below
 * @todo tests
 */
export default function build(input_file: string, output_file: string, options: RoadsBuildOptions): Promise<void>;
export {};
