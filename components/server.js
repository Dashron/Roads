/*
* gfw.js - config.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

var http_module = require('http');
var url_module = require('url');
var events_module = require('events');
var util_module = require('util');
var request_component = require('./request_wrapper');
var response_component = require('./response_wrapper');
var Cookie = require('./cookie').Cookie;

/**
 * [Server description]
 * @param {int} port     [description]
 * @param {string} hostname [description]
 * @todo  emit log info?
 */
var Server = exports.Server = function Server (port, hostname) {
	var _self = this;

	events_module.EventEmitter.call(_self);

	_self.server = http_module.createServer(function (request, response) {
		var cookie = new Cookie(request, response);
		var url = url_module.parse(request.url, true);

		// @todo what other methods need to be supported here?
		if (request.method === "POST") {
			var buffer = [];
			var post_data = null;
			var key = null;

			request.on('data', function (data) {
				buffer.push(data);
			});

			request.on('end', function () {
				var post_data = exports.parsePostData(buffer.join(), _self.contentType());
				
				for (key in post_data) {
					url.query[key] = post_data[key];
				}

				_self.resource.request({
					method : request.method,
					uri : url.pathname,
					params : url.query,
					cookie : cookie,
					accept : request.headers.accept
				}, response);
			});
		} else {
			_self.resource.request({
				method : request.method,
				uri : url.pathname,
				params : url.query,
				cookie : cookie,
				accept : request.headers.accept
			}, response);
		}

		_self.emit('request', request, response);
	});

	this.port = port || 8125;
	this.hostname = hostname || null;
};

util_module.inherits(Server, events_module.EventEmitter);

Server.prototype.server = null;
Server.prototype.port = null;
Server.prototype.hostname = null;
Server.prototype.resource = null;

/**
 * [start description]
 * @return {undefined}
 */
Server.prototype.start = function () {
	var _self = this;
	_self.server.listen(_self.port, _self.hostname, function () {
		console.log('Server listening for ' + _self.hostname + " on port:" + _self.port);
	});
};

/**
 * Starts the server
 * @return {undefined}
 */
Server.prototype.stop = function () {
	this.server.close();
};
