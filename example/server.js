var Promise = require('bluebird');

// bluebird 2.0 took array yields out of the standard library, so we have to re-implement it here. It is not used in roads, just the examples
Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

var api = new (require('../index').API)(require('./resources/root').many, {
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
