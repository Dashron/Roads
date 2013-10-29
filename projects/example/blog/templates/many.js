module.exports = function transform (data) {
	var post_json = null;
	var items = [];

	for (var i = 0; i < data.posts.length; i++) {
		if (data.cur_user && data.posts[i].user && data.cur_user.id === data.posts[i].user.id) {
			items.push(this.json('example/blog', 'one.auth', data.posts[i]));
		} else {
			items.push(this.json('example/blog', 'one', data.posts[i]));
		}
	}

	return this.collection(items);
};