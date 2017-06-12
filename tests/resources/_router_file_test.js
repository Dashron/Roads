module.exports['/'] = {
	GET:  function () {
		return "root get successful";
	},
	POST: function () {
		return "root post successful";
	}
};

module.exports['/test'] = {
	GET: function () {
		return "test get successful";
	}
};