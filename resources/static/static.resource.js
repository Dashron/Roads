var Resource = require('../../components/resource').Resource;
var view_component = require('../../components/view');

module.exports = new Resource('static', {
	construct : function () {
		var renderers = require('./static.renderers');
		var key = null;

		for (key in renderers) {
			console.log('adding renderer: ' + key);
			view_component.addRenderer(key, renderers[key]);
		}
	},
	router : require('./static.router')
});