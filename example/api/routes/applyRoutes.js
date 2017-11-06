"use strict";
/**
* applyRoutes.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

var Users = require('../mock_db/users');
var userRepresentation = require('../representations/user');
var collectionRepresentation = require('../representations/collection');

module.exports = function (api) {
	api.addRoute('GET', '/', function (url, body, headers) {
		return new this.Response({
			"users" : "/users",
			"posts" : "/posts"
		});
	});

	api.addRoute('GET', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		return new this.Response(userRepresentation(user));
	});

	api.addRoute('PATCH', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		if (body.name) {
			user.name = body.name;
		}

		if (body.email) {
			user.email = body.email;
		}

		return new this.Response(userRepresentation(user), 201);
	});

	api.addRoute('DELETE', '/users/#user_id', async function (url, body, headers) {
		if (!url.args.user_id) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		var user = await Users.get('id=' + url.args.user_id);

		if (!user) {
			throw new roads.HttpError('User not found', roads.HttpError.not_found);
		}

		await user.delete();

		return new this.Response(null, 204);
	});


	api.addRoute('GET', '/users', async function (url, body, headers) {
		return new this.Response(collectionRepresentation(await Users.get('all'), userRepresentation));
	});

	api.addRoute('POST', '/users', function (url, body, headers) {
		var user = {};

		if (body.name) {
			user.name = body.name;
		} else {
			throw new roads.HttpError('You must provide a user name when creating users', roads.HttpError.invalid_request);
		}

		if (body.email) {
			user.email = body.email;
		} else {
			throw new roads.HttpError('You must provide a user email when creating users', roads.HttpError.invalid_request);
		}

		return new this.Response(userRepresentation(user), 201);
	});
};