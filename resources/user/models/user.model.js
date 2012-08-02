var model_module = require(__dirname.replace('/resources/user/models', '/components/model'));
var crypto_module = require('crypto');

var Database = require('../../../components/database').Database;

var UserModule = module.exports = new model_module.ModelModule();
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
			set : function (password) {
				this._password = crypto_module.createHash('sha256').update(password).digest('hex');
			}
		},
		last_ip : {
			type : 'ip',
		}
	},
	methods : {
		checkPassword : function checkPassword(password) {
			var sha256 = crypto_module.createHash('sha256').update(password);
			return sha256.digest('hex') === this._password;
		}
	}
});

UserModule.getAll = function () {
	return this.collection('select * from user');
};