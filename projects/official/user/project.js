var project = require('../../../base/project');
var Config = require('../../../base/config');

var default_template = {
	project : Config.get('web.projects./'),
	controller : 'template',
	view : 'main'
};

module.exports = new project.Project({
	controllers : {
		user : require(__dirname + '/controllers/user'),
	},
	models : {
		session : require(__dirname + '/models/session'),
		user : require(__dirname + '/models/user')
	},
	routes : {
		'users' : {
			template : default_template,
			controller : 'user',
			view : 'many',
			routes : {
				'#id' : 'one',
				'auth' : 'auth'
			}
		},
		'me' : {
			template : default_template,
			controller : 'user',
			view : 'one'
		}
	}
});