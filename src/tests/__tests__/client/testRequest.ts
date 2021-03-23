import Client from '../../../client/request';
import createServer, {port} from '../../resources/mockServer';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import Response from '../../../core/response';

describe('request', () => {
	let server: HttpServer | HttpsServer;

	/**
     * Setup
     */
	beforeAll(() => {
		return createServer()
			.then((newServer: HttpServer | HttpsServer) => {
				server = newServer;
			});
	});

	/**
     * Shutdown
     */
	afterAll(() => {
		return server.close();
	});

	/**
     * Ensure that the basic request system lines up
     */
	test('Request Without Body', () => {
		expect.assertions(3);
		const client = new Client(false, '127.0.0.1', port);

		return new Promise((resolve) => {
			resolve(client.request('GET', '/', undefined, {
				one : 'two'
			}).then(function (response: Response) {
				expect(response.status).toEqual(200);
				expect(response.body).toEqual(JSON.stringify({
					url: '/',
					method: 'GET',
					body: '',
					headers: { one: 'two', host: `127.0.0.1:${port}`, connection: 'close' },
					message: 'hello!'
				}));
				expect(response.headers['this-is']).toEqual('for real');
			}));
		});
	});

	/**
     * Ensure that the basic request system lines up
     */
	test('Request With Body', () => {
		expect.assertions(2);
		const client = new Client(false, '127.0.0.1', port);

		return new Promise((resolve, reject) => {
			resolve(client.request('POST', '/', '{"yeah": "what"}', {
				three : 'four'
			}).then(function (response: Response) {
				expect(response.status).toEqual(200);

				expect(response.body).toEqual(JSON.stringify({
					url: '/',
					method: 'POST',
					// for some reason JSON.stringify is dropping whitespace on this
					body: '{"yeah": "what"}',
					headers: {
						three: 'four',
						host: `127.0.0.1:${port}`,
						connection: 'close',
						'transfer-encoding': 'chunked'
					},
					message: 'hello!'
				}));
			}));
		});
	});
});