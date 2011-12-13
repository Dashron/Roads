"use strict";
var static_file_module = require('../../components/static');

var Tests = exports.Tests = function () {
	var _self = this;

	/**
	 * 
	 */
	var mock_resource = function (assert, file_exists) {
		var buffer = '';
		var _status = 0;
		
		return {
			writeHead : function (status, headers) {
				_status = status;
			},
			write : function (data) {
				buffer += data;
			},
			end : function (contents) {
				if(typeof contents === "string") {
					buffer += contents;
				}
				
				if(file_exists) {
					assert.equal('this is the contents of the file', buffer);
				} else {
					assert.equal(_status, 404);
				}
			}
		};
	};

	_self.testLoadFile = function (assert) {
		static_file_module.bustCache();

		static_file_module.loadFile(__dirname.replace('components', '') + 'testing_resources/test_file.txt', function (
				contents) {
			assert.equal('this is the contents of the file', contents);
		}, function (error) {
			assert.fail("could not load file");
		});
	};

	_self.testLoadFileFail = function (assert) {
		static_file_module.bustCache();

		static_file_module.loadFile(__dirname.replace('components', '')
				+ 'testing_resources/test_file_which_should_never_exist.txt', function (contents) {
			assert.fail("this file should not exist");
		}, function (error) {
			assert.equal('ENOENT', error.code);
		});
	};

	_self.testStreamFile = function (assert) {
		static_file_module.bustCache();
		static_file_module.streamFile(__dirname.replace('components', '') + 'testing_resources/test_file.txt',
				mock_resource(assert, true));
	};

	_self.testStreamFileFail = function (assert) {
		static_file_module.bustCache();
		static_file_module.streamFile(__dirname.replace('components', '')
				+ 'testing_resources/test_file_which_should_never_exist.txt', mock_resource(assert, false));
	};
};