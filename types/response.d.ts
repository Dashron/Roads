/**
 * response.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Provides a simple class to manage HTTP responses
 */
export default class Response {
    status: number;
    body: string;
    headers: {
        [x: string]: any;
    };
    /**
     * Creates a new Response object.
     *
     * @param {string} body - Your response body
     * @param {number} [status] - Your response status
     * @param {object} [headers] - Your response headers
     */
    constructor(body: string, status?: number, headers?: object);
}
export interface ResponseConstructor {
    new (body: string, status?: number, headers?: object): Response;
}
/**
 * Wraps the return value of a promise in a Response object to ensure consistency.
 *
 * @param {Promise} promise
 * @returns {Promise}
 */
export declare function wrap(promise: Promise<any>): Promise<any>;
