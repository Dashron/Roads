import { Middleware } from "../road";
/**
 * cors.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This exposes a function that helps you manage CORS in your roads service
 */
/**
 * Apply proper cors headers
 *
 * @param {object} [options] - A collection of different cors settings.
 * @param {object} [options.validOrigins] - An array of origin urls that can send requests to this API
 * @param {object} [options.supportsCredentials] - A boolean, true if you want this endpoint to receive cookies
 * @param {object} [options.responseHeaders] - An array of valid HTTP response headers
 * @param {object} [options.requestHeaders] - An array of valid HTTP request headers
 * @param {object} [options.validMethods] - An array of valid HTTP methods
 * @param {object} [options.cacheMaxAge] - The maximum age to cache the cors information
 *
 * @return {function} The middleware to bind to your road
 */
export declare function cors(options: {
    validOrigins?: string[];
    supportsCredentials?: boolean;
    responseHeaders?: {
        [x: string]: any;
    };
    requestHeaders?: {
        [x: string]: any;
    };
    validMethods?: string[];
    cacheMaxAge?: number;
}): Middleware;
