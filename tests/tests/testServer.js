/**
 * TODO. These functions are copied over from when they were tests on the response object. Now that they are on the server we will eventually reuse the tests here
 * 
 * 
 * 
/**
 * Ensure when no status code is provided, it defaults to 200
 
exports.testWriteDefaultStatus = function (test) {
	var res = new roads.Response("hello");
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.equal(this.status, 200);
			test.deepEqual(this.headers, {});
			test.done();
		}
	});
};

/**
 * Ensure custom headers are set properly
 
exports.testWriteCustomHeaders = function (test) {
	var res = new roads.Response("hello", 200, {"hello" : "goodbye"});
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.deepEqual(this.headers, {"hello" : "goodbye"});
			test.done();
		}
	});
};

/**
 * Ensure that strings passed to the response object are written as is
 
exports.testWriteString = function (test) {
	var res = new roads.Response("hello", 1234);
	res.writeToServer({
		writeHead : function (status, headers) {
			this.status = status;
			this.headers = headers;
		},
		write : function (contents) {
			test.equal(contents, "hello");
			test.equal(this.status, 1234);
			test.deepEqual(this.headers, {});
			test.done();
		}
	});
};

/**
 * Ensure that objects passed to the response object are written as JSON
 
exports.testWriteObject = function (test) {
	var res = new roads.Response({"hello" : 1}, 1234);
	let _contents = false;
	let response = {};

	res.writeToServer({
		writeHead : function (status, headers) {
			response.status = status;
			response.headers = headers;
		},
		write : function (contents) {
			_contents = contents;
		}
	});


	test.deepEqual(_contents, '{"hello":1}');
	test.equal(response.status, 1234);
	test.deepEqual(response.headers, {"content-type" : "application/json"});
	test.done();
};

/**
 * Ensure that existing content-type headers are not overriden by writeToServer
 
exports.testWriteObjectWithContentTypeOverride = function (test) {
	var res = new roads.Response({"hello" : 1}, 1234, {"content-type" : "text/html"});
	let _contents = false;
	let response = {};

	res.writeToServer({
		writeHead : function (status, headers) {
			response.status = status;
			response.headers = headers;
		},
		write : function (contents) {
			_contents = contents;
		}
	});

	test.deepEqual(_contents, '{"hello":1}');
	test.equal(response.status, 1234);
	test.deepEqual(response.headers, {"content-type" : "text/html"});
	test.done();
};

/**
 * Ensure that if you provide undefined, nothing is written to the output.
 
exports.testWriteNull = function (test) {
	var res = new roads.Response(undefined, 1234, {"content-type" : "text/html"});
	let writeRun = false;
	let response = {};

	res.writeToServer({
		writeHead : function (status, headers) {
			response.status = status;
			response.headers = headers;
		},
		write: function (contents) {
			writeRun = true;
		}
	});

	test.ok(!writeRun);
	test.done();
};

/**
 * Ensure that if you provide null, nothing is written to the output.
 
exports.testWriteNull = function (test) {
	var res = new roads.Response(null, 1234, {"content-type" : "text/html"});
	let writeRun = false;
	let response = {};

	res.writeToServer({
		writeHead : function (status, headers) {
			response.status = status;
			response.headers = headers;
		},
		write: function (contents) {
			console.log('contents', contents);
			writeRun = true;
		}
	});

	test.ok(!writeRun);
	test.done();
};

 */