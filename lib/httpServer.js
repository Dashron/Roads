"use strict";
/**
* httpServer.js
* Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

const roads = require('../index.js');
const http = require('http');

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Server {
	/**
	 * Constructs a new Server object that helps create Roads servers.
	 *
	 * @todo  tests
	 * @param  Roads road The Road that handles all the routes
	 * @param  Function error_handler An overwrite to the standard error handler. Accepts a single parameter (the error) and should return a Roads.Response object.
	 */
	constructor(road, error_handler) {
		if (!road) {
			throw new Error('You must provide your Road when creating a Roads Server');
		}

		/**
		 * This is the node.js http server from the http library.
		 * @todo  support HTTPS
		 * @type HTTPServer
		 */
		this._server = null;

		/**
		 * This is the road object that will handle all requests
		 * @type Road
		 */
		this._road = road;

		/**
		 * If set, this holds the custom error handler defined by the user in the constructor
		 * 
		 * @type null|function
		 */
		if (error_handler) {	
			this._custom_error_handler = error_handler;
		} else {
		 	this._custom_error_handler = null;
		}

		// @todo: support HTTPS
		this._server = http.createServer(this._onRequest.bind(this));
	}

	/**
	 * Standard logic to handle any errors thrown in the roads request.
	 * If a custom error handler was provided in the constructor, it will use that. Otherwise
	 * it will fall back to the roads default logic.
	 *
	 * The roads default logic is
	 *  - If the error is a roads.HttpError, display the error message and status code exactly as thrown.
	 *  - If the error is anything else, display a 500 error with the message "Server Error: ".
	 * 
	 * @param  HTTPResponse http_response
	 * @param  Error error
	 */
	_error_handler (http_response, error) {
		if (this._custom_error_handler) {
			return this._writeToResponse(http_response, this._custom_error_handler(error));
		}

		if (error instanceof roads.HttpError) {
			this._writeToResponse(http_response, new roads.Response({"error": error.message}, error.code));
		} else {
			this._writeToResponse(http_response, new roads.Response({"error" : "An unknown error has occured"}, 500));
		}
	}

	/**
	 * Helper function to write a roads Response object to an HTTPResponse object
	 * 
	 * @param  HTTPResponse http_response
	 * @param  Response response
	 */
	_writeToResponse (http_response, response) {
		// wrap up and write the response to the server
		response.writeToServer(http_response);
		http_response.end();
	}

	/**
	 * Standard logic for turning each request into a road request, and communicating the response
	 * back to the client
	 * 
	 * @param  HTTPRequest http_request
	 * @param  HTTPResponse http_response

	 */
	_onRequest (http_request, http_response) {
		var body = '';
		var _self = this;

		var error_handler = _self._error_handler.bind(_self, http_response);
		var success_handler = _self._writeToResponse.bind(_self, http_response);

		http_request.on('readable', () => {
	  		let chunk = null;
			while (null !== (chunk = http_request.read())) {
				body += chunk;
			}
		});

		http_request.on('end', () => {
			// execute the api logic and retrieve the appropriate response object
			_self._road.request(http_request.method, http_request.url, body, http_request.headers)
				.then(success_handler).catch(error_handler).catch((err) => {
					console.log('An error has been encountered in the roads HTTP Server error handler');
					console.log(err.stack);
					// If the error handler throws errors, raise a 500
					_self._writeToResponse(http_response, new roads.Response({"error" : "An unknown error has occured"}, 500));
				});
		});

		// server request errors go to the unknown error representation
		http_request.on('error', error_handler);
	}

	/**
	 * Start the http server. Accepts the same parameters as HttpServer.listen
	 * 
	 * @param int port
	 * @param string hostname
	 */
	listen (port, hostname) {
		return this._server.listen(port, hostname);
	}
};