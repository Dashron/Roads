var vows = require('vows');
var assert = require('assert');


var View = require('../../components/view').View;

/*
			var resource = this.getResource('user');
			resource.request('/users/1', view.child('user'));
			process.nextTick(function () {
				resource.request('/users/5', view.child('user_two'));
				view.render('index.html');
			});
*/

/*
			var request_date = uri_bundle.headers['if-modified-since'];
			var path = this.template_dir + uri_bundle.params.file;
// For some reason, this view does not take the new render mode content-type
			switch (uri_bundle.params.ext) {
				case 'js':
					view.setRenderMode('text/javascript');
					break;

				case 'css':
					view.setRenderMode('text/css');
					break;

				case 'txt':
				case 'html':
				default:
					view.setRenderMode('text/plain');
					break;
			}

			// can we improve this further? it would be nice to not need to stat a file each request
			if (typeof request_date === "string") {
				request_date = new Date(request_date);
				fs_module.stat(path, function (err, stats) {
					if (err) {
						view.error(err);
					} else {
						if (stats.mtime.getTime() > request_date.getTime()) {
							view.notModified();
						} else {
							view.render(uri_bundle.params.file);
					}	}
					}
				});
			} else {
				view.setErrorHandler(function (error) {
					console.log(error);
					view.notFound('404.html');
				});
				view.setTemplate(uri_bundle.params.file);
				view.render();
			}
*/
vows.describe('View Component').addBatch({
    'An html view': {
        topic: function () {
        	var view = new View();
        	var _topic = this;
        	view.setRenderMode('text/html');
        	view.setDir(__dirname.replace('/components', '/testing_resources') + '/');
        	view.setErrorHandler(function (error) {
        		throw error;
        	});
        	view.setResponse({
        		buffer : '',
        		write : function (chunk) {
        			this.buffer += chunk;
        		},
        		end : function () {
        			_topic.callback(null, {view: view, buffer: this.buffer});
        		}
        	});

        	view.render('view_example.mu.html');
        },
        'renders correctly': function (view) {
			assert.equal(view.buffer, "this is a  test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view.view.RENDER_COMPLETE);
        },
    },
    'An html view with data' : {
        topic: function () {
        	var _topic = this;
        	var view = new View();
        	view.setRenderMode('text/html');
        	view.setDir(__dirname.replace('/components', '/testing_resources') + '/');
        	view.setErrorHandler(function (error) {
        		throw error;
        	});
        	view.set('status', 'single view');

        	view.setResponse({
    			buffer : '',
        		write : function (chunk) {
        			this.buffer += chunk;
        		},
        		end : function () {
        			_topic.callback(null, {view: view, buffer: this.buffer});
        		}
        	});
        	view.render('view_example.mu.html');
        },
        'renders correctly' : function (view) {
			assert.equal(view.buffer, "this is a single view test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view.view.RENDER_COMPLETE);
        },
    },
    'An html view with children rendered first' : {
        topic: function () {
        	var _topic = this;
        	var view = new View();
        	view.setRenderMode('text/html');
        	view.setDir(__dirname.replace('/components', '/testing_resources') + '/');
        	view.setErrorHandler(function (error) {
        		throw error;
        	});
        	var child = view.child('status');
        	child.set('status', 'child');
        	child.render('view_example.mu.html');

        	view.setResponse({
    			buffer : '',
        		write : function (chunk) {
        			this.buffer += chunk;
        		},
        		end : function () {
        			_topic.callback(null, {view: view, buffer: this.buffer});
        		}
        	});
        	view.render('view_example.mu.html');
        },
        'renders correctly' : function (view) {
        	assert.equal(view.buffer, "this is a this is a child test test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view.view.RENDER_COMPLETE);
        },
    },
    'An html view with children rendered last' : {
        topic: function () {
        	var view = new View();
        	var _topic = this;
        	view.setRenderMode('text/html');
        	view.setDir(__dirname.replace('/components', '/testing_resources') + '/');
        	view.setErrorHandler(function (error) {
        		throw error;
        	});
        	var child = view.child('status');
        	
        	view.render('view_example.mu.html');
        	
        	view.setResponse({
    			buffer : '',
        		write : function (chunk) {
        			this.buffer += chunk;
        		},
        		end : function () {
        			_topic.callback(null, {view: view, buffer: this.buffer});
        		}
        	});

        	child.set('status', 'child');
        	child.render('view_example.mu.html');
        },
        'renders correctly' : function (view) {
        	assert.equal(view.buffer, "this is a this is a child test test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view.view.RENDER_COMPLETE);
        },
    }
}).export(module); // Export the Suite
