/*
* gfw.js - model.js
* Copyright(c) 2011 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
*/
"use strict";

/**
 * How to use:
 * Create the model constructors from a reference object using buildModel.
 * Use those constructors to create new models, with the loaded data provided as a parameter.
 * eg.
 * var User = model_module.buildModelConstructor({
 * 	id : 'integer',
 * 	name : 'string'
 * });
 * var aaron = new User({id : 5, name : 'Aaron'});
 * 
 * You should not build a module more than once (althoguh it will work, it's just unnecessary)
 * 
 * This model will stay very lean.
 * Other objects should interact on the models, models should not have their own database references or validation scripts
 * 
 */
var Model = module.exports.Model = function Model(data) {
	for (var i in data) {
		this[i] = data[i];
	}

	this.changed = false;
};

Model.prototype.definition = null;
Model.prototype.changed = false;

module.exports.buildModelConstructor = function buildModel (definition) {
	var new_model = function(data) {
		Model.call(this, data);
	};

	new_model.prototype.definition = definition;

	for (var i in definition.methods) {
		if (i === 'definition') {
			throw new Error('Invalid model definition provided. "definition" is a reserved word');
		}

		new_model.prototype[i] = definition.methods[i];
	}

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
					this.changed = true;
					this['_' + key] = value;
				}
			};

			if (field_definition.get) {
				property.get = field_definition.get;
			}

			if (field_definition.set) {
				property.set = function (value) {
					this.changed = true;
					field_definition.set.call(this, value);
				}
			}			

			Object.defineProperty(new_model.prototype, key, property);
		}(i, definition.fields[i]));
	}

	return new_model;
};