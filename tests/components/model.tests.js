var vows = require('vows');
var assert = require('assert');


var model_module = require('../../components/model');

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
        	var User = model_module.buildModelConstructor({
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

                return new User({
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
                assert.equal(user.changed, false);
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
                assert.equal(user.changed, true);
        }
    },
    'A model with getters and setters' : {
        topic: function () {
                var User = model_module.buildModelConstructor({
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

                return new User();
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
        	var User = model_module.buildModelConstructor({
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

                return new User();
        },
        'can call function' : function (user) {
                user.password = '1234';
        	assert.isTrue(user.checkPassword('1234'));
        }
    }
}).export(module); // Export the Suite
