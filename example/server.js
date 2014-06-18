var api = new (require('../lib/api').API)(require('./resources/root').many, {
	user : require('./representations/user'),
	post : require('./representations/post'),
	collection : require('./representations/collection'),
	server  : {
		unknown : require('./representations/server/unknown'),
		notFound : require('./representations/server/notFound'),
		notAllowed : require('./representations/server/notAllowed'),
		options : require('./representations/server/options')
	}
});

require('http').createServer(api.server.bind(api))
	.listen(8081, function () {
		console.log('server has started');
	});
