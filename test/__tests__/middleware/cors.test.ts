import { build } from '../../../src/middleware/cors.js';
import Response from '../../../src/core/response.js';
import { describe, expect, test, vi } from 'vitest';

/**
 * Helper function to ensure middleware returns a Response object
 * Throws an error if the result is not a Response object
 */
async function ensureResponse(middlewarePromise: Promise<Response | string> | Response | string): Promise<Response> {
	const result = await middlewarePromise;
	if (!(result instanceof Response)) {
		throw new Error(`Expected Response object but got: ${typeof result}`);
	}
	return result;
}

describe('CORS Comprehensive Tests', () => {
	test('builds cors middleware function', () => {
		const middleware = build({});
		expect(middleware).toBeInstanceOf(Function);
	});

	test('handles requests without origin header - calls next without CORS headers', async () => {
		const middleware = build({});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', {}, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(result.headers['access-control-allow-origin']).toBe('*');
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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled(); // Should not call next for valid preflight
		expect(result).toBeInstanceOf(Response);
		expect(result.status).toBe(200);
		expect(result.body).toBe('');
		expect(result.headers['access-control-allow-origin']).toBe('*');
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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.body).toContain('CORS Error: header not allowed');
		expect(result.headers['access-control-allow-headers']).toBeUndefined();
	});

	test('adds credentials support when enabled', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			supportsCredentials: true
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(result.headers['access-control-max-age']).toBeUndefined();
	});

	test('exposes response headers for non-preflight requests', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedResponseHeaders: ['X-Custom-Header', 'X-Another-Header']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(result.headers['access-control-expose-headers']).toBeUndefined();
	});

	test('handles array headers correctly - uses first value', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: ['https://example.com', 'https://other.com']
		};
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'POST', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', headers, mockNext));

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
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		// With returnCorsErrors: false, should call next() like the old behavior
		expect(mockNext).toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.body).toBe('OK');
		expect(result.headers['access-control-allow-origin']).toBeUndefined();
	});

	test('handles middleware returning string instead of Response - simple request', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		// Mock next() to return a string instead of a Response
		const mockNext = vi.fn().mockResolvedValue('Hello World');

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result).toBeInstanceOf(Response);
		expect(result.body).toBe('Hello World');
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	test('handles middleware returning string instead of Response - normal flow', async () => {
		const middleware = build({
			validOrigins: ['https://example.com'],
			allowedMethods: ['GET', 'POST'],
			allowedRequestHeaders: ['content-type']
		});
		// Mock next() to return a string instead of a Response
		const mockNext = vi.fn().mockResolvedValue('Hello World');

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'POST', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result).toBeInstanceOf(Response);
		expect(result.body).toBe('Hello World');
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com');
	});

	// "null" origin tests - for sandboxed contexts (file://, data:, sandboxed iframes)
	test('handles "null" origin from sandboxed context - accepts when in allowlist', async () => {
		const middleware = build({
			validOrigins: ['null', 'https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'null' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('null');
		expect(result.headers['vary']).toBe('Origin');
	});

	test('handles "null" origin with wildcard - accepts', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'null' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('*');
	});

	test('blocks "null" origin when not in allowlist', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'null' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.body).toContain('CORS Error: origin not allowed');
	});

	test('handles "null" origin in preflight request', async () => {
		const middleware = build({
			validOrigins: ['null'],
			allowedMethods: ['POST'],
			allowedRequestHeaders: ['Content-Type']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: 'null',
			'access-control-request-method': 'POST',
			'access-control-request-headers': 'Content-Type'
		};

		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-origin']).toBe('null');
		expect(result.headers['access-control-allow-methods']).toBe('POST');
	});

	// Invalid origin format tests
	test('rejects invalid origin format - not a URL', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'not-a-valid-origin' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(400);
		expect(result.body).toContain('CORS Error: invalid origin format');
	});

	test('rejects invalid origin format - origin with path', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com/some/path' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(400);
		expect(result.body).toContain('CORS Error: invalid origin format');
	});

	test('rejects invalid origin format - origin with query string', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com?query=param' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(400);
		expect(result.body).toContain('CORS Error: invalid origin format');
	});

	test('rejects invalid origin format - origin with fragment', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com#fragment' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(400);
		expect(result.body).toContain('CORS Error: invalid origin format');
	});

	test('accepts valid origin with port', async () => {
		const middleware = build({
			validOrigins: ['https://example.com:8080']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com:8080' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('https://example.com:8080');
	});
});

/**
 * Collects every Vary field name on the response, lowercased, regardless of how the header name is cased
 */
function varyValues(response: Response): string[] {
	const values: string[] = [];
	for (const key in response.headers) {
		if (key.toLowerCase() === 'vary') {
			const value = response.headers[key];
			const list = Array.isArray(value) ? value : [value ?? ''];
			for (const item of list) {
				values.push(...item.split(',').map(field => field.trim().toLowerCase()).filter(field => field));
			}
		}
	}
	return values;
}

/**
 * Finds every header name on the response that is some casing of "vary"
 */
function varyKeys(response: Response): string[] {
	return Object.keys(response.headers).filter(key => key.toLowerCase() === 'vary');
}

describe('CORS wildcard origin with credentials', () => {
	test('build throws when wildcard origin is combined with credentials', () => {
		expect(() => build({
			validOrigins: ['*'],
			supportsCredentials: true
		})).toThrow();
	});

	test('build throws when wildcard string is combined with credentials', () => {
		expect(() => build({
			validOrigins: '*',
			supportsCredentials: true
		})).toThrow();
	});

	test('build throws when wildcard is mixed with other origins - wildcard first', () => {
		expect(() => build({
			validOrigins: ['*', 'https://example.com']
		})).toThrow();
	});

	test('build throws when wildcard is mixed with other origins - wildcard last', () => {
		expect(() => build({
			validOrigins: ['https://example.com', '*']
		})).toThrow();
	});

	test('wildcard string allows all origins and sends a literal *', async () => {
		const middleware = build({
			validOrigins: '*'
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://any-domain.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('*');
		expect(varyValues(result)).toEqual([]);
	});

	test('build does not throw when credentials are combined with an explicit allowlist', () => {
		expect(() => build({
			validOrigins: ['https://example.com'],
			supportsCredentials: true
		})).not.toThrow();
	});

	test('wildcard without credentials sends a literal * - simple request', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://any-domain.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('*');
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('wildcard without credentials sends a literal * - non-simple request', async () => {
		const middleware = build({
			validOrigins: ['*']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://any-domain.com' };
		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', headers, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('*');
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('wildcard without credentials sends a literal * - preflight', async () => {
		const middleware = build({
			validOrigins: ['*'],
			allowedMethods: ['GET', 'PUT']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = {
			origin: 'https://any-domain.com',
			'access-control-request-method': 'PUT'
		};
		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe('*');
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});
});

describe('CORS preserves an existing Vary header', () => {
	test('appends Origin to an existing vary header - simple request', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: 'Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(expect.arrayContaining(['accept-encoding', 'origin']));
		expect(varyKeys(result)).toHaveLength(1);
	});

	test('appends Origin to an existing vary header - non-simple request', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: 'Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(expect.arrayContaining(['accept-encoding', 'origin']));
		expect(varyKeys(result)).toHaveLength(1);
	});

	test('appends Origin to an existing Vary header with different casing - simple request', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { Vary: 'Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(expect.arrayContaining(['accept-encoding', 'origin']));
		// Two differently cased keys would overwrite each other when written to the node response
		expect(varyKeys(result)).toHaveLength(1);
	});

	test('appends Origin to an existing Vary header with different casing - non-simple request', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { Vary: 'Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(expect.arrayContaining(['accept-encoding', 'origin']));
		expect(varyKeys(result)).toHaveLength(1);
	});

	test('keeps multiple existing vary values', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: 'Accept-Encoding, Accept-Language' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(expect.arrayContaining(['accept-encoding', 'accept-language', 'origin']));
	});

	test('does not duplicate Origin when the existing vary header already lists it', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: 'Origin, Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(varyValues(result).sort()).toEqual(['accept-encoding', 'origin']);
	});

	test('merges an existing vary header given as an array', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {
			vary: ['Accept-Encoding', 'Accept-Language']
		}));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(varyValues(result).sort()).toEqual(['accept-encoding', 'accept-language', 'origin']);
		expect(varyKeys(result)).toHaveLength(1);
	});

	test('leaves an existing vary: * header alone', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: '*' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(result.headers['vary']).toBe('*');
	});

	test('does not overwrite the route vary header when all origins are allowed', async () => {
		const middleware = build({
			validOrigins: '*'
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, { vary: 'Accept-Encoding' }));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', headers, mockNext));

		expect(result.headers['vary']).toBe('Accept-Encoding');
	});

	test('still sets vary to Origin when the route sets no vary header', async () => {
		const middleware = build({
			validOrigins: ['https://example.com']
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const headers = { origin: 'https://example.com' };
		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', headers, mockNext));

		expect(varyValues(result)).toEqual(['origin']);
	});
});


describe('CORS credentials for specific origins', () => {
	const trusted = 'https://app.example.com';
	const other = 'https://third-party.example.org';

	test('wildcard with a credentials list - listed origin gets credentials on a simple request', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: [trusted]
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: trusted }, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe(trusted);
		expect(result.headers['access-control-allow-credentials']).toBe('true');
		expect(varyValues(result)).toEqual(['origin']);
	});

	test('wildcard with a credentials list - listed origin gets credentials on a non-simple request', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: [trusted]
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'PUT', '/', '', { origin: trusted }, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.headers['access-control-allow-origin']).toBe(trusted);
		expect(result.headers['access-control-allow-credentials']).toBe('true');
		expect(varyValues(result)).toEqual(['origin']);
	});

	test('wildcard with a credentials list - listed origin gets credentials on preflight', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: [trusted],
			allowedMethods: ['GET', 'PUT']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: trusted,
			'access-control-request-method': 'PUT'
		};
		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-origin']).toBe(trusted);
		expect(result.headers['access-control-allow-credentials']).toBe('true');
		expect(varyValues(result)).toEqual(['origin']);
	});

	test('wildcard with a credentials list - other origins are allowed without credentials', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: [trusted]
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: other }, mockNext));

		expect(mockNext).toHaveBeenCalled();
		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-origin']).toBe(other);
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
		// The response now depends on the origin, so caches need to know even for origins without credentials
		expect(varyValues(result)).toEqual(['origin']);
	});

	test('wildcard with a credentials list - other origins get no credentials on preflight', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: [trusted],
			allowedMethods: ['GET', 'PUT']
		});
		const mockNext = vi.fn();

		const headers = {
			origin: other,
			'access-control-request-method': 'PUT'
		};
		const result = await ensureResponse(middleware.call({}, 'OPTIONS', '/', '', headers, mockNext));

		expect(result.status).toBe(200);
		expect(result.headers['access-control-allow-origin']).toBe(other);
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
		expect(varyValues(result)).toEqual(['origin']);
	});

	test('wildcard with a credentials function - the function decides per origin', async () => {
		const allowCredentials = vi.fn((origin: string) => origin.endsWith('.example.com'));
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: allowCredentials
		});
		// Each request needs its own response, the middleware adds its headers to the object it is given
		const mockNext = vi.fn().mockImplementation(() => Promise.resolve(new Response('OK', 200, {})));

		const trustedResult = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: trusted }, mockNext));
		const otherResult = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: other }, mockNext));

		expect(allowCredentials).toHaveBeenCalledWith(trusted);
		expect(allowCredentials).toHaveBeenCalledWith(other);
		expect(trustedResult.headers['access-control-allow-origin']).toBe(trusted);
		expect(trustedResult.headers['access-control-allow-credentials']).toBe('true');
		expect(otherResult.headers['access-control-allow-origin']).toBe(other);
		expect(otherResult.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('allowlist with a credentials list - only origins in both lists get credentials', async () => {
		const middleware = build({
			validOrigins: [trusted, other],
			supportsCredentials: [trusted]
		});
		// Each request needs its own response, the middleware adds its headers to the object it is given
		const mockNext = vi.fn().mockImplementation(() => Promise.resolve(new Response('OK', 200, {})));

		const trustedResult = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: trusted }, mockNext));
		const otherResult = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: other }, mockNext));

		expect(trustedResult.headers['access-control-allow-origin']).toBe(trusted);
		expect(trustedResult.headers['access-control-allow-credentials']).toBe('true');
		expect(otherResult.headers['access-control-allow-origin']).toBe(other);
		expect(otherResult.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('allowlist with a credentials list - an origin missing from validOrigins is still blocked', async () => {
		const middleware = build({
			validOrigins: [other],
			supportsCredentials: [trusted]
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: trusted }, mockNext));

		expect(mockNext).not.toHaveBeenCalled();
		expect(result.status).toBe(403);
		expect(result.headers['access-control-allow-origin']).toBeUndefined();
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
	});

	test('wildcard with an empty credentials list behaves like no credentials', async () => {
		const middleware = build({
			validOrigins: '*',
			supportsCredentials: []
		});
		const mockNext = vi.fn().mockResolvedValue(new Response('OK', 200, {}));

		const result = await ensureResponse(middleware.call({}, 'GET', '/', '', { origin: other }, mockNext));

		expect(result.headers['access-control-allow-origin']).toBe('*');
		expect(result.headers['access-control-allow-credentials']).toBeUndefined();
		expect(varyValues(result)).toEqual([]);
	});

	test('build throws when the credentials list contains a wildcard', () => {
		expect(() => build({
			validOrigins: '*',
			supportsCredentials: ['*']
		})).toThrow();

		expect(() => build({
			validOrigins: [trusted],
			supportsCredentials: [trusted, '*']
		})).toThrow();
	});
});
