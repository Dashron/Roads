var util_module = require('util');
var Renderer = require('../../components/view').Renderer;
var http_module = require('http');
var mu = require('mu2');

/**
 * Renders the view output as json
 */
var JsonRenderer = function() {
	Renderer.call(this);
};
util_module.inherits(JsonRenderer, Renderer);

/**
 * Requests the data to be rendered
 */
JsonRenderer.prototype.render = function () {
	if (this.response instanceof http_module.ServerResponse) {
		this.response.setHeader('Content-Type', 'application/json');
		this.response.status_code = 200;
	}

	this.response.write(JSON.stringify(this.data));
	this.response.end();
}

/**
 * Renders a view as html via the Mu2 module
 */
var HtmlRenderer = function() {
	Renderer.call(this);
};
util_module.inherits(HtmlRenderer, Renderer);

/**
 * Requests the provided template to be rendered
 * 
 * @param  {string} template
 */
HtmlRenderer.prototype.render = function (template) {
	var _self = this;

	if (this.response instanceof http_module.ServerResponse) {
		this.response.setHeader('Content-Type', 'text/html');
		this.response.status_code = 200;
	}

	var stream = mu.compileAndRender(template, this.data);
	stream.on('data', function (data) {
		_self.response.write(data);
	});

	stream.on('error', function (err) {
		_self._error(err);
	});

	stream.on('end', function () {
		_self._end();
		_self.response.end();
	});
};

module.exports = {
	'application/json' : JsonRenderer,
	'text/html' : HtmlRenderer
}