/* eslint-disable @typescript-eslint/no-explicit-any */
import * as http from 'http';
import {Server} from 'http';
import { AddressInfo } from 'net';

// creates an http server specifically for testing this request library. It listens on a port chosen
//	by the OS, so it never collides with anything else running on the machine.
export default function createServer(): Promise<{ server: Server, port: number }> {

	return new Promise((resolve, reject) => {
		const server = http.createServer();

		server.on('request', (request, response) => {
			// Each request collects its own body
			let body = '';

			// Get all the streaming input data from the request
			request.on('readable', () => {
				let chunk;

				while (null !== (chunk = request.read())) {
					body += chunk;
				}
			});

			// When the request stops sending data, wrap it all up and find the proper API response
			request.on('end', () => {
				const routerResponse = router(request.method as string, request.url as string)(body, request.headers);
				response.writeHead(routerResponse.status, routerResponse.headers ? routerResponse.headers : {});

				if (typeof routerResponse.body !== 'undefined') {
					response.write(routerResponse.body);
				}

				response.end();

			});

			// Fail the request instead of throwing, which would crash the test run
			request.on('error', () => {
				response.writeHead(500);
				response.end();
			});
		});

		server.listen(0, '127.0.0.1', () => {
			resolve({ server, port: (server.address() as AddressInfo).port });
		});

		server.on('error', (err) => {
			reject(err);
		});
	});
}

interface MockResponse {
    status: number,
    headers?: Record<string, any>,
    body?: string
}

// Formatting help for building the responses interpreted by this test http server
function buildResponse(status: number, headers?: Record<string, any>, body?: string): MockResponse {
	const response: MockResponse = {
		status: status
	};
	if (headers !== undefined) {
		response.headers = headers;
	}
	if (body !== undefined) {
		response.body = body;
	}
	return response;
}

/**
 * List of all test routes
 */
const routes: Record<string, Record<string, {
    (body: string, headers: Record<string, any>): MockResponse
}>> = {
	'/': {
		GET: (body, headers) => {
			return {
				status: 200,
				headers: {
					'this-is': 'for real',
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					url: '/',
					method: 'GET',
					body: body,
					headers: headers,
					message: 'hello!'
				})
			};
		},
		POST: (body, headers) => {
			return {
				status: 200,
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					url: '/',
					method: 'POST',
					body: body,
					headers: headers,
					message: 'hello!'
				})
			};
		}
	},
	'/headers': {
		GET: (body, headers) => {
			return {
				status: 200,
				headers: {
					'cache-control': ['no-cache', 'no-store'],
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					url: '/',
					method: 'GET',
					body: body,
					headers: headers,
					message: 'hello!'
				})
			};
		}
	}
};

/**
 * Function to help locate test routes
 *
 * @param {*} method
 * @param {*} url
 */
function router (method: string, url: string) {
	if (routes[url] && routes[url][method]) {
		return routes[url][method];
	}

	return () => {
		return buildResponse(404, {}, 'Page not found');
	};
}