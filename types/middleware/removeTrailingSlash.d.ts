/**
 * removeTrailingSlash.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to remove trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 *
 * When used, any url that ends with a trailing slash will immediately return a response
 * 	object redirecting the client to the same url without the trailing slash (302 redirect
 * 	with Location: [url_without_slash])
 */
import { Context, Middleware } from '../core/road';
/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
export declare const middleware: Middleware<Context>;
