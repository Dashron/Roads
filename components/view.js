/*
* gfw.js - view.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";
var mu = require('mu');
var event = require('events');
var util = require('util');

mu.templateRoot = '/';

/**
 * Renders templates asynchronously, supporing an unlimited amount of child views.
 * 
 * USAGE:
 * //Templates:
 * templates/index.html
 * <html>
 *  <head></head>
 *  <body>
 *   {{{header}}}
 *  </body>
 * </html>
 * 
 * templates/header.html
 * <header>
 * {{title}}
 * </header>
 * 
 * 
 * //Create the parent:
 * var template = new View("templates/index.html");
 * template.setResponse(response)
 * 
 * //Create the child:
 * var child = template.child("header", "templates/header.html");
 * child.title = "Hello World";
 * 
 * //Write the view to the response
 * template.render();
 * 
 * //And you are done! You don't have to tell the child views to render, that is all handled for you.
 * //The final rendered contents of Child will be rendered in template's "header" tag, so make sure you use raw data and don't escape it
 * //If you want to use the js or css functions, you need to 
 * 
 * @author Aaron Hedges <aaron@dashron.com>
 * @param {String} template
 * @deprecated
 */
var View = exports.View = function View(template) {
	event.EventEmitter.call(this);
	this._js = {};
	this._css = {};
	this._template_engine = new MuRenderer(template);
	this._child_views = {};

	this.render_state = this.RENDER_NOT_CALLED;
	this.parent = null;
};

util.inherits(View, event.EventEmitter);

View.prototype._js = null;
View.prototype._css = null;
View.prototype._template_engine = null;
View.prototype._child_views = null;
View.prototype.render_state = 0;
// TODO: Move these constants into the module? not the class?
View.prototype.RENDER_NOT_CALLED = 0;
View.prototype.RENDER_REQUESTED = 1;
View.prototype.RENDER_STARTED = 2;
View.prototype.RENDER_COMPLETE = 3;
View.prototype.RENDER_FAILED = 4;
View.prototype.parent = null;

/**
 * Set the directory this view will be loaded from
 * @param {String} path
 */
View.prototype.setDir = function view_setDir(path) {
	this._template_engine.dir = path;
	return this;
};

/**
 * [setResponse description]
 * @param {[type]} response [description]
 */
View.prototype.setResponse = function view_setResponse(response) {
	this._template_engine.response = response;
	return this;
}

/**
 * returns whether the view has finished rendering or not
 * @returns {Boolean}
 */
View.prototype.isRendered = function view_isRendered() {
	return this.render_state == this.RENDER_COMPLETE;
};

/**
 * Sets data to be rendered to the view
 * @param {String} key
 * @param {Mixed} value
 */
View.prototype.set = function view_set(key, value) {
	this._template_engine.data[key] = value;
};

/**
 * Retrieves all of the data so that it can be rendered by a parent
 * @param {String} key
 * @return {Mixed|Object}
 */
View.prototype.get = function view_get(key) {
	if(typeof key === "string") {
		return this._template_engine.data[key];
	}
	return this._template_engine.data;
};

/**
 * Executes the provided function, and adds all the keys in the returned object
 * to the data which will be rendered in this view
 * @TODO: Only call func when render is executed
 * @param {Function} func
 */
View.prototype.fill = function view_fill(func) {
	var new_data = func();
	var i = null;
	for(i in new_data) {
		this._template_engine.data[i] = new_data[i];
	}
};

/**
 * If the view is ready to be rendered, this will be true, otherwise false
 * @returns {Boolean}
 */
View.prototype.canRender = function view_canRender() {
	var key = null;

	/**
	 * This protects from items rendering in random async order
	 * example 1:
	 * parent creates child, loads data from database, then renders.
	 * child immediately renders
	 * - in this example, the child is complete first, and checks if the parent can render.
	 *    Render has not been requested, so it fails. Once the parent calls render everything works fine
	 * 
	 * example 2:
	 * Parent creates child, then immediately renders
	 * child loads data from database then renders.
	 * - in this example, the parent is complete first, so it marks render as requested but notices child views exist
	 *    Because of this, it waits. Once the child view renders it notices that the parent is ready and immediately calls parent.render
	 */  
	if (this.render_state != this.RENDER_REQUESTED) {
		return false;
	}

	for(key in this._child_views) { 
		if(!this._child_views[key].isRendered()) {
			return false;
		}
	}
	return true;
};

/**
 * Renders the current view, writing the the response, if and only if all child views have been completed
 * @todo: Handle the case where a child element never finishes
 */
View.prototype.render = function view_render(template) {
	if (typeof template === "string") {
		this._template_engine.template = template;
	}
	this.render_state = this.RENDER_REQUESTED;

	if (this.canRender()) {
		this.render_state = this.RENDER_STARTED;
		this._template_engine.render();
	}
};


/**
 * Create a child view
 * @param {String} key required, the key the parent will render the data in
 * @param {String} template required, the template file to be rendered
 * @returns {View}
 */
View.prototype.child = function view_child(key, template) {
	var new_view = new View(template);
	new_view.parent = this;
	new_view.setDir(this._template_engine.dir);

	// Makes a fake response that writes to the parent instead of to an actual response object
	new_view._template_engine.response = {
		buffer: '',
		write: function(chunk) {
			this.buffer += chunk; 
		},
		end: function() { 
			// flag the child view as rendered
			new_view.render_state = new_view.RENDER_COMPLETE;

			// set the child data into the parent view, and then render the parent if possible
			new_view.parent.set(key, this.buffer); 

			if(new_view.parent.canRender()) {
				new_view.parent.render();
			}
		}
	 };

	this._child_views[key] = new_view;

	return this._child_views[key];
};


/**
 * Adds a javascript file, and pushes it all the way up the chain to the core template
 * TODO: add a flag so it is not pushed to the top? is that useful?
 * @param {String} file 
 */
View.prototype.addJs = function view_addJs(file) {
	if(this.parent) {
		this.parent.addJs(file);
	}
	else {
		this._js.push({'src': file});
	}
};

/**
 * Adds a css file, and pushes it all the way up the chain to the core template
 * TODO: add a flag so it is not pushed to the top? is that useful?
 * @param {String} file
 */
View.prototype.addCss = function view_addCss(file) {
	if(this.parent) {
		this.parent.addCss(file);
	}
	else {
		this._css.push({'src': file});
	}
};


/**
 * 
 */
var MuRenderer = function(template) {
	this.dir = '';
	this.response = {};
	this.data = {};
	this.template = template;
};

MuRenderer.prototype.response = null;
MuRenderer.prototype.template = null;
MuRenderer.prototype.data = null;
MuRenderer.prototype.dir = '';

MuRenderer.prototype.error = function (err) {
	// In case the error is called before the error handler is applied, we mess with the function so we still get output
	this.errorHandler = function (fn) {
		fn(err);
	};
};

/**
 * [errorHandler description]
 * @param  {Function} fn [description]
 * @return {[type]}
 */
MuRenderer.prototype.errorHandler = function (fn) {
	this.error = fn;
};

/**
 * Use mu to render the view and write it to the provided writable and endable response
 * @param {String} template
 * @param {Object} data
 * @param {HttpResponse} response a writable, and endable response
 * @return {HttpResponse}
 * @todo use pipe
 */
MuRenderer.prototype.render = function() {
	var _self = this;

	mu.render(_self.dir + _self.template, _self.data, {}, function(err, output) {
		if(err) {
			// todo: this is really just debug info. we need a different error here (500 probably)
			_self.response.end(JSON.stringify(err));
			_self.error(err);
			return;
		}
		
		//write chunk
		output.addListener('data', function(c) {
			_self.response.write(c);
		});
		
		//wrap up
		output.addListener('end', function(c) {
			_self.response.end();
		});
	});
};