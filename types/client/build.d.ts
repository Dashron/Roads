/**
 * build.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */
import * as browserify from 'browserify';
import * as babelify from 'babelify';
import * as watchify from 'watchify';
/**
 * @param  {Object} [options.browserifyOptions] An object containing parameters to pass to browserify
 * @param  {Object} [options.babelifyOptions] An object containing parameters to pass to the babelify transform
 * @param  {Object} [options.watchifyOptions] An object containing parameters to pass to watchify
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 */
interface RoadsBuildOptions {
    browserifyOptions?: browserify.Options;
    babelifyOptions?: babelify.BabelifyOptions;
    watchifyOptions?: watchify.Options;
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
export default function build(input_file: string, output_file: string, options: RoadsBuildOptions, watch?: boolean): Promise<void>;
export {};
