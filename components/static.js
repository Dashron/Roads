/*
 * gfw.js - static.js
 * Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */

"use strict";
var fs_module = require('fs');

var file_cache = {};

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
exports.bustFileCache = function (path) {
	if (typeof path === "string") {
		delete file_cache[path];
	} else {
		file_cache = {};
	}
};

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
		process.nextTick(function () {
			complete(file_cache[path]);
		});
		return;
	}

	var promise = new CachedFilePromise(path);
	promise.errorHandler(error);
	promise.endHandler(complete);
	promise.load();
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
	if (typeof file_cache[path] === "object") {
		return stream_cached(path, response, options);
	}

	stream_uncached(path, response, options);
};

/**
 * [streamCached description]
 * @param  {[type]} path     [description]
 * @param  {[type]} response [description]
 * @param  {[type]} options  [description]
 * @return {[type]}
 */
var stream_cached = exports.streamCached = function (path, response, options) {
	var request = options.request;
	var callback = options.callback;
	var cached = file_cache[path];

	// respect the If-Modified-Since header
	if(typeof request != "undefined" && !request.modifiedSince(cached.lastModified)) {
		response.notModified();
		return;
	} else {
		// If the item is not cached, it is not performed immediately, so we mirror that behavior just in case
		process.nextTick(function() {
			response.contentType(exports.contentType(path));
			response.lastModified(cached.lastModified);
			response.ok(cached.contents);
			if (typeof callback === "function") {
				callback();
			}
		});
		return;
	}
};

/**
 * [streamUncached description]
 * @param  {[type]} path     [description]
 * @param  {[type]} response [description]
 * @param  {[type]} options  [description]
 * @return {[type]}
 */
var stream_uncached = exports.streamUncached = function (path, response, options) {
	var request = options.request;
	var callback = options.callback;
	
	var promise = new CachedFilePromise(path);
	
	// When stat is complete, run the stream
	promise.endHandler(function () {
		if (typeof request != "undefined" && !request.modifiedSince(promise.lastModified)) {
			response.notModified();
		} else {
			promise.endHandler(function () {
				if (typeof callback == "function") {
					callback();
				}
			});

			promise.stream(response);
		}
	});

	promise.errorHandler(function (error) {
		throw error;
	});

	promise.runStat();
}

/**
 * [CachedFilePromise description]
 * @param {[type]} path [description]
 * todo: merge cachedfilepromise and filepromise
 */
var CachedFilePromise = function (path) {
	var _self = this;
	_self.buffer = '';
	// Assume the file is fresh data, and only override if stat is performed
	_self.lastModified = new Date();
	_self.path = path;
}

/**
 * [buffer description]
 * @type {[type]}
 */
CachedFilePromise.prototype.buffer = null;

/**
 * [lastModified description]
 * @type {[type]}
 */
CachedFilePromise.prototype.lastModified = null;

/**
 * [stream description]
 * @type {[type]}
 */
CachedFilePromise.prototype.stream = null;

/**
 * [path description]
 * @type {[type]}
 */
CachedFilePromise.prototype.path = null;

/**
 * [_errorHandler description]
 * @type {[type]}
 */
CachedFilePromise.prototype._error = function (error) {
	this.errorHandler = function (fn) {
		fn(error);
	};
};

/**
 * [_end description]
 * @type {[type]}
 */
CachedFilePromise.prototype._end = function (contents) {
	this.endHandler = function (fn) {
		fn(contents);
	};
};

/**
 * [stream description]
 * @param  {[type]} response [description]
 * @return {[type]}
 */
CachedFilePromise.prototype.stream = function (response) {
	var _self = this;

	_self.stream = fs_module.createReadStream(_self.path);
	_self.stream.setEncoding('utf8');

	_self.stream.on('data', function streamFile_data (data) {
		// stat may complete after the first data chunk. this holds off on sending headers until stat completes
		_self.buffer += data;

		// on our first write, we want to set status and headers
		if (_self.buffer.length === 0) {
			// Set the content type, apply the 
			response.contentType(exports.contentType(path));
			response.lastModified(_self.lastModified);
			response.ok();
		}
		//todo switch write to append?
		response.append(data);
	});

	_self.stream.on('end', function streamFile_end () {
		// cache the last modified header, and the file contents in local memory
		file_cache[_self.path] = {
			lastModified : _self.lastModified,
			contents : _self.buffer
		};
		response.end();
		_self._end();
	});

	_self.stream.on('error', function streamFile_error (error) {
		if (error.code === 'ENOENT') {
			response.notFound();
		} else {
			_self._error(error);
		}
	});

	_self.stream.on('close', function streamFile_close () {
		response.end();
		_self._end();
	});
};

CachedFilePromise.prototype.load = function() {
	var _self = this;
	fs_module.readFile(_self.path, 'utf8', function (err, contents) {
		if (err) {
			_self._error(err);
		} else {
			file_cache[_self.path] = {
				lastModified : _self.lastModified,
				contents : contents
			};
			_self._end(contents);
		}
	});
}
/**
 * [runStat description]
 * @return {[type]}
 */
CachedFilePromise.prototype.runStat = function () {
	var _self = this;

	fs_module.stat(_self.path, function (err, stats) {
		if (err) {
			_self._error(err);
		} else {
			_self.lastModified = stats.mtime;
			_self._end();
		}
	});
};

/**
 * [errorHandler description]
 * @param  {[type]} error_handler [description]
 * @return {[type]}
 */
CachedFilePromise.prototype.errorHandler = function (error_handler) {
	this._error = error_handler;
};

/**
 * [endHandler description]
 * @param  {[type]} end_handler [description]
 * @return {[type]}
 */
CachedFilePromise.prototype.endHandler = function (end_handler) {
	this._end = end_handler;
};