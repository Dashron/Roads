module.exports = [ {
		route : /^\/users$/,
		controller : 'user/user',
		view : 'many'
	}, 

	// login/logout
	{
		route : /^\/users\/login$/,
		controller : 'user/auth',
		view : 'login'
	}, {
		route : /^\/users\/logout$/,
		controller : 'user/auth',
		view : 'logout'
	},

	// profile pages
	{
		route : /^\/me$/,
		controller : 'user/profile',
		view : 'self'
	}
];
