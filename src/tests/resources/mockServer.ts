/* eslint-disable @typescript-eslint/no-explicit-any */
import * as http from 'http';
import {Server} from 'http';

export const port = 8081;

// creates an http server specifically for testing this request library
export default function createServer(): Promise<Server> {

	return new Promise((resolve, reject) => {
		const server = http.createServer();

		let body: string | undefined = '';
		let bodyFound = false;

		server.on('request', (request, response) => {
			// Get all the streaming input data from the request
			request.on('readable', () => {
				bodyFound = true;
				let chunk = null;

				while (null !== (chunk = request.read())) {
					body += chunk;
				}
			});

			// When the request stops sending data, wrap it all up and find the proper API response
			request.on('end', () => {
				if (!bodyFound) {
					body = undefined;
				}

				const routerResponse = router(request.method as string, request.url as string)(body, request.headers);
				response.writeHead(routerResponse.status, routerResponse.headers ? routerResponse.headers : {});

				if (typeof routerResponse.body !== 'undefined') {
					response.write(routerResponse.body);
				}

				response.end();

			});

			// Handle any errors
			request.on('error', (err: Error) => {
				throw err;
			});
		});

		server.listen(port, () => {
			resolve(server);
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
	return {
		status: status,
		headers: headers,
		body: body
	};
}

/**
 * List of all test routes
 */
const routes: Record<string, Record<string, {
    (body: string | undefined, headers: Record<string, any>): MockResponse
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