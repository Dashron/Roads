var model_module = require(__dirname.replace('/resources/blog/models', '/components/model'));

var crypto_module = require('crypto');


var PostModule = module.exports = new model_module.ModelModule();
PostModule.connection = 'default';
PostModule.setModel({
	table : 'post',
	fields : {
		id : {
			type : 'id',
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

PostModule.getAll = function (pager) {
	var sql = 'select * from user';
	
	if (typeof pager === "object") {
		sql = sql + pager.getSql();
	}

	return this.collection(sql);
};