var project = require('../../../base/project');
var Config = require('../../../base/config');

var default_template = {
	project : Config.get('web.projects./'),
	controller : 'template',
	view : 'main'
};

module.exports = new project.Project({
	controllers : {
		users : require(__dirname + '/controllers/users'),
	},
	models : {
		sessions : require(__dirname + '/models/sessions'),
		users : require(__dirname + '/models/users')
	},
	routes : {
		'users' : {
			template : default_template,
			controller : 'users',
			view : 'many',
			routes : {
				'#user_id' : 'one'
			}
		},
		'me' : {
			template : default_template,
			controller : 'users',
			view : 'me'
		}
	}
});