var Resource = require('../../components/resource').Resource;

module.exports = new Resource('user', {
	router : require('./user.router'),
	properties : {
		models : {
			'user' : require('./models/user.model'),
			'session' : require('./models/session.model')
		}
	}
});