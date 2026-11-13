export default {
	'/': {
		GET: function () {
			return 'root get successful';
		},
		POST: function () {
			return 'root post successful';
		}
	},
	'/test': {
		GET: function () {
			return 'test get successful';
		}
	}
};
