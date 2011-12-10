"use strict";
var fs_module = require('fs');

var file_cache = {};

/**
 * 
 * @param {String} path
 * @param {Function} complete
 * @param {Function} error
 */
exports.loadFile = function (path, complete, error) {
	if(typeof file_cache[path] === "string") {
		complete(file_cache[path]);
	}
	
	(new FilePromise(path))
		.onError(error)
		.onComplete(function (contents) {
			file_cache[path] = contents;
			complete(contents);
		});
};

/**
 * 
 * @param file
 */
exports.bustCache = function (file) {
	if (typeof file === "string") {
		delete file_cache[file];
	} else {
		file_cache = {};
	}
};

/**
 * 
 */
var FilePromise = function FilePromise (path) {
	var _self = this;
	fs_module.readFile(path, 'utf8', function (err, contents) {
		if(err) {
			_self.error(err);
		} else {
			_self.complete(contents);
		}
	});
};

/**
 * 
 * @param error
 */
FilePromise.prototype.error = function (error) {
	this.onError = function (func) {
		func(error);
	};
};

/**
 * 
 * @param contents
 */
FilePromise.prototype.complete = function (contents) {
	this.onComplete = function (func) {
		func(contents);
	};
};

/**
 * 
 * @param func
 * @return {FilePromise}
 */
FilePromise.prototype.onError = function (func) {
	this.error = func;
	return this;
};

/**
 * 
 * @param func
 * @return {FilePromise}
 */
FilePromise.prototype.onComplete = function (func) {
	this.complete = func;
	return this;
};

/**
 * 
 */
/*var ReadStream = function ReadStream (path) {
	this.path = path;
	this.stream = fs_module.createReadStream(path);

	this.stream.on('error', function (err) {
		this.error(err);
	});

	this.stream.on('open', function () {
		this.open();
	});
};*/

/**
 * Holds the error handler If the error handler is called before the user sets
 * one, we overwrite the onError function to immediately call the provided
 * handler.
 * 
 * @param {Error}
 *            error
 */
/*ReadStream.prototype.error = function (error) {
	this.onError = function (func) {
		func(error);
	};
};*/

/**
 * Holds the open handler If the open handler is called before the user sets
 * one, we overwrite the onOpen function to immediately call the provided
 * handler
 */
/*ReadStream.prototype.open = function () {
	this.onOpen = function (func) {
		func();
	};
};*/

/**
 * Assigns an error handler
 */
/*ReadStream.prototype.onError = function (func) {
	this.error = func;
};*/

/**
 * Assigns an open handler
 */
/*ReadStream.prototype.onOpen = function (func) {
	this.open = func;
};*/