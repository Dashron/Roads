var project = require('../../../base/project');

module.exports = new project.Project({
	controllers : {
		posts : require(__dirname + '/controllers/posts')
	},
	models : {
		post : require(__dirname + '/models/post')
	},
	routes : {
		'posts' : {
			controller : 'posts',
			view : 'many',
			routes : {
				'#id' : 'one'
			}
		}
	}
});