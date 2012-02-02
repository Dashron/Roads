var http_module = require('http');
var events_module = require('events');
var util_module = require('util');
var http_wrapper_component = require('./http_wrapper');
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

	_self.server = http_module.createServer();
	this.port = port || 8125;
	this.hostname = hostname || null;
};

util_module.inherits(Server, events_module.EventEmitter);

/**
 * [server description]
 * @type {Server}
 */
Server.prototype.server = null;

/**
 * [port description]
 * @type {int}
 */
Server.prototype.port = null;

/**
 * [hostname description]
 * @type {string}
 */
Server.prototype.hostname = null;

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

/**
 * [onRequest description]
 * @param  {Function} fn [description]
 * @return {[type]}
 */
Server.prototype.requestHandler = function (fn) {
	var _self = this;
	_self.server.on('request', function (request, response) {
		var cookie = new Cookie(request, response);

		var request = new http_wrapper_component.Request(request);
		var response = new http_wrapper_component.Response(response);
		response.cookie(cookie);

		fn(request, response);
	});
}
