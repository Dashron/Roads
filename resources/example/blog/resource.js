var resource = require('../../../base/resource');

module.exports = new resource.Resource({
	controllers : {
		blog : __dirname + '/controllers/blog'
	},
	models : {
		post : __dirname + '/models/post'
	},
	routes : __dirname + '/routes',
});