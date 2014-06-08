var VALID_METHODS = ['GET','HEAD','POST','PUT','DELETE','OPTIONS'];

//TODO: add direct spec references
module.exports.Resource = function Resource (constructor) {
	this.GET = constructor.
};

Resource.prototype.GET = null;
Resource.prototype.HEAD = null;
Resource.prototype.POST = null;
Resource.prototype.PUT = null;
Resource.prototype.DELETE = null;
Resource.prototype.CONNECT = null;


Resource.prototype.OPTIONS = function* (request, response) {
	response = response.get('options');

	if (request.headers['request-target'] === '*') {
		// applies to server
		return;
	}

	// this is not explicitly defined in the spec, we arbitrarily return an options response object 
	var body = true;
	var resource_methods = [];

	for (let i = 0; i < VALID_METHODS.length; i++) {
		if (this[VALID_METHODS[i]]) {
			resource_methods.push(VALID_METHODS[i]);
		}
	}

	//applies to resource
	// expose allow header
	response.headers.allow = resource_methods;

	if (body) {
		// If there is a body, content type is required. there is no spec for the body.
		// response.headers['content-type'] = 'application/json'; // This is set by the response object, so we don't have to worry about it here.
		response.data.options = resource_methods;
	} else {
		// if there is no body, content length 0 is required
		response.headers['content-length'] = 0;
	}

};

Resource.prototype.TRACE = null;
Resource.prototype.PATCH = null;