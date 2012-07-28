var model_module = require(__dirname.replace('/resources/blog/models', '/components/model'));
var Database = require('../../../components/database').Database;

var PostModule = module.exports = new model_module.ModelModule();
PostModule.connection = new Database('default');
PostModule.setModel({
	table : 'blog_post',
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
		title : {
			type : 'string',
			max_len : 180
		},
		body : {
			type : 'string',
		}
	}
});

PostModule.getForUser = function (user_id, pager) {
	var sql = 'select * from blog_post where user_id = ?';
	
	if (typeof pager === "object") {
		sql = sql + pager.getSql();
	}

	return this.collection(sql, [user_id]);
};

PostModule.getAll = function (pager) {
	var sql = 'select * from blog_post';
	
	if (typeof pager === "object") {
		sql = sql + pager.getSql();
	}

	return this.collection(sql);
};