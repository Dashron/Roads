"use strict";
/**
 * build.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file build the client side javascript for in browser rendering
 */

const browserify = require('browserify');
const fs = require('fs');

const watch = false;

const builder = browserify(__dirname + '/static/client.js', watch ? {cache: {}, packageCache: {}} : {})


if (watch) {
	builder.plugin('watchify');
}

builder.on('dep', function(dep) {
	console.log(`adding dependency ${  dep.file}`);
});

function bundle() {
	builder.bundle()
		.on('end', () => {
			console.log('build complete');
		})
		.on('error', (error) => {
			console.log('build error', error);
		})
		.pipe(fs.createWriteStream(__dirname + '/static/client.brws.js'));
}

if (watch) {
	builder.on('update', bundle);
}

bundle();
