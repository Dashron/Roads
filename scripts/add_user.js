"use strict";

var init = require('../init');
var Connections = require('roads-models').Connection;

init.config();

var db = init.db();
db.ready(function () {
	var user_model = require('../resources/official/user/models/user');
	var email = process.argv[2];
	var password = process.argv[3];

	if (email && password) {
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
				Connections.disconnect();
			});
	} else {
		console.log('You must provide an email and password');
	}
});