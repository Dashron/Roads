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
 * @param {Response}
 *            response
 * @todo add etag support
 * @todo investigate speed benefits from allowing file read and stat to happen at the same time
 */
exports.streamFile = function (path, response, options) {
	var request = options.request;
	var callback = options.callback;
	
	var content_type = exports.contentType(path);

	if (typeof file_cache[path] === "string") {
		var cached = file_cache[path];

		// respect the If-Modified-Since header
		if(typeof request != "undefined" && !request.modifiedSince(cached.lastModified)) {
			response.notModified();
			return;
		} else {
			// If the item is not cached, it is not performed immediately, so we mirror that behavior just in case
			process.nextTick(function() {
				response.contentType(content_type);
				response.lastModified(cached.lastModified);
				response.ok(cached.contents);
				if (typeof callback === "function") {
					callback();
				}
			});
			return;
		}
	}

	var buffer = '';
	// Once we have the stat, we can operate as usual on the data being read in
	fs_module.stat(path, function (err, stats) {
		// respect the If-Modified-Since header
		if (typeof request != "undefined" &&  !request.modifiedSince(stats.mtime)) {
			response.notModified();
			return;
		} else {
			var stream = fs_module.createReadStream(path);
			stream.setEncoding('utf8');
			stream.on('data', function streamFile_data (data) {
				// on our first write, we want to set status and headers
				if (buffer.length === 0) {
					response.contentType(content_type);

					if (!err) {
						// set the last modified header
						response.lastModified(stats.mtime);
					} else {
						throw err;
					}

					response.ok();
				}

				buffer += data;
				response.write(data);
			});

			stream.on('end', function streamFile_end () {
				// cache the last modified header, and the file contents in local memory
				file_cache[path] = {
					lastModified : stats.mtime,
					contents : buffer
				};
				
				response.end();
				if (typeof callback === "function") {
					callback();
				}
			});

			stream.on('error', function streamFile_error (error) {
				if (error.code === 'ENOENT') {
					response.notFound();
				} else {
					response.error(error);
				}
				if (typeof callback === "function") {
					callback();
				}
			});

			stream.on('close', function streamFile_close () {
				response.end();
				if (typeof callback === "function") {
					callback();
				}
			});
		}
	});
};

/**
 * 
 * @param {String}
 *            path
 * @return {String}
 */
exports.contentType = function (path) {
	if (path.match(/\.js$/)) {
		return 'text/javascript';
	}

	if (path.match(/\.css$/)) {
		return 'text/css';
	}

	if (path.match(/\.html$/)) {
		return 'text/html';
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