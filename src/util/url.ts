/**
 * url.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Splits request urls into their parts using only built-in APIs
 */

export interface ParsedURL {
	/**
	 * The path, without the query string or hash. It is not percent-decoded.
	 */
	pathname: string,
	/**
	 * The query string including the leading `?`, or an empty string
	 */
	search: string,
	/**
	 * The hash including the leading `#`, or an empty string
	 */
	hash: string,
	/**
	 * The decoded query string values. If a key is repeated, this holds the first value. Use `searchParams`
	 * 	to read every value. The object has no prototype, so use `Object.hasOwn` to check for keys.
	 */
	query: Record<string, string | undefined>,
	/**
	 * The query string as a URLSearchParams object
	 */
	searchParams: URLSearchParams
}

// e.g. "https://example.com". Request urls are usually just a path, but some servers pass the full url.
const URL_SCHEME_AND_HOST = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\/[^/?#]*/;

/**
 * Removes the scheme and host from an absolute url, leaving the path, query string and hash.
 * 	Any other url is returned as-is.
 *
 * Dot segments are left in place, the same as a url that was only a path. `new URL` would collapse them,
 * 	so `http://a.com/x/../admin` could reach a route that `/x/../admin` can't.
 *
 * @param url - A request url
 * @returns The url without its scheme and host
 */
export function toOriginForm(url: string): string {
	const schemeAndHost = URL_SCHEME_AND_HOST.exec(url);

	if (!schemeAndHost) {
		return url;
	}

	const rest = url.substring(schemeAndHost[0].length);
	return rest.startsWith('/') ? rest : `/${rest}`;
}

/**
 * Splits a request url into its path, query string and hash.
 *
 * Paths are split by hand instead of with `new URL`, because `new URL('//evil.com/a', base)` would treat
 * 	`evil.com` as the host and route the request as `/a`.
 *
 * @param url - A request url, usually just the path (e.g. `/users?page=2`)
 * @returns The parts of the url
 */
export function parseUrl(url: string): ParsedURL {
	const originFormUrl = toOriginForm(url);

	const hashIndex = originFormUrl.indexOf('#');
	let hash = hashIndex === -1 ? '' : originFormUrl.substring(hashIndex);
	const withoutHash = hashIndex === -1 ? originFormUrl : originFormUrl.substring(0, hashIndex);

	const searchIndex = withoutHash.indexOf('?');
	let search = searchIndex === -1 ? '' : withoutHash.substring(searchIndex);
	const pathname = searchIndex === -1 ? withoutHash : withoutHash.substring(0, searchIndex);

	// A bare "?" or "#" carries no information, the same as the URL class
	if (search === '?') {
		search = '';
	}

	if (hash === '#') {
		hash = '';
	}

	const searchParams = new URLSearchParams(search);
	const query: Record<string, string | undefined> = Object.create(null);

	for (const [key, value] of searchParams) {
		if (!Object.hasOwn(query, key)) {
			query[key] = value;
		}
	}

	return { pathname, search, hash, query, searchParams };
}
