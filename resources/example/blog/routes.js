module.exports = [ {
	route : /^\/blog\/posts$/,
	controller : 'posts',
	view : 'many'
}, {
	route : /^\/blog\/posts\/(\d+)$/,
	controller : 'posts',
	view : 'one',
	keys : ['id']
}];
