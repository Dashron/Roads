"use strict";

var init = require('../init');
var Connections = require('roads-models').Connection;

init.config();

var db = init.db();
db.ready(function () {
	var user_model = require('../projects/official/users/models/users');
	var email = process.argv[2];
	var password = process.argv[3];

	if (email && password) {
		user_model.load(email, 'email')
			.ready(function (user) {
				if (user) {
					console.log('Emails should be unique, the user with the email:' + email + ' already exists');
					Connections.disconnect();
				} else {
					var model = new user_model.Model();
					model.email = email;
					model.password = password;
					model.save()
						.error(function (err) {
							throw err;
						})
						.ready(function () {
							console.log('User created with email:' + email + ' and password:' + password);
							console.log(model);
							// next tick this because the rebuilt sorts are thrown into extra next ticks
							Connections.disconnect();
						});
				}
			})
			.error(function (err) {
				throw err;
			});
	} else {
		console.log('You must provide an email and password');
		Connections.disconnect();
	}
});
