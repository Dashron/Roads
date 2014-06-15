var api = new (require('../lib/api').API)();

api.representations.users = require('./representations/user');
api.representations.post = require('./representations/post');
api.representations.options = require('./representations/options');
api.representations.errors = {
	unknown : require('./representations/errors/unknown'),
	notFound : require('./representations/errors/notFound')
};

api.rootResource = require('./resources/root').many;

require('http').createServer(function (request, http_response) {
	var body = '';

	request.on('data', function (data) {
		body += data;
	});

	request.on('end', function () {
		request.body = body;
		api[request.method](request)
			.then(function (response) {
				response.writeTo(http_response)
					.then(function () {
						http_response.end();
					});
			});
	});

	request.on('error', function (err) {
		var response = new Response(api.representations.errors.unknown(err));

		response.status = 500;
		response.writeTo(http_response);
		http_response.end();
	});

}).listen(8080, function () {
	console.log('server has started');
});
