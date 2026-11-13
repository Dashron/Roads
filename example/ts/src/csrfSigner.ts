/**
 * csrfSigner.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of the sign and verify functions that the roads CSRF middleware needs.
 * Roads does not include any signing logic, so the secret and the crypto code only ever exist on the server.
 * This file must never be imported by client.ts.
 *
 * In the real world you might use a library like jsonwebtoken here instead.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// In the real world this must come from your configuration, so it is the same on every server and after
//		a restart. The random fallback keeps this example from shipping a hard coded secret
const secret = process.env.CSRF_SECRET ?? randomBytes(32).toString('hex');

function buildSignature(data: string): Buffer {
	return createHmac('sha256', secret).update(data).digest();
}

/**
 * Turns the token data into a signed string
 *
 * @param {object} payload - The data to store in the token
 */
export function sign(payload: Record<string, unknown>): string {
	const data = Buffer.from(JSON.stringify(payload)).toString('base64url');

	return `${data}.${buildSignature(data).toString('base64url')}`;
}

/**
 * Checks the signature of a token and returns the data that was passed to sign.
 * This throws if the token was not signed with our secret.
 *
 * @param {string} token - A token created by the sign function
 */
export function verify(token: string): unknown {
	const [data, signature] = token.split('.');

	if (!data || !signature) {
		throw new Error('Malformed token');
	}

	const expected = buildSignature(data);
	const actual = Buffer.from(signature, 'base64url');

	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
		throw new Error('Invalid signature');
	}

	return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
}
