var project = require('../../../base/project');
var Config = require('../../../base/config');

var default_template = {
	project : Config.get('web.projects./'),
	controller : 'template',
	view : 'main'
};

module.exports = new project.Project({
	controllers : {
		posts : require(__dirname + '/controllers/posts')
	},
	models : {
		posts : require(__dirname + '/models/posts')
	},
	routes : {
		'posts' : {
			template : default_template,
			controller : 'posts',
			view : 'many',
			routes : {
				'#id' : 'one'
			}
		}
	}
});