var project_module = require('../../../base/project');
var Config = require('../../../base/config');

var default_template = {
	project : Config.get('web.projects./'),
	controller : 'template',
	view : 'main'
};

module.exports = new project_module.Project({
	controllers : {
		template : require(__dirname + '/controllers/template'),
		example : require(__dirname + '/controllers/example')
	},
	models : {

	},
	routes : {
		'/' : {
			template : default_template,
			controller : 'example',
			view : 'main'
		}
	}
});