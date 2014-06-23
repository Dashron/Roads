"use strict";

var Promise = require('bluebird');

var users = [{
	id : 1,
	name : 'aaron',
	email : 'aaron@dashron.com'
}, {
	id : 2,
	name : 'zena',
	email : 'zena@dashron.com'
}, {
	id : 3,
	name : 'paul',
	email : 'paul@dashron.com'
}];

var get = function (key) {
	switch (key) {
		case "all" : 
			return users;
		case "id=1" :
			return users[0];
		case "id=2" :
			return users[1];
		case "id=3" :
			return users[2];
	}
}

module.exports.get = function (key, callback) {
	return new Promise(function (resolve, reject) {
		resolve(get(key));
	});
}