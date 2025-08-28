import { build } from '../../../src/middleware/cors.js';
import Response from '../../../src/core/response.js';
import { describe, expect, test, vi } from 'vitest';

describe('CORS Comprehensive Tests', () => {
	test('builds cors middleware function', () => {
		const middleware = build({});
		expect(middleware).toBeInstanceOf(Function);
	});

	test('handles requests without origin header - calls next without CORS headers', async () => {
		const middleware = build({});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await middleware.call({}, 'GET', '/', {}, {}, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(result).toBeInstanceOf(Response);
		expect(result.headers['access-control-allow-origin']).toBeUndefined();
	});

	test('handles valid origin in allowlist - adds CORS headers', async () => {
		const middleware = build({
			validOrigins: ['https://example.com', 'https://test.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('blocks invalid origin not in allowlist - returns error response', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://malicious.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.body).toContain('CORS Error: origin not allowed');
		expect(result.headers['access-control-allow-origin']).toBeUndefined();
	});

	test('allows all origins with wildcard - adds CORS headers', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://any-domain.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-allow-origin']).toBe('https://any-domain.com');
	});

	test('handles preflight OPTIONS request - returns preflight response', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['GET', 'POST', 'PUT'],
			allowedRequestHeaders: ['Content-Type', 'Authorization']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST',
			'access-control-request-headers': 'Content-Type,Authorization'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(mockNext).not.toHaveBeenCalled(); // Should not call next for valid preflight
		expect(result).toBeInstanceOf(Response);
		expect(result.status).toBe(200);
		expect(result.body).toBe('');
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
		expect(result.headers['access-control-allow-methods']).toBe('GET, POST, PUT');
		expect(result.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
	});

	test('blocks preflight with invalid method - returns error response', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['GET', 'POST']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('Method not allowed', 405));

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'DELETE'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(405);
		expect(result.body).toContain('CORS Error: method not allowed');
		expect(result.headers['access-control-allow-methods']).toBeUndefined();
	});

	test('blocks preflight with invalid headers - returns error response', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST'],
			allowedRequestHeaders: ['Content-Type']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('Invalid headers', 400));

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST',
			'access-control-request-headers': 'Authorization'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.body).toContain('CORS Error: header not allowed');
		expect(result.headers['access-control-allow-headers']).toBeUndefined();
	});

	test('adds credentials support when enabled', async () => {
		const middleware = build({
			validOrigins: ['*'],
			supportsCredentials: true
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-allow-credentials']).toBe('true');
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('does not add credentials when disabled', async () => {
		const middleware = build({
			validOrigins: ['*'],
			supportsCredentials: false
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('adds cache max age for preflight', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['GET'],
			cacheMaxAge: 3600
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'GET'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-max-age']).toBe('3600');
	});

	test('does not add cache max age when not specified', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['GET']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'GET'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-max-age']).toBeUndefined();
	});

	test('exposes response headers for non-preflight requests', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedResponseHeaders: ['X-Custom-Header', 'X-Another-Header']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-expose-headers']).toBe('X-Custom-Header, X-Another-Header');
	});

	test('does not expose headers for preflight requests', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST'],
			allowedResponseHeaders: ['X-Custom-Header']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST'
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-expose-headers']).toBeUndefined();
	});

	test('handles array headers correctly - uses first value', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: ['https://example.com', 'https://other.com']
		};
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext) ;

		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('handles empty request headers list in preflight', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST'],
			allowedRequestHeaders: ['Content-Type']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST'
			// No access-control-request-headers header
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext) ;

		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-headers']).toBe('Content-Type');
	});

	test('method validation is case-sensitive - blocks lowercase methods', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('Method not allowed', 405));

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'post' // lowercase should be rejected
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(405);
		expect(result.body).toContain('CORS Error: method not allowed');
		expect(result.headers['access-control-allow-methods']).toBeUndefined();
	});

	test('header validation is case-insensitive - allows different casing', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST'],
			allowedRequestHeaders: ['Content-Type', 'Authorization']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST',
			'access-control-request-headers': 'content-type,AUTHORIZATION' // different casing
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
	});

	test('header validation blocks truly invalid headers case-insensitively', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['POST'],
			allowedRequestHeaders: ['Content-Type']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('Invalid headers', 400));

		const headers = {
			origin: 'https://example.com',
			'access-control-request-method': 'POST',
			'access-control-request-headers': 'X-Custom-Header' // not in allowed list
		};

		const result = await middleware.call({}, 'OPTIONS', '/', {}, headers, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.body).toContain('CORS Error: header not allowed');
		expect(result.headers['access-control-allow-headers']).toBeUndefined();
	});

	test('optimizes simple GET request - skips full validation', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			allowedMethods: ['POST', 'PUT'], // Intentionally don't include GET
			allowedRequestHeaders: ['x-custom-header'], // Intentionally restrictive
			allowedResponseHeaders: ['x-exposed']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: 'https://example.com',
			accept: 'text/html' // Safe header
		};
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
		expect(result.headers['access-control-expose-headers']).toBe('x-exposed');
		expect(result.headers['vary']).toBe('Origin');
	});

	test('optimizes simple POST request with form data - skips full validation', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			allowedMethods: ['PUT'], // Intentionally don't include POST
			allowedRequestHeaders: ['x-custom-header'] // Intentionally restrictive
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: 'https://example.com',
			'content-type': 'application/x-www-form-urlencoded'
		};
		const result = await middleware.call({}, 'POST', '/', {}, headers, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('does not optimize non-simple request with custom headers', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			allowedMethods: ['GET'],
			allowedRequestHeaders: ['x-custom-header']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: 'https://example.com',
			'x-custom-header': 'test' // Non-simple header
		};
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext);

		// Should go through full validation, which would allow this since it's in allowedRequestHeaders
		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('does not optimize PUT request - uses full validation', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			allowedMethods: ['GET'], // Don't allow PUT
			allowedRequestHeaders: []
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: 'https://example.com',
			accept: 'text/html'
		};
		const result = await middleware.call({}, 'PUT', '/', {}, headers, mockNext);

		// PUT is not a simple method, so it goes through full validation but still gets CORS headers
		// since it's not a preflight request - actual method blocking happens at the server level
		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('can disable CORS error responses with returnCorsErrors: false', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			returnCorsErrors: false
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://malicious.com' };
		const result = await middleware.call({}, 'GET', '/', {}, headers, mockNext);

		// With returnCorsErrors: false, should call next() like the old behavior
		expect(mockNext).toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.body).toBe('OK');
		expect(result.headers['access-control-allow-origin']).toBeUndefined();
	});
});