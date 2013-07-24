var project_module = require('../../../base/project');

module.exports = new project_module.Project({
	controllers : {
		template : require(__dirname + '/controllers/template'),
		example : require(__dirname + '/controllers/example')
	},
	models : {

	},
	routes : {
		'/' : {
			controller : 'example',
			view : 'main'
		}
	}
});