"use strict";

/**
* handlebars_renderer.js
* Copyright(c) 2012 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var http_module = require('http');
var util_module = require('util');
var fs_module = require('fs');
var handlebars = require('handlebars');
var Renderer = require('bifocals').Renderer;

handlebars.registerHelper('render', function (project, view) {
	var args = Array.prototype.slice.call(arguments);
	var options = args.pop();
	var data = null;
	project = args.shift();
	view = args.shift();

	// this allows you to add a bunch of key, value args after the project and view. The original data is lost, and we use the parameters instead
	// {{render project view key value key value key value}} (etc..)
	if (args.length > 0) {
		// lose the original data, it's probably not a valid context anyway
		data = {};

		for (var i = 0; i < args.length; i++) {
			data[args[i]] = args[++i];
		}
	} else {
		data = this;
	}

	var template = __dirname + '/../../projects/' + project + '/templates/' + view + '.html';

	//if (typeof compiled_views[template] == "undefined" || compiled_views[template] == null) {
		var buffer = fs_module.readFileSync(template);
		compiled_views[template] = handlebars.compile(buffer.toString());
	//}
	return compiled_views[template](data);
});

/**
 * Renders a view as html via the Mu2 module
 */
var HandlebarsRenderer = module.exports = function HandlebarsRenderer () {
	Renderer.call(this);
};

util_module.inherits(HandlebarsRenderer, Renderer);

/**
 * Cache the compiled views in a "path => function" mapping
 * 
 * @type {Object}
 */
var compiled_views = {};

/**
 * Requests the provided template to be rendered
 * 
 * @param  {string} template
 */
HandlebarsRenderer.prototype.render = function (template) {
	var _self = this;

	if (this.response instanceof http_module.ServerResponse) {
		this.response.setHeader('Content-Type', 'text/html');
		this.response.status_code = 200;
	}

	//if (typeof compiled_views[template] === "undefined" || compiled_views[template] === null) {
		var stream = fs_module.createReadStream(template + '.html');

		var buffer = '';
		stream.on('data', function (chunk) {
			buffer += chunk;
		});

		stream.on('end', function () {
			compiled_views[template] = handlebars.compile(buffer);
			_self.executeTemplate(template);
		});

		stream.on('error', function (err) {
			_self._error(err, template);
		});
	/*} else {
		process.nextTick(function () {
			_self.executeTemplate(template);
		})
	}*/
};

/**
 * 
 * @param  {[type]} template [description]
 * @return {[type]}          [description]
 */
HandlebarsRenderer.prototype.executeTemplate = function (template) {
	try {
		this.response.write(compiled_views[template](this.data));
	} catch (error) {
		this._error(error, template);
	}
	this._end();
	this.response.end();
};
