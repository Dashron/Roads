var resource = require('../../../base/resource');

module.exports = new resource.Resource({
	controllers : {
		posts : __dirname + '/controllers/posts'
	},
	models : {
		post : __dirname + '/models/post'
	},
	routes : __dirname + '/routes',
});