module.exports = [ {
		route : /^\/users$/,
		controller : 'user',
		view : 'many'
	}, 

	// login/logout
	{
		route : /^\/users\/auth$/,
		controller : 'user',
		view : 'auth'
	},

	// profile pages
	{
		route : /^\/me$/,
		controller : 'profile',
		view : 'self'
	}
];
