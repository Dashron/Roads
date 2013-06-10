var resource = require('../../../base/resource');

module.exports = new resource.Resource({
	controllers : {
		user : __dirname + '/controllers/user',
	},
	models : {
		session : __dirname + '/models/session',
		user : __dirname + '/models/user'
	},
	routes : __dirname + '/routes',
});