"use strict";

var roads = require(__dirname + '/../../index');
var road = new roads.Road([require('./resources/root').root, require('./resources/private').root]);
var fs = require('fs');

road.use(roads.middleware.killSlash);

require('http').createServer(function (req, res) {
	if (['/client.brws.js', '/client.map.json'].indexOf(req.url) !== -1) {
		res.setHeader('content-type', 'application/javascript');
		res.write(fs.readFileSync(__dirname + req.url));
		res.end();
		return;
	}

	// In the real world you could use express, and have the static middleware sit before roads
	return road.server(req, res);
})
.listen(8081, function () {
	console.log('server has started');
});
