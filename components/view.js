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
 * 
 * //Create the child:
 * var child = template.child("header", "templates/header.html");
 * child.title = "Hello World";
 * 
 * //Write the view to the response
 * template.render(response);
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
	this.template = template;
	this.data = {};
	this.js = {};
	this.css = {};
	this.child_templates = {};
	this.rendered = false;
	this.parent = null;
	this.template_engine = new MuRenderer();
};
util.inherits(View, event.EventEmitter);

/**
 * @type {Object}
 */
View.prototype.data = {};

/**
 * @type {Object}
 */
View.prototype.js = {};

/**
 * @type {Object}
 */
View.prototype.css = {};

/**
 * @type {Object}
 */
View.prototype.child_templates = {};

/**
 * @type {Boolean}
 */
View.prototype.rendered = false;

/**
 * @type {View}
 */
View.prototype.parent = null;

/**
 * @type {MuRenderer}
 */
View.prototype.template_engine = null;

/**
 * returns whether the view has finished rendering or not
 * @returns {Boolean}
 */
View.prototype.isRendered = function view_isRendered() {
	return this.rendered;
};

/**
 * Sets data to be rendered to the view
 * @param {String} key
 * @param {Mixed} value
 */
View.prototype.set = function view_set(key, value) {
	this.data[key] = value;
};

/**
 * Retrieves all of the data so that it can be rendered by a parent
 * @param {String} key
 * @return {Mixed|Object}
 */
View.prototype.get = function view_get(key) {
	if(typeof key === "string") {
		return this.data[key];
	}
	return this.data;
};

/**
 * Set the directory this view will be loaded from
 * @param {String} path
 */
View.prototype.setDir = function view_setDir(path) {
	this.template_engine.setDir(path);
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
		this.data[i] = new_data[i];
	}
};

/**
 * If the view is ready to be rendered, this will be true, otherwise false
 * @returns {Boolean}
 */
View.prototype.canRender = function view_canRender() {
	var key = null;
	for(key in this.child_templates) { 
		if(!this.child_templates[key].isRendered()) {
			return false;
		}
	}
	return true;
};

/**
 * Renders the current view, writing the the response, if and only if all child views have been completed
 * @todo: Handle the case where a child element never finishes
 * @param {HttpResponse|String} response
 */
View.prototype.render = function view_render(response) {
	var _self = this;
	//in case render is called multiple times (should we allow this?), we always want it to be false at the start
	_self.rendered = false;
	
	//count the amount of child templates still rendering.
	//if there are some we have to wait for the view to finish
	if(_self.canRender()) {
		
		//if a string, then we should have a parent and use the response as the key in the parent
		if(_self.parent && typeof response === "string") {
			if(_self.css.length) {
				_self.data.css = _self.css;
			}
			
			if(_self.js.length) {
				_self.data.js = _self.js;
			}
			
			if(!_self.data.view) {
				_self.data.view = _self;
			}
			
			// Makes a fake response that writes to the parent instead of to an actual response object
			_self.template_engine.toResponse(_self.template, _self.data, {
					buffer: '',
					write: function(chunk) { this.buffer += chunk; },
					end: function() { 
						_self.rendered = true;

						_self.emit('end', this.buffer);
						_self.parent.set(response, this.buffer); 
						if(_self.parent.canRender()) {
							_self.parent.emit('children_complete');
						}
					}
			 });
		}
		//if we have a non-string response, assume it's something that's writeable, and endable (like the http response)
		else if(response) {
			if(_self.css.length) {
				_self.data.css = _self.css;
			}
			
			if(_self.js.length) {
				_self.data.js = _self.js;
			}
			
			if(!_self.data.view) {
				_self.data.view = _self;
			}
			_self.template_engine.toResponse(_self.template, _self.data, response);
		}
		else {
			throw new Error("Unsupported rendering workflow");
		}

	}
	//if there are not any, we can render the data right now
	else {
		var key = null;
		// render all child templates
		for(key in _self.child_templates) {
			(function(c_template) {
				//async call child templates to render
				process.nextTick(function() {
					c_template.render(key);
				});					
			})(_self.child_templates[key]);
		}

		_self.addListener('children_complete', function() {
			//this is a saftey precaution. if children_complete is fired at an incorrect time
			//for any reason, just rendering would lead to crazy loop, so we check here
			if(_self.canRender()) {
				_self.render(response);
			}
			else {
				throw new Error("Children Complete has been called before this view was able to render");
			}
		});
	}
};

/**
 * Create a child view
 * @param {String} key required, the key the parent will render the data in
 * @param {String} template required, the template file to be rendered
 * @returns {View}
 */
View.prototype.child = function view_child(key, template) {
	this.child_templates[key] = new View(template);
	this.child_templates[key].parent = this;
	this.child_templates[key].setDir(this.template_engine.getDir());
	return this.child_templates[key];
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
		this.js.push({'src': file});
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
		this.css.push({'src': file});
	}
};


/**
 * 
 */
var MuRenderer = function() {
	this.dir = '';
};

/**
 * 
 */
MuRenderer.prototype.dir = '';
	
/**
 * 
 * @return {String}
 */
MuRenderer.prototype.getDir = function() {
	return this.dir;
};

/**
 * @param {String} dir
 */
MuRenderer.prototype.setDir = function(dir) {
	this.dir = dir;
};

/**
 * Use mu to render the view and write it to the provided writable and endable response
 * @param {String} template
 * @param {Object} data
 * @param {HttpResponse} response a writable, and endable response
 * @return {HttpResponse}
 * @todo use pipe
 */
MuRenderer.prototype.toResponse = function(template, data, response) {
	//var time = null;
	//var render_data = apply_additional_data(_data);

	mu.render(this.dir + template, data, {}, function(err, output) {
		if(err) {
			throw err;
		}
		
		//write chunk
		output.addListener('data', function(c) {
			/*if(time==null) {
				time = (new Date).getTime();
				console.log("\t" + template + ": start " + time + "ms");
			}*/
			response.write(c);
		});
		
		//wrap up
		output.addListener('end', function(c) {
			/*var new_time = (new Date).getTime();
			console.log("\t" + template + ": took " + (new_time - time) + "ms - end: " + new_time);*/
			response.end();
		});
	});
};
