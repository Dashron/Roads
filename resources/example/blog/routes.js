module.exports = [ {
	route : /^\/posts$/,
	controller : 'blog',
	view : 'many'
}, {
	route : /^\/posts\/(\d+)$/,
	controller : 'blog',
	view : 'one',
	keys : ['id']
}];
