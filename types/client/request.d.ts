/**
 * request.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a Request object to offer an HTTP request library with a method signature that matches
 * the roads.request method
 */
import { IncomingHeaders } from '../core/road';
import Response from '../core/response';
/**
 * This class is a helper with making HTTP requests that look like roads requests.
 * The function signature matches the roads "request" method to allow the details of a request to be abstracted
 * away from the client. Sometimes the request may route internally, sometimes it may be an HTTP request.
 *
 * @todo tests
 */
export default class Request {
    protected _secure: boolean;
    protected _host: string;
    protected _port: number;
    /**
     * @todo: port should just be part of the host
     *
     * @param {boolean} secure - Whether or not this request should use HTTPS
     * @param {string} host - The hostname of all requests made by this function
     * @param {number} port - The post of all requests made by this function
     */
    constructor(secure: boolean, host: string, port: number);
    /**
     * Perform the HTTP request
     *
     * @param {string} method - HTTP Request method
     * @param {string} path - HTTP Request path
     * @param {string} [body] - The request body. If an object is provided, the body will be turned to JSON,
     * 		and the appropriate content header set
     * @param {object} [headers] - HTTP Request headers
     * @returns {Promise} The promise will resolve with an object with three properties. The response headers,
     * 		response status and the response body. If the response content-type is "application/json" the body
     * 		will be an object, otherwise it will resolve to a string
     */
    request(method: string, path: string, body?: string, headers?: IncomingHeaders): Promise<Response>;
}
