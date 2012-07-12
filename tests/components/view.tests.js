var vows = require('vows');
var assert = require('assert');
var path_module = require('path');

var view_component = require('../../components/view');
var View = view_component.View;

vows.describe('View Component').addBatch({
    'An html view': {
        topic: function () {
        	var view = new View();
        	var _topic = this;
        	view.setContentType('text/html');
        	view.dir = path_module.normalize(__dirname + '/../testing_resources/');
        	view.error(function (error) {
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

        	view.render('view_example.html');
        },
        'renders correctly': function (view) {
		assert.equal(view.buffer, "this is a  test");
        },
        'is complete' : function (view) {
        	console.log(view);
        	assert.equal(view.view.render_state, view_component.RENDER_STATES.RENDER_COMPLETE);
        },
    },
    'An html view with data' : {
        topic: function () {
        	var _topic = this;
        	var view = new View();
        	view.setContentType('text/html');
        	view.dir = __dirname.replace('/components', '/testing_resources') + '/';
        	view.error(function (error) {
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
        	view.render('view_example.html');
        },
        'renders correctly' : function (view) {
			assert.equal(view.buffer, "this is a single view test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view_component.RENDER_STATES.RENDER_COMPLETE);
        },
    },
    'An html view with children rendered first' : {
        topic: function () {
        	var _topic = this;
        	var view = new View();
        	view.setContentType('text/html');
        	view.dir = __dirname.replace('/components', '/testing_resources') + '/';
        	view.error(function (error) {
        		throw error;
        	});
        	var child = view.child('status');
        	child.set('status', 'child');
        	child.render('view_example.html');

        	view.setResponse({
    			buffer : '',
        		write : function (chunk) {
        			this.buffer += chunk;
        		},
        		end : function () {
        			_topic.callback(null, {view: view, buffer: this.buffer});
        		}
        	});
        	view.render('view_example.html');
        },
        'renders correctly' : function (view) {
        	assert.equal(view.buffer, "this is a this is a child test test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view_component.RENDER_STATES.RENDER_COMPLETE);
        },
    },
    'An html view with children rendered last' : {
        topic: function () {
        	var view = new View();
        	var _topic = this;
        	view.setContentType('text/html');
        	view.dir = __dirname.replace('/components', '/testing_resources') + '/';
        	view.error(function (error) {
        		throw error;
        	});
        	var child = view.child('status');
        	
        	view.render('view_example.html');

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
        	child.render('view_example.html');
        },
        'renders correctly' : function (view) {
        	assert.equal(view.buffer, "this is a this is a child test test");
        },
        'is complete' : function (view) {
        	assert.equal(view.view.render_state, view_component.RENDER_STATES.RENDER_COMPLETE);
        },
    }
}).export(module); // Export the Suite
