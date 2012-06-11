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
 *  user_module.connection = 'default';
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

ModelModule.prototype.getConnection = function () {
	return database_module.getConnection(this.connection);
};

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
	
	NewModel.prototype.query = function () {
		return model_module.getConnection().query();
	}

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

ModelModule.prototype.query = function () {
	return this.getConnection().query();
};

ModelModule.prototype.load = function (value, field) {
	var _self = this;
	var promise = new ModelPromise();

	if (typeof field != "string") {
		field = "id";
	}

	this.query().select('*')
		.from(this.definition.table)
		.where(this.getConnection().name(field) + ' = ?', [value])
		.limit(1)
		.execute(function (err, rows, columns) {
			if (err) {
				promise._error(err);
			}

			promise._ready(new _self.Model(rows[0]));
		});

	return promise;
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
	var promise = new ModelPromise();
	var keys = Object.keys(this.updated_fields);

	if (keys.length > 0) {
		if (typeof this.id === "undefined" || this.id === null) {
			var values = [];

			for (var i = 0; i < keys.length; i++) {
				values.push(this['_' + keys[i]]);
			}

			this.query().insert(this.definition.table, keys, values)
				.execute(function(error, result) {
					promise.result = result;

					if (error) {
						promise._error(error);
						return;
					}

					_self.id = result.id;
					_self.updated_fields = [];
					promise._ready(_self);
				});
		} else {
			var set = {};

			for (var i = 0; i < keys.length; i++) {
				set[keys[i]] = this['_' + keys[i]];
			}

			this.query().update(this.definition.table)
				.set(set)
				.where('id = ?', [this.id])
				.execute(function (error, result) {

					promise.result = result;
					if (error) {
						promise._error(error);
						return;
					}
					_self.updated_fields = [];
					promise._ready(_self);
				});
		}
	} else {
		process.nextTick(function () {
			promise._ready(_self);
		})
	}

	return promise;
}


/**
 * [ModelPromise description]
 *
 *
 *
 * 
 */
var ModelPromise = exports.ModelPromise = function () {
};

ModelPromise.prototype.result = null;

ModelPromise.prototype._error = function (err) {
	this.error = function (fn) {
		fn(err);
	}
};

ModelPromise.prototype.error = function (fn) {
	this._error = fn;
}

ModelPromise.prototype._ready = function (data) {
	this.empty = function (fn) {
		fn(data);
	}
};

ModelPromise.prototype.ready = function (fn) {
	this._ready = fn;
}
