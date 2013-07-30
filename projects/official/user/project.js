var project = require('../../../base/project');

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
			controller : 'user',
			view : 'many',
			routes : {
				'#id' : 'one',
				'auth' : 'auth'
			}
		},
		'me' : {
			controller : 'user',
			view : 'one'
		}
	}
});