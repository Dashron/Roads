"use strict";
var fs_module = require('fs');

var data = {
	'{{PROJECT_NAME}}' : process.argv[2],
	// TOOD: This makes no sense as a subproject
	// It should be called MODEL_SINGULAR and MODEL_PLURAL
	'{{SUBPROJECT_SINGULAR}}' : process.argv[3],
	'{{SUBPROJECT_PLURAL}}' : process.argv[4]
}

if (!data['{{PROJECT_NAME}}']) {
	throw new Error('You must provide a project name as the first argument');
}

if (!data['{{SUBPROJECT_SINGULAR}}']) {
	throw new Error('You must provide a singular subproject name as the second argument');
}

if (!data['{{SUBPROJECT_PLURAL}}']) {
	data['{{SUBPROJECT_PLURAL}}'] = data['{{SUBPROJECT_SINGULAR}}'] + 's';
}




var final_dir = __dirname + '../projects/' + data['{{PROJECT_NAME}}'];

var dirs = data['{{PROJECT_NAME}}'].split('/');
if (dirs.length > 1) {
	var cur_folder = __dirname + '/../projects';

	for (var i = 0; i < dirs.length - 1; i++) {
		cur_folder = cur_folder + '/' + dirs[i];
		console.log('initalizing folder : ' + cur_folder);
		try { 
			fs_module.mkdirSync(cur_folder);
		} catch (e) {
			// only fail if the folder doesn't exist
			if (!e.code === 'EEXIST') {
				throw e;
			}
		}
	}
}

transferDirectory(__dirname + '/project_templates', data, __dirname + '/../projects/' + data['{{PROJECT_NAME}}'] );

function transferDirectory(directory, data, final_dir) {
	var files = fs_module.readdirSync(directory);
	var i = null;

	console.log('creating folder : ' + final_dir);
	fs_module.mkdir(final_dir, function (err, response) {
		if (err) {
			if (err.code === 'EEXIST') {
				throw new Error('This project subfolder already exists');
			}

			throw err;
		}

		for (i = 0; i < files.length; i++) {
			checkFile(directory + '/' + files[i], data, final_dir);
		}
	});
}

function checkFile (path, data, final_dir) {
	var item_name = path.split('/').pop();

	item_name = item_name.replace('SUBPROJECT_PLURAL', data['{{SUBPROJECT_PLURAL}}']);
	item_name = item_name.replace('SUBPROJECT_SINGULAR', data['{{SUBPROJECT_SINGULAR}}']);

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
	var file = fs_module.readFileSync(template).toString();

	for (var key in data) {
		file = file.replace(new RegExp(key, 'g'), data[key]);
	}

	console.log('writing file : ' + final_file);
	fs_module.writeFileSync(final_file, file);
}
