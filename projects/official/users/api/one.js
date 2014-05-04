"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var user = data.user ? data.user : data;

	var result = {
		uri : '/users/' + user.id,
		name : user.name,
		permissions : user.permissions.toArray()
	};

	return result;
}