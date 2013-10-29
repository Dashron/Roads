module.exports = function transform (data) {
	if (data === null) {
		return null;
	}

	var post = data.post ? data.post : data;
	var json = this.json('example/blog', 'one', post);

	json.actions = {
		'edit' : {
			uri : '/posts/' + post.id,
			method : 'PATCH',
			fields : ['title', 'body']
		},
		'delete' : {
			uri : '/posts/' + post.id,
			method : 'DELETE',
			fields : ['title', 'body']
		}
	};

	return json;
};