"use strict";
/**
* server.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

// This file sucks. Todo: make this suck less

var mode = 'dev';
//var mode = 'prod';

var http_server = require('roads-httpserver');
var Resource = require('./base/resource');

var Config = require('./base/config');
var Models = require('roads-models');
require('./libs/roadsmodelpromise.js').mixin(Models.ModelRequest.prototype);

var bifocals_module = require('bifocals');
var file_renderer = require('./libs/renderers/file_renderer');
bifocals_module.addRenderer('text/css', file_renderer.get('text/css'));
bifocals_module.addRenderer('text/javascript', file_renderer.get('text/javascript'));
bifocals_module.addRenderer('text/html', require('./libs/renderers/handlebars_renderer'));

setUpConfig();

connectToDatabases().ready(function () {
	console.log('successfully connected to all databases');

	buildWebServer().start(function () {
		console.log('listening for ' + (Config.get('server.hostname') ? Config.get('server.hostname') : "127.0.0.1") + ':' + Config.get('server.port'));
	});
});

function setUpConfig() {
	Config.load('server', require('./config/' + mode + '/server.json'));
	Config.load('web', require('./config/' + mode + '/web.json'));
}

function connectToDatabases(onReady) {
	return Models.Connection.connect(Config.get('server.connections'))
		.error(function (err) {
			/*console.log(err);
			console.log(Config.get('server.connections'));
			console.log('create database roads;');
			console.log('create user roads;');
			console.log("grant all on roads.* to roads@'localhost';");
			throw new Error('An error has occured when connecting to the database');*/
			//TODO: can we put this into the models and config somehow?
            console.log(err);
            console.log(Config.get('server.connections'));
            console.log('create database lang;');
            console.log('use lang;');
            console.log('create user lang;');
            console.log("grant all on lang.* to lang@'localhost';");
            console.log("CREATE TABLE `language` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT, `name` varchar(128) NOT NULL, PRIMARY KEY (`id`));");
            console.log("CREATE TABLE `word_type` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT, `language_id` int(10) unsigned NOT NULL, `name` varchar(128) NOT NULL, PRIMARY KEY (`id`));");
            console.log("CREATE TABLE `word` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT, `language_id` int(10) unsigned NOT NULL, `word_type_id` int(10) unsigned NOT NULL, `name` varchar(128) NOT NULL, PRIMARY KEY (`id`));");
            throw new Error('An error has occured when connecting to the database');
		});
}

function assignRoute(route, resource, server) {
	console.log('assigning route ' + route);
	server.onRequest(route, function (request, view, next) {
		resource.route(request, view);
	});
}

function buildWebServer() {
	console.log('setting up web server');

	var server = new http_server.Server({
		hostname : Config.get('server.hostname'),
		port : Config.get('server.port')		
	});

	server.onRequest('*', function (request, response, next) {
		var view = new bifocals_module.Bifocals(response);
		view.default500Template = Resource.get(Config.get('web.base_resource')).dir + '/templates/' + Config.get('web.templates.500');

		view.error(view.statusError.bind(view));
		view.dir = __dirname + '/resources';

		//view.error(view.statusError.bind(view));
		console.log(request.method + ' ' + request.url.path);

		// maybe move this into server
		if (Config.get('web.cookie.domain')) {
			request.cookie.setDomain(Config.get('web.cookie.domain'));
		}

		// we don't want the url to ever end with a slash
		if (request.url.path !== '/' && request.url.path.charAt(request.url.path.length - 1) === '/') {
			return view.statusRedirect(request.url.path.slice(0, -1), 301);
		}

		// TODO: move to http server
		if (request.method !== "GET" && typeof request.POST === "object" && typeof request.POST._method === "string") {
			request.method = request.url.query._method;
			delete request.url._method;
		}
		
		next(request, view);
	});

	var resources = Config.get('web.resources');

	for (var key in resources) {
		assignRoute(key, Resource.get(resources[key]), server);
	}

	return server;
}