var Resource = require('../../../lib/resource').Resource;

/**
 * [one description]
 * @type {Resource}
 */
module.exports.one = new Resource({
});

/**
 * [many description]
 * @type {Resource}
 */
module.exports.many = new Resource({
	resources : {
		'#id' : module.exports.one
	}	
});