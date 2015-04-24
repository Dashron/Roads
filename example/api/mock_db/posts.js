"use strict";

var posts = [{
	id : 1,
	name : 'First post',
	body : 'Hey here\'s some stuff',
	user_id : 1
}, {
	id : 2,
	name : 'More posts',
	body : 'Theres a thing here you should see it',
	user_id : 2
}, {
	id : 3,
	name : 'Check out these posts',
	body : 'More boring posts',
	user_id : 2
}];

var get = function (key) {
	switch (key) {
		case "all" : 
			return posts;
		case "id=1" :
			return posts[0];
		case "id=2" :
			return posts[1];
		case "id=3" :
			return posts[2];
		case "user_id=1" :
			return [posts[0]];
		case "user_id=2" :
			return [posts[1], posts[2]];
	}

	if (key.indexOf('user_id=') === 0) {
		return [];
	}

	return null;
};

module.exports.get = function (key, callback) {
	return new Promise(function (resolve, reject) {
		resolve(get(key));
	});
};