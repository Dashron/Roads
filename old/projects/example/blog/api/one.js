"use strict";


module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var post = data.post ? data.post : data;

	return {
		uri : '/posts/' + post.id,
		title : post.title,
		body : post.body,
		user : this.json('official/users', 'one', post.user)
	}
};