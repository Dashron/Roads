/**
 * killSlash.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to kill trailing slashes in HTTP requests.
 * This is done by redirecting the end user to the same route without the trailing slash.
 */
import { Context, Middleware } from '../core/road';
/**
 * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
 */
export declare const killSlashMiddleware: Middleware<Context>;
