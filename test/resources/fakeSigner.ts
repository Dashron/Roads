import { createHmac } from 'node:crypto';

/**
 * A stand-in for a real signing library (such as jsonwebtoken) for use in tests.
 */
const SECRET = 'test-secret';

function buildSignature (data: string): string {
	return createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function sign (payload: Record<string, unknown>): string {
	const data = Buffer.from(JSON.stringify(payload)).toString('base64url');

	return `${data}.${buildSignature(data)}`;
}

export function verify (token: string): unknown {
	const [data, signature] = token.split('.');

	if (!data || !signature || signature !== buildSignature(data)) {
		throw new Error('invalid signature');
	}

	return JSON.parse(Buffer.from(data, 'base64url').toString());
}

/**
 * Seconds since the epoch, offset by the provided number of seconds
 */
export function secondsFromNow (seconds: number): number {
	return Math.floor(Date.now() / 1000) + seconds;
}
