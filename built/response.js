"use strict";
/**
 * response.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Provides a simple class to manage HTTP responses
 */
export class Response {
    /**
     * Creates a new Response object.
     *
     * @param {string} body - Your response body
     * @param {number} [status] - Your response status
     * @param {object} [headers] - Your response headers
     */
    constructor(body, status, headers) {
        this.body = body;
        this.status = status || 200;
        this.headers = headers || {};
    }
}
;
/**
 * Wraps the return value of a promise in a Response object to ensure consistency.
 *
 * @param {Promise} promise
 * @returns {Promise}
 */
export function wrap(promise) {
    return promise.then((route_response) => {
        if (typeof (route_response) !== "object" || !(route_response instanceof Response)) {
            // we should always return a response object
            route_response = new Response(route_response);
        }
        return route_response;
    });
}
