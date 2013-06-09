var resource = require('../../../base/resource');

module.exports = new resource.Resource({
	controllers : {
		template : __dirname + '/controllers/template',
		example : __dirname + '/controllers/example'
	},
	models : {

	},
	routes : __dirname + '/routes',
});