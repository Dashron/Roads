var project_module = require('../../base/project');
var Config = require('../../base/config');

var default_template = {
	project : Config.get('web.projects./'),
	controller : 'template',
	view : 'main'
};


module.exports = new project_module.Project({
	controllers : {
		{{SUBPROJECT_PLURAL}} : require(__dirname + '/controllers/{{SUBPROJECT_PLURAL}}')
	},
	models : {
		{{SUBPROJECT_PLURAL}} : require(__dirname + '/models/{{SUBPROJECT_PLURAL}}')
	},
	routes : {
		'{{SUBPROJECT_PLURAL}}' : {
			template : default_template,
			controller : '{{SUBPROJECT_PLURAL}}',
			view : 'many',
			routes : {
				'#{{SUBPROJECT_SINGULAR}}_id' : 'one'
			}
		}
	}
});