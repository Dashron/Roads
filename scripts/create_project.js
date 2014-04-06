"use strict";
var fs_module = require('fs');
var handlebars = require('handlebars');

var data = {
	PROJECT : process.argv[2],
	SUBPROJECT_SINGULAR : process.argv[3],
	SUBPROJECT_PLURAL : process.argv[4]
}

var final_dir = __dirname + '../projects/' + data.PROJECT;
transferDirectory(__dirname + '/project_templates', data, __dirname + '/../projects/' + data.PROJECT );

function transferDirectory(directory, data, final_dir) {
	var files = fs_module.readdirSync(directory);
	var i = null;

	fs_module.mkdir(final_dir, function (err, response) {
		if (err) {
			throw err;
		}

		for (i = 0; i < files.length; i++) {
			checkFile(directory + '/' + files[i], data, final_dir);
		}
	});
}

function checkFile (path, data, final_dir) {
	var item_name = path.split('/').pop();
	item_name = item_name.replace('SUBPROJECT_PLURAL', data.SUBPROJECT_PLURAL);
	item_name = item_name.replace('SUBPROJECT_SINGULAR', data.SUBPROJECT_SINGULAR);

	fs_module.stat(path, function (err, stats) {
		if (err) {
			throw err;
		}

		if (stats.isDirectory()) {
			transferDirectory(path, data, final_dir + '/' + item_name);

		} else if (stats.isFile()) {
			transferFinalFile(path, data, final_dir + '/' + item_name);
		}
	});
}

function transferFinalFile (template, data, final_file) {
	var file = fs_module.readFileSync(template);
	var template = handlebars.compile(file.toString());
	var output = template(data);

	console.log('writing file : ' + final_file);
	fs_module.writeFileSync(final_file, output);
}