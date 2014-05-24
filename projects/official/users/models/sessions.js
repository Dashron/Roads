"use strict";

var roads_models = require('roads-models');

var CachedModelModule = roads_models.CachedModel;
var connections = roads_models.Connection;
var ModelRequest = roads_models.ModelRequest;

var crypto_module = require('crypto');

var UsersModel = require('./users');

var SessionsModule = module.exports = new CachedModelModule();
SessionsModule.connection = connections.getConnection('mysql', 'default');
SessionsModule.redis = connections.getConnection('redis', 'default');

/**
 * create table sessions (id int(10) unsigned not null primary key AUTO_INCREMENT, user_id int(10) unsigned not null, session varchar(88) not null, ip varchar(16) not null, user_agent varchar(40) not null, created_on datetime not null)
 */
SessionsModule.setModel({
	table : 'sessions',
	fields : {
		id : {
			type : 'id'
		},
		user_id : {
			type : 'id',
			// required for any preload field
			assign_to : 'user',
			model_module : UsersModel
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
		refresh : function (request, options) {
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
SessionsModule.start = function start (request, user, options) {
	var _self = this;
	var cookie = request.cookie;
	var new_request = new ModelRequest(this);

	if (typeof options !== "object") {
		options = {};
	}
	
	cookie['delete']('rsess');

	// todo: include byte length in options
	crypto_module.randomBytes(64, function (err, buff) {
		if (err) {
			throw err;
		}
		
		options.value = buff.toString('base64');
		cookie.set('rsess', options);

		var session_model = new _self.Model();
		session_model.session = options.value;

		// no ipv6 support yet. todo.
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
SessionsModule.stop = function (request) {
	var session = request.cookie.get('rsess');
	var session_request = this.load(session, 'session');

	request.cookie['delete']('rsess');

	session_request.addModifier(function (data) {
		if (data) {
			var delete_request = data['delete']();
			delete_request.ready(function () {
				session_request._ready(null);
			});
			delete_request.error(session_request._error.bind(session_request));
		} else {
			session_request._ready(null);
		}
	});

	return session_request;
};

/**
 * [getUser description]
 * @param  {[type]} cookie [description]
 * @param  {[type]} ip     [description]
 * @return {[type]}        [description]
 */
SessionsModule.getUser = function (request) {
	var cookie = request.cookie;
	var ip = request.ip;
	var headers = request.headers;
	var session = cookie.get('rsess');

	// If there is no session in the cookie, we still need to return a request that completes at a later time
	if (!session) {
		var session_request = new ModelRequest(this);
		
		process.nextTick(function () {
			session_request._ready(null);
		});

		return session_request;
	}

	var load_request = this.load(session, 'session');

	load_request.addModifier(function (session_data) {
		if (session_data) {
			// if the ip and user agent are the same
			// no ipv6 support yet
			if (/*session_data.ip === ip && */session_data.userAgentMatches(headers['user-agent'])) {
				var user_request = UsersModel.load(session_data.user_id);
				user_request.ready(load_request._ready.bind(load_request));
				user_request.error(load_request._error.bind(load_request));
			} else {
				//SessionsModule.stop(request);
				load_request._ready(null);
			}
		} else {
			load_request._ready(null);
		}
	});

	return load_request;
};
