"use strict";

var roads = require(__dirname + '/../../index');
var api = new roads.Road(require('./resources/root').many);

var notFoundRepresentation = require('./representations/server/notFound');
var notAllowedRepresentation = require('./representations/server/notAllowed');
var unknownRepresentation = require('./representations/server/unknown');

api.use(roads.middleware.standard());

api.use(function (method, url, body, headers, next) {
	var context = this;
	// find authenticated user
	/*if (user) {
		this.cur_user = user;
	}*/

	return next()
		.catch(function (err) {
			var response = null;

			switch (err.code) {
				case 404:
					return new context.Response(notFoundRepresentation(err), 404);
				case 405:
					return new context.Response(notAllowedRepresentation(err), 405);
				case 500:
				default:
					return new context.Response(unknownRepresentation(err), 500);
			}
		});
});//*/

require('http').createServer(api.server.bind(api))
	.listen(8081, function () {
		console.log('server has started');
	});
