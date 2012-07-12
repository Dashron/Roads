/*
* gfw.js - model.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

var database_module = require('./database');
var util_module = require('util');

/**
 * How to use:
 *  var user_module = new model_module.ModelModule();
 *  user_module.connection = new Database('default');
 *  user_module.setModel({
 *  	table : '',
 *  	fields : {
 *  		name : {
 *  			type : '',
 *  			set : function (){},
 *  			get : function (){}
 *  		}
 *  	},
 *  	methods : {
 *  		name : function (){}
 *  	}
 *  });
 *
 * user_module.do_stuff();
 *  
 */
var ModelModule = module.exports.ModelModule = function ModelModule () {
};

ModelModule.prototype.connection = null;

ModelModule.prototype.setModel = function (definition) {
	var model_module = this;
	this.definition = definition;
	
	var NewModel = function(data) {
		Model.call(this, data);
	};
	util_module.inherits(NewModel, Model);

	NewModel.prototype.definition = definition;
	applyModelMethods(NewModel, definition);
	applyModelFields(NewModel, definition);

	NewModel.prototype.connection = model_module.connection;

	this.Model = NewModel;
};

function applyModelMethods (model, definition) {
	for (var i in definition.methods) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		model.prototype[i] = definition.methods[i];
	}
}
	
function applyModelFields (model, definition) {
	for (var i in definition.fields) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		(function (key, field_definition) {
			var property = {
				get : function() {
					return this['_' + key];
				},
				set : function(value) {
					this.updated_fields[key] = true;
					this['_' + key] = value;
				}
			};

			if (field_definition.get) {
				property.get = field_definition.get;
			}

			if (field_definition.set) {
				property.set = function (value) {
					this.updated_fields[key] = true;
					field_definition.set.call(this, value);
				}
			}			

			Object.defineProperty(model.prototype, key, property);
		}(i, definition.fields[i]));
	}
}

ModelModule.prototype.load = function (value, field) {
	var _self = this;
	var request = new ModelRequest();

	if (typeof field != "string") {
		field = "id";
	}

	this.connection
		.query('select * from `' + this.definition.table + '`' 
				+ ' where `' + field + '` = ? limit 1', 
				[value], 
				function (err, rows, columns) {
					if (err) {
						request._error(err);
						return;
					}

					if (rows.length === 0) {
						// todo: should I use ready, error and empty? or just pass null to ready?
						request._ready(null);
						return;
					}

					request._ready(new _self.Model(rows[0]));
				});

	return request;
};

/**
 * Returns an array of all the models found by the provided sql
 * @param  {String} sql   
 * @param  {Object} params key value map
 * @return {Array}        Array of models
 */
ModelModule.prototype.collection = function (sql, params) {
	var request = new ModelRequest();
	var _self = this;
	this.connection.query(sql, params, function (err, rows, columns) {
		if (err) {
			request._error(err);
			return;
		}

		var models = new Array(rows.length);

		for (var i = 0; i < rows.length; i++) {
			models[i] = new _self.Model(rows[i]);
		}

		request._ready(models);
	});

	return request;
};


var Model = module.exports.Model = function Model (data) {
	// todo: maybe don't double initalize?
	// we have to set this here because the prototype has to be null otherwise all objects share the field list
	this.updated_fields = {};

	for (var i in data) {
		this[i] = data[i];
	}

	// we have to set this a second time to wipe out any updated field markers from setting the initial data
	this.updated_fields = {};
};

Model.prototype.definition = null;
Model.prototype.updated_fields = null;

Model.prototype.save = function () {
	var _self = this;
	var request = new ModelRequest();
	var keys = Object.keys(this.updated_fields);

	//todo don't allow save to be called on a deleted object
	if (keys.length > 0) {
		if (typeof this.id === "undefined" || this.id === null) {
			var values = [];
			var placeholders = [];

			for (var i = 0; i < keys.length; i++) {
				values.push(this['_' + keys[i]]);
				placeholders.push('?');
			}

			this.connection
				.query('insert into `' + this.definition.table + '`'
						+ '(`' + keys.join('`, `') + '`)'
						+ ' VALUES (' + placeholders.join(', ') + ')', 
						values,
						function(error, result) {
							request.result = result;

							if (error) {
								request._error(error);
								return;
							}

							_self.id = result.insertId;
							_self.updated_fields = [];
							request._ready(_self);
						});
		} else {
			var values = [];

			for (var i = 0; i < keys.length; i++) {
				values.push(this['_' + keys[i]]);
			}
			
			values.push(this.id);

			this.connection
				.query('update `' + this.definition.table + '`'
						+ ' set `' + keys.join('` = ?, `') + '` = ? '
						+ ' where `id` = ?', 
						values, 
						function (error, result) {

							request.result = result;
							if (error) {
								request._error(error);
								return;
							}
							_self.updated_fields = [];
							request._ready(_self);
						});
		}
	} else {
		process.nextTick(function () {
			request._ready(_self);
		})
	}

	return request;
}

Model.prototype.delete = function () {
	var request = new ModelRequest();

	this.connection
		.query('delete from `' + this.definition.table + '`'
			+ ' where `id` = ?', 
			[this.id], 
			function (error, result) {
				request.result = result;

				if (error) {
					request._error(error);
					return;
				}

				// todo: mark the model as deleted, so it does not accidentally get used in other locations
				request._ready(null);
			});

	return request;
};

/**
 * [ModelRequest description]
 *
 *
 *
 * 
 */
var ModelRequest = exports.ModelRequest = function () {
};

ModelRequest.prototype.result = null;

ModelRequest.prototype._error = function (err) {
	this.error = function (fn) {
		fn(err);
	}
};

ModelRequest.prototype.error = function (fn) {
	this._error = fn;
}

ModelRequest.prototype._ready = function (data) {
	this.empty = function (fn) {
		fn(data);
	}
};

ModelRequest.prototype.ready = function (fn) {
	this._ready = fn;
}
