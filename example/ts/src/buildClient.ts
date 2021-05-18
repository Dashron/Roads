/**
 * build.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file makes it easier to write browserify scripts to build roads to work in the browser
 */

import * as browserify from 'browserify';
import * as fs from 'fs';

const inputFile = `${ __dirname }/client.js`;
const outputFile = `${ __dirname }/../browser/client.brws.js`;

const watch = process.argv[2] === '--watch';

console.log(`starting to build ${ outputFile } from source ${ inputFile }`);

const builder = browserify(inputFile, watch ? { cache: {}, packageCache: {} } : undefined);

if (watch) {
	builder.plugin('watchify');
}

builder.on('dep', function(dep: { file: string; }) {
	console.log(`adding dependency ${ dep.file }`);
});

function bundle() {
	builder.bundle()
		.on('end', () => {
			console.log('build complete');
		})
		.on('error', console.error)
		.pipe(fs.createWriteStream(outputFile));
}

if (watch) {
	builder.on('update', bundle);
}

bundle();