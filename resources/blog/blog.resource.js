var Resource = require('../../components/resource').Resource;

module.exports = new Resource('blog', {
	router: require('./blog.router'),
	properties : {
		models : {
			post : require('./models/post.model')
		}
	}
});
