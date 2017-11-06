"use strict";
/**
* http2Server.js
* Copyright(c) 2017 Aaron Hedges <aaron@dashron.com>
* MIT Licensed
 */

const http2 = require('http2');
const {
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_STATUS
} = http2.constants;

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
	 */
	constructor(road) {
		if (!road) {
			throw new Error('You must provide your Road when creating a Roads Server');
		}

		/**
		 * This is the node.js http2 server from the http2 library.
		 * @todo  support HTTPS
		 * @type HTTPServer
		 */
		this._server = null;

		/**
		 * This is the road object that will handle all requests
		 * @type Road
		 */
		this._road = road;

		// @todo: support HTTPS
        this._server = http2.createServer();
        this._server.on('stream', this._onStream.bind(this));
        this._server.on('error', (error) => {
            // todo: allow the implementor to provide this
            console.log('http2 server error', error);
        });
	}

	/**
	 * Helper function to write a roads Response object to an HTTPResponse object
	 * 
	 * @param  HTTPResponse http_response
	 * @param  Response response
	 */
	_sendResponse (stream, response) {
        let response_body;

		// wrap up and write the response to the server
		if (typeof(response.headers['content-type']) !== "string" && typeof(response.body) === "object") {
			response.headers['content-type'] = 'application/json';
		}

        response.headers[HTTP2_HEADER_STATUS] = response.status;
        stream.respond(response.headers);
		
		if (response.body === null) {
            response_body = undefined;
		}	
		else if (typeof(response.body) === "object") {
            response_body = JSON.stringify(response.body);
		} else if (response.body !== undefined) {
			response_body = response.body;
		}

		stream.end(response_body);
	}

	/**
	 * Standard logic for turning each request into a road request, and communicating the response
	 * back to the client
	 * 
	 * @param  HTTPRequest http_request
	 * @param  HTTPResponse http_response

	 */
	_onStream (stream, headers) {
        let body = '';
        let method = headers[HTTP2_HEADER_METHOD];
        let path = headers[HTTP2_HEADER_PATH];

		stream.on('readable', () => {
            let chunk = null;
			while (null !== (chunk = stream.read())) {
				body += chunk;
			}
		});

		stream.on('end', () => {
			// execute the api logic and retrieve the appropriate response object
			this._road.request(method, path, body, headers)
				.then((response) => {
                    this._sendResponse(stream, response);
                }).catch((err) => {
					console.log('We have encountered an unexpected error within the road assigned to this http2 server');
                    console.log(err.stack);
                    
                    stream.respond({
                        [HTTP2_HEADER_STATUS]: 500
                    });
                    stream.end(JSON.stringify({"error" : "An unknown error has occured"}));
				});
		});

		// server request errors go to the unknown error representation
		stream.on('error', (error) => {
            // todo: allow the implementor to provide this
            console.log('http2 server error', error);
        });
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