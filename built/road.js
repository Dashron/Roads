"use strict";
/**
 * road.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the core Road class
 */
import * as response_lib from './response';
/**
 * See roadsjs.com for full docs.
 *
 * @name Road
 */
export default class Road {
    /**
     * Road Constructor
     *
     * Creates a new Road class. This function does not accept any parameters!
     */
    constructor() {
        this._request_chain = [];
    }
    /**
     * Add one or many custom functions to be executed along with every request.
     *
     * The functions added will be executed in the order they were added. Each handler must execute the "next" parameter if it wants to continue executing the chain.
     *
     * name | type                                                                  | required | description
     * -----|-----------------------------------------------------------------------|----------|---------------
     * fn   | Function(*string* method, *string* url,*string* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the object.
     *
     * This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters :
     *
     * Callback
     * **function (*string* method, *string* url, *string* body, *Object* headers, *Function* next)**
     *
     * name     | type                               | description
     * --------|------------------------------------|---------------
     * method  | string                             | The HTTP method that was provided to the request
     * url     | string                             | The URL that was provided to the request
     * body    | string                             | The body that was provided to the request
     * headers | object                             | The headers that were provided to the request
     * next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.
     *
     * If the callback does not return a [response](#roadsresponse) object, it will be wrapped in a [response](#roadsresponse) object with the default status code of 200.
     *
     * @param {Function} fn - A callback (function or async function) that will be executed every time a request is made.
     * @returns {Road} this road object. Useful for chaining use statements.
     */
    use(fn) {
        // Currently we pass everything through the coroutine wrapper to be save. Let that library decide what does and does not actually need to be wrapped
        this._request_chain.push(fn);
        return this;
    }
    /**
     *
     * Execute the resource method associated with the request parameters.
     *
     * This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.
     *
     * @param {string} method - HTTP request method
     * @param {string} url - HTTP request url
     * @param {string} [body] - HTTP request body
     * @param {object} [headers] - HTTP request headers
     * @returns {Promise} this promise will resolve to a Response object
     */
    request(method, url, body, headers) {
        return response_lib.wrap(this._buildNext(method, url, body, headers, {
            request: this.request.bind(this),
            Response: response_lib.Response
        })());
    }
    /**
     * Turn an HTTP request into an executable function with a useful request context. Will also incorporate the entire
     * request handler chain
     *
     * @param {string} request_method - HTTP request method
     * @param {string} path - HTTP request path
     * @param {string} request_body - HTTP request body
     * @param {object} request_headers - HTTP request headers
     * @param {Context} context - Request context
     * @returns {NextMiddleware} A function that will start (or continue) the request chain
     */
    _buildNext(request_method, path, request_body, request_headers, context) {
        let _self;
        let progress;
        let route_fn;
        let next;
        _self = this;
        progress = 0;
        next = () => {
            if (_self._request_chain.length && _self._request_chain[progress]) {
                route_fn = _self._request_chain[progress].bind(context, request_method, path, request_body, request_headers, () => {
                    progress += 1;
                    return next();
                });
            }
            else {
                // If next is called and there is nothing next, we should still return a promise, it just shouldn't do anything
                route_fn = () => {
                    console.log('Request: ' + request_method + ' ' + path + ' has reached the end of the request chain. Ideally this would never happen. Make sure to stop calling next() when you\'ve built your full response');
                    return Promise.resolve(new response_lib.Response('', 500));
                };
            }
            return _self._executeRoute(route_fn);
        };
        return next;
    }
    /**
     * Execute a resource method, and ensure that a promise is always returned
     *
     * @param {Function} route
     * @returns {Promise<Response>}
     */
    _executeRoute(route) {
        let result;
        // Handle errors properly
        try {
            result = route();
        }
        catch (e) {
            // this should never be reached if route is a coroutine. This will only be reached if the route is function that throws an error.
            return new Promise((resolve, reject) => {
                reject(e);
            });
        }
        // If the result isn't a promise already, make it one for consistency
        if (!(result instanceof Promise)) {
            result = Promise.resolve(result);
        }
        return result;
    }
}
