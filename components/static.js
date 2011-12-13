/*
 * gfw.js - static.js
 * Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */

"use strict";
var fs_module = require('fs');

var file_cache = {};

/**
 * Loads a file and caches the contents. Once the file is loaded, the file is
 * provided to the complete callback. If an error occurs, the error callback is
 * called with it
 * 
 * @param {String}
 *            path
 * @param {Function}
 *            complete
 * @param {Function}
 *            error
 */
exports.loadFile = function (path, complete, error) {
	if (typeof file_cache[path] === "string") {
		complete(file_cache[path]);
		return;
	}

	(new FilePromise(path)).onError(error).onComplete(function (contents) {
		file_cache[path] = contents;
		complete(contents);
	});
};

/**
 * Streams a file to an http response, and will cache the result.
 * 
 * @param {String}
 *            path
 * @param {HttpResponse}
 *            response
 */
exports.streamFile = function (path, response) {
	var content_type = exports.contentType(path);
	
	if (typeof file_cache[path] === "string") {
		response.writeHead(200, {
			'Content-Type' : content_type
		});
		response.end(file_cache[path]);
		return;
	}

	var buffer = '';
	var stream = fs_module.createReadStream(path);
	stream.setEncoding('utf8');

	stream.on('data', function streamFile_data (data) {
		if(buffer.length === 0) {
			response.writeHead(200, {
				'Content-Type' : content_type
			});
		}
		
		buffer += data;
		response.write(data);
	});

	stream.on('end', function streamFile_end () {
		file_cache[path] = buffer;
		response.end();
	});

	stream.on('error', function streamFile_error (error) {
		if(error.code === 'ENOENT') {
			response.writeHead(404, {
				'Content-Type' : 'text/plain'
			});
			response.end("File not found");
		} else {
			response.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			console.log(error);
		}
	});

	stream.on('close', function streamFile_close () {
		response.end();
	});
};

/**
 * 
 * @param {String}
 *            path
 * @return {String}
 */
exports.contentType = function (path) {
	if (path.indexOf('.js') >= 0) {
		return 'text/javascript';
	}

	if (path.indexOf('.css') >= 0) {
		return 'text/css';
	}

	return 'text/plain';
};

/**
 * Clears items from the cache. If the path parameter is provided, it clears a
 * single path If the path parameter is not provided, it clears the whole cache
 * 
 * @param {String}
 *            path
 */
exports.bustCache = function (path) {
	if (typeof path === "string") {
		delete file_cache[path];
	} else {
		file_cache = {};
	}
};

/**
 * @param {String}
 *            path
 */
var FilePromise = function FilePromise (path) {
	var _self = this;
	fs_module.readFile(path, 'utf8', function (err, contents) {
		if (err) {
			_self.error(err);
		} else {
			_self.complete(contents);
		}
	});
};

/**
 * 
 * @param {Error}
 *            error
 */
FilePromise.prototype.error = function (error) {
	this.onError = function (func) {
		func(error);
	};
};

/**
 * 
 * @param {String}
 *            contents
 */
FilePromise.prototype.complete = function (contents) {
	this.onComplete = function (func) {
		func(contents);
	};
};

/**
 * 
 * @param {Function}
 *            func
 * @return {FilePromise}
 */
FilePromise.prototype.onError = function (func) {
	this.error = func;
	return this;
};

/**
 * 
 * @param {Function}
 *            func
 * @return {FilePromise}
 */
FilePromise.prototype.onComplete = function (func) {
	this.complete = func;
	return this;
};