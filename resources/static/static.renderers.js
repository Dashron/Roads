var fs_module = require('fs');
var Renderer = require('../../components/view').Renderer;
var util_module = require('util');

/**
 * This function allows you to build a renderer that responds to a certain content type
 * 	
 * @param  {string} content_type
 * @return {Renderer} 
 */
var buildFileRenderer = function (content_type) {
	var FileRenderer = function() {
		Renderer.call(this);
	}

	util_module.inherits(FileRenderer, Renderer);

	FileRenderer.prototype.render = function (template) {
		var _self = this;

		if (this.response instanceof http_module.ServerResponse) {
			this.response.setHeader('Content-Type', content_type)
			this.response.status_code = 200;
		}

		var stream = fs_module.createReadStream(template);
		stream.on('data', function (data) {
			_self.response.write(data);
		});

		stream.on('error', function (err) {
			_self._error(err);
		});

		stream.on('end', function () {
			_self.response.end();
		});
	}

	return FileRenderer;
}

module.exports = {
	'text/css' : buildFileRenderer('text/css'),
	'text/javascript' : buildFileRenderer('text/javascript')
};