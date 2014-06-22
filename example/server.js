var Promise = require('bluebird');

// bluebird 2.0 took array yields out of the standard library, so we have to re-implement it here. It is not used in roads, just the examples
Promise.coroutine.addYieldHandler(function(yieldedValue) {
    if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});

var roads = require('../index');
var api = new roads.API(require('./resources/root').many);

var notFoundRepresentation = require('./representations/server/notFound');
var notAllowedRepresentation = require('./representations/server/notAllowed');
var unknownRepresentation = require('./representations/server/unknown');

api.onError(function (error) {
	console.log(error);
	switch (error.code) {
		case 404:
			return new roads.Response(notFoundRepresentation(error), 404);
		case 405:
			return new roads.Response(notAllowedRepresentation(error), 405);
		case 500:
		default:
			return new roads.Response(unknownRepresentation(error), 500);
	}
});

require('http').createServer(api.server.bind(api))
	.listen(8081, function () {
		console.log('server has started');
	});