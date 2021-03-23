/**
 * response.js
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Provides a simple class to manage HTTP responses
 */
export interface OutgoingHeaders {
    [x: string]: string | Array<string> | undefined;
}
export default class Response {
    status: number;
    body: string;
    headers: OutgoingHeaders;
    /**
     * Creates a new Response object.
     *
     * @param {string} body - Your response body
     * @param {number} [status] - Your response status
     * @param {object} [headers] - Your response headers
     */
    constructor(body: string, status?: number, headers?: OutgoingHeaders);
}
export interface ResponseConstructor {
    new (body: string, status?: number, headers?: OutgoingHeaders): Response;
}
/**
 * Wraps the return value of a promise in a Response object to ensure consistency.
 *
 * @param {Promise<Response | string>} promise
 * @returns {Promise<unknown>}
 */
export declare function wrap(promise: Promise<Response | string>): Promise<Response>;
