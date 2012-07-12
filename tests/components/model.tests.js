var vows = require('vows');
var assert = require('assert');


var model_module = require('../../components/model');
var Database = require('../../components/database').Database;

vows.describe('Model Component').addBatch({
	'An empty model': {
		topic: function () {
				return model_module.buildModelConstructor({});
		},
		'does something, tbd': function (user) {
		
		},
	},
	'A model with fields' : {
		topic: function () {
				var UserModule = new model_module.ModelModule();
				UserModule.setModel({
						table : 'user',
						fields : {
								id : {
										type : 'id',
								},
								email : {
										type : 'email'
								},
								password : {
										type : 'password',
								},
								last_ip : {
										type : 'ip',
								}
						}
				});

				return new UserModule.Model({
						id : 999,
						email : 'fake@dashron.com',
						password : '555',
						last_ip : 555
				});
		},
		'properly sets the construction values' : function (user) {
				assert.equal(user.id, 999);
				assert.equal(user.email, 'fake@dashron.com');
				assert.equal(user.password, '555');
				assert.equal(user.last_ip, 555);
				assert.equal(Object.keys(user.updated_fields).length, 0);
		},
		'can access the definition' : function (user) {
				assert.deepEqual(user.definition, {
						table : 'user',
						fields : {
								id : {
										type : 'id',
								},
								email : {
										type : 'email'
								},
								password : {
										type : 'password',
								},
								last_ip : {
										type : 'ip',
								}
						}
				});
		},
		'can use the fields' : function (user) {
				user.id = 1;
				user.email = 'aaron@dashron.com';
				user.password = '12345'; //worst password ever
				user.last_ip = '127.0.0.1';

		assert.equal(user.id, 1);
				assert.equal(user.email, 'aaron@dashron.com');
				assert.equal(user.password, '12345');
				assert.equal(user.last_ip, '127.0.0.1');
				assert.equal(Object.keys(user.updated_fields).length, 4);
		}
	},
	'A model with getters and setters' : {
		topic: function () {
				var UserModule = new model_module.ModelModule();
				UserModule.setModel({
						table : 'user',
						fields : {
								id : {
										type : 'id',
								},
								email : {
										type : 'email'
								},
								password : {
										type : 'password',
										set : function (value) {
												this._password = 'worst_salt_' + value;
										}
								},
								last_ip : {
										type : 'ip',
								},
								first_name : {
										type : 'string'
								},
								last_name : {
										type : 'string'
								},
								display_name : {
										type : 'string',
										get : function () {
												if (this._first_name || this._last_name) {
														return this._first_name + ' ' + this._last_name;
												} else {
														return "Unnamed";
												}
										}
								}
						}
				});

				return new UserModule.Model();
		},
		'can use setters' : function (user) {
				user.password = '1234';
				assert(user.password, 'worst_salt_1234');
		},
		'can use getters' : function (user) {
				assert.equal(user.display_name, "Unnamed");
				user.first_name = "Aaron";
				user.last_name = "Hedges";
				assert.equal(user.display_name, "Aaron Hedges");
		}
	},
	'A model with methods' : {
		topic: function () {
				var UserModule = new model_module.ModelModule();
				UserModule.setModel({
						table : 'user',
						fields : {
								password : {
										type : 'password',
										set : function (value) {
												this._password = 'worst_salt_' + value;
										}
								}
						},
						methods : {
								checkPassword : function checkPassword(password) {
										return 'worst_salt_' + password === this._password;
								}
						}
				});

				return new UserModule.Model();
		},
		'can call function' : function (user) {
				user.password = '1234';
			assert.isTrue(user.checkPassword('1234'));
		}
	},
	'A model module' : {
		topic: function () {
				var _self = this;
				new Database('default', {
					host: 'localhost',
					user : 'gfw',
					database: 'gfw'
				});

				var UserModule = new model_module.ModelModule();
				UserModule.connection = new Database('default');
				UserModule.setModel({
						table : 'user',
						fields : {
								id : {
										type : 'id',
								},
								email : {
										type : 'email'
								},
								password : {
										type : 'password',
										set : function (value) {
												this._password = 'worst_salt_' + value;
										}
								},
								last_ip : {
										type : 'ip',
								}
						},
						methods : {
								checkPassword : function checkPassword(password) {
										return 'worst_salt_' + password === this._password;
								}
						}
				});

				return UserModule;
		},
		'can use load' : function (user_module) {
				var promise = user_module.load(1);
				
				promise.error(function (err) {
						throw err;
				});

				promise.ready(function (model) {
						assert.equal(model.id, 1);
				});
		},
		'can insert' : function (user_module) {
				var user = new user_module.Model();
				user.email = 'aaron@dashron.com';
				user.password = '12345';
				user.last_ip = '127.0.0.1';
				var promise = user.save();

				promise.ready(function (result) {
						assert.equal(promise.result.affectedRows, 1);
						assert.ok(!isNaN(result.id));
				});

				promise.error(function (error) {
						throw error;
				});
		},
		'can update' : function (user_module) {
				var user = new user_module.Model();
				user.email = 'aaron@dashron.com';
				user.password = '12345';
				user.last_ip = '127.0.0.1';
				var insert_promise = user.save();

				insert_promise.ready(function (insert_user) {
						assert.equal(this.result.affectedRows, 1);
						assert.ok(!isNaN(insert_user.id));
						
						var load_promise = user_module.load(insert_user.id);

						load_promise.ready(function (load_user) {
								load_user.email = 'fake@dashron.com';
								var update_promise = load_user.save();

								update_promise.ready(function (update_user) {
										assert.equal(update_promise.result.affectedRows, 1);
										assert.equal(update_user.email, 'fake@dashron.com');
								});

								update_promise.error(function (error) {
										throw error;
								});
						});

						load_promise.error(function (error) {
							   throw error;
						});
				});

				insert_promise.error(function (error) {
						console.log(error);
						throw error;
				});
		},
		'can delete' : function (user_module) {
				var user = new user_module.Model();
				user.email = 'aaron@dashron.com';
				user.password = '12345';
				user.last_ip = '127.0.0.1';
				var insert_promise = user.save();

				insert_promise.ready(function (insert_user) {
						assert.equal(this.result.affectedRows, 1);
						assert.ok(!isNaN(insert_user.id));
						
						var load_promise = user_module.load(insert_user.id);

						load_promise.ready(function (load_user) {
								var delete_promise = load_user.delete();

								delete_promise.ready(function (delete_user) {
										assert.equal(this.result.affectedRows, 1);
										assert.equal(delete_user, null);

										var load2_promise = user_module.load(insert_user.id);

										load2_promise.ready(function (load2_user) {
												assert.equal(load2_user, null);
										});

										load2_promise.error(function (error) {
												throw error;
										});
								});

								delete_promise.error(function (error) {
										throw error;
								});
						});

						load_promise.error(function (error) {
							   throw error;
						});
				});

				insert_promise.error(function (error) {
						console.log(error);
						throw error;
				});
		}
	}
}).export(module); // Export the Suite
