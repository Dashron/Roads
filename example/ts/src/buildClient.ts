/**
 * build.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 * If you want the script to watch the input file for changes provide the `--watch` flag.
 */

import * as browserify from 'browserify';
import * as fs from 'fs';

// Read this file
const inputFile = `${ __dirname }/client.js`;

// Write to this file
const outputFile = `${ __dirname }/../browser/client.brws.js`;

// Look for the watch flag
const watch = process.argv[2] === '--watch';

console.log(`starting to build ${ outputFile } from source ${ inputFile }`);

// Create the browserify builder
const builder = browserify(inputFile, watch ? { cache: {}, packageCache: {} } : undefined);

// Enable the watchify plugin if requested
if (watch) {
	builder.plugin('watchify');
}

// Log out the name of each file used. Useful for debugging
builder.on('dep', function(dep: { file: string; }) {
	console.log(`adding dependency ${ dep.file }`);
});

function bundle() {
	// Creates the bundle and writes it to the output file
	builder.bundle()
		.on('end', () => {
			console.log('build complete');
		})
		.on('error', console.error)
		.pipe(fs.createWriteStream(outputFile));
}

// This is how we get the watcher working properly
if (watch) {
	builder.on('update', bundle);
}

// Create the bundle
bundle();