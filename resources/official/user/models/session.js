"use strict";

var model_component = require('roads-models');
var model_module = model_component.Model;
var ModelRequest = model_component.ModelRequest;
var CachedModelModule = model_component.CachedModel;
var connections = model_component.Connection;

var crypto_module = require('crypto');

var UserModel = require('./user');

var SessionModule = module.exports = new CachedModelModule();
SessionModule.connection = connections.getConnection('mysql', 'default');
SessionModule.redis = connections.getConnection('redis', 'default');
SessionModule.setModel({
	table : 'session',
	fields : {
		id : {
			type : 'id'
		},
		user_id : {
			type : 'id',
			// required for any preload field
			assign_to : 'user',
			model_module : UserModel
		},
		session : {
			type : 'string'
		},
		ip : {
			type : 'ip'
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
		refresh : function (cookie, options) {
			/*var _self = this;
			var new_request = new model_module.ModelRequest(this);

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
				request.ready(function (data) {
					new_request._ready(data);
				});

				request.error(function (err) {
					new_request._error(err);
				});
			});

			return new_request;*/
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
SessionModule.start = function start (request, cookie, user, options) {
	var _self = this;
	var new_request = new ModelRequest(this);

	if (typeof options != "object") {
		options = {};
	}
	
	cookie['delete']('rsess');

	crypto_module.randomBytes(64, function (err, buff) {
		if (err) {
			throw err;
		}
		
		options.value = buff.toString('base64');
		cookie.set('rsess', options);

		var session_model = new _self.Model();
		session_model.session = options.value;

		session_model.ip = request.connection.remoteAddress;
		session_model.user_id = user.id;

		var sha1 = crypto_module.createHash('sha1');
		sha1.update(request.headers['user-agent']);
		session_model.user_agent = sha1.digest('hex');

		var save_request = session_model.save();
		save_request.ready(new_request._ready.bind(new_request));
		save_request.error(new_request._error.bind(new_request));
	});

	return new_request;
};

/**
 * Ends the session by deleting the cookie data and the database record
 * 
 * @param  {[type]} cookie [description]
 * @return {[type]}        [description]
 */
SessionModule.stop = function (request) {
	var session = request.cookie.get('rsess');
	var new_request = new ModelRequest(this);
	var session_request = this.load(session, 'session');

	request.cookie['delete']('rsess');

	session_request.error(new_request._error.bind(new_request));

	session_request.ready(function (data) {
		if (data) {
			var delete_request = data['delete']();
			delete_request.ready(function () {
				new_request._ready(null);
			});
			delete_request.error(new_request._error.bind(new_request));
		} else {
			new_request._ready(null);
		}
	});

	return new_request;
};

/**
 * [getUser description]
 * @param  {[type]} cookie [description]
 * @param  {[type]} ip     [description]
 * @return {[type]}        [description]
 */
SessionModule.getUser = function (cookie, ip, headers) {	
	var session = cookie.get('rsess');
	var new_request = new ModelRequest(this);

	if (session) {
		var load_request = this.load(session, 'session');
		load_request.error(new_request._error.bind(new_request));

		load_request.ready(function (session_data) {
			if (session_data) {
				// if the ip and user agent are the same
				if (session_data.ip === ip && session_data.userAgentMatches(headers['user-agent'])) {
					var user_request = UserModel.load(session_data.user_id);
					user_request.ready(new_request._ready.bind(new_request));
					user_request.error(new_request._error.bind(new_request));
				} else {
					//SessionModule.stop(request);
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
