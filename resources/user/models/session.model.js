var model_module = require('../../../components/model');
var crypto_module = require('crypto');

var UserModel = require('./user.model');
var Database = require('../../../components/database').Database;

var SessionModule = module.exports = new model_module.ModelModule();
SessionModule.connection = new Database('default');
SessionModule.setModel({
	table : 'session',
	fields : {
		id : {
			type : 'id',
		},
		user_id : {
			type : 'id',
			// required for any preload field
			assign_to : 'user',
			model_module : require('../../user/models/user.model')
		},
		session : {
			type : 'string'
		},
		ip : {
			type : 'ip',
		},
		user_agent : {
			type : 'string'
		},
		created_on : {
			type : 'date'
		}
	},
	methods : {
		userAgentMatches : function (check) {
			var sha1 = crypto_module.createHash('sha1');
			sha1.update(check);
			return this.user_agent === sha1.digest('hex');			
		},
		refresh : function (cookie) {
			var _self = this;
			var new_request = new model_module.ModelRequest();
			
			crypto_module.randomBytes(64, function (err, buff) {
				if (err) {
					throw err;
				}

				options.value = buff.toString('base64');
				cookie.set('rsess', options);

				var session_model = new _self.Model();
				session_model.session = options.value;
				
				session_model.ip = cookie._request.socket.remoteAddress;
				session_model.user_id = user.id;

				var sha1 = crypto_module.createHash('sha1');
				sha1.update(headers['User-Agent']);
				session_model.user_agent = sha1.digest('hex');

				var request = session_model.save();
				request.ready(function (data) {
					new_request._ready(data);
				});

				request.error(function (err) {
					new_request._error(err);
				});
			});

			return new_request;
		}
	}
});

/**
 * Start a session by creating cookie data and a database record
 * 
 * @param  {[type]} ip      [description]
 * @param  {[type]} user    [description]
 * @param  {[type]} cookie  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
SessionModule.start = function start (headers, user, cookie, options) {
	var _self = this;
	var new_request = new model_module.ModelRequest();

	if (typeof options != "object") {
		options = {};
	}
	
	cookie.delete('rsess');

	crypto_module.randomBytes(64, function (err, buff) {
		if (err) {
			throw err;
		}
		
		options.value = buff.toString('base64');
		cookie.set('rsess', options);

		var session_model = new _self.Model();
		session_model.session = options.value;

		session_model.ip = cookie._request.socket.remoteAddress;
		session_model.user_id = user.id;

		var sha1 = crypto_module.createHash('sha1');
		sha1.update(headers['user-agent']);
		session_model.user_agent = sha1.digest('hex');

		var request = session_model.save();
		request.ready(new_request._ready.bind(new_request));
		request.error(new_request._error.bind(new_request));
	});

	return new_request;
};

/**
 * Ends the session by deleting the cookie data and the database record
 * 
 * @param  {[type]} cookie [description]
 * @return {[type]}        [description]
 */
SessionModule.stop = function (cookie) {
	var session = cookie.get('rsess');
	var request = this.load(session, 'session');
	var new_request = new model_module.ModelRequest(this);

	cookie.delete('rsess');

	request.error(new_request._error.bind(new_request));

	request.ready(function (data) {
		data.delete();
		new_request._ready(null);
	});

	return new_request;
};

/**
 * [getUser description]
 * @param  {[type]} cookie [description]
 * @param  {[type]} ip     [description]
 * @return {[type]}        [description]
 */
SessionModule.getUser = function (cookie, headers) {
	var session = cookie.get('rsess');
	var new_request = new model_module.ModelRequest(this);

	if (session) {
		var request = this.load(session, 'session');

		request.error(new_request._error.bind(new_request));

		request.ready(function (data) {
			if (data) {
				// if the ip and user agent are the same
				// @todo get the ip address in another way
				if (data.ip === cookie._request.socket.remoteAddress && data.userAgentMatches(headers['user-agent'])) {
					var user_request = UserModel.load(data.user_id);
					user_request.ready(new_request._ready.bind(new_request));
					user_request.error(new_request._error.bind(new_request));
				} else {
					new_request._ready(null);
				}
			} else {
				new_request._ready(null);
			}
		});
	} else {
		process.nextTick(function () {
			new_request._ready(null);
		});
	}

	return new_request;
};