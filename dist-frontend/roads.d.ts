/// <reference types="node" />
declare module "core/response" {
    /**
     * response.ts
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
    export function wrap(promise: Promise<Response | string>): Promise<Response>;
}
declare module "core/road" {
    /**
     * road.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes the core Road class
     */
    import * as response_lib from "core/response";
    import Response from "core/response";
    export interface IncomingHeaders {
        [x: string]: string | Array<string> | undefined;
    }
    export interface Middleware<MiddlewareContext extends Context> {
        (this: MiddlewareContext, method: string, path: string, body: string, headers: IncomingHeaders, next: NextCallback): Promise<Response | string> | Response | string;
    }
    export interface NextCallback {
        (): Promise<Response | string>;
    }
    export interface Context {
        request: Road['request'];
        Response: response_lib.ResponseConstructor;
        [x: string]: unknown;
    }
    /**
     * See roadsjs.com for full docs.
     *
     * @name Road
     */
    export default class Road {
        protected _request_chain: Middleware<Context>[];
        /**
         * Road Constructor
         *
         * Creates a new Road class. This function does not accept any parameters!
         */
        constructor();
        /**
         * Add one or many custom functions to be executed along with every request.
         *
         * The functions added will be executed in the order they were added. Each handler must
         * 		execute the "next" parameter if it wants to continue executing the chain.
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
        use(fn: Middleware<Context>): Road;
        /**
         *
         * Execute the resource method associated with the request parameters.
         *
         * This function will locate the appropriate [resource method](#resource-method) for the
         * 		provided HTTP Method and URL, execute it and return a
         * 		[thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A).
         * 		The thenable will always resolve to a [Response](#roadsresponse) object.
         *
         * @param {string} method - HTTP request method
         * @param {string} url - HTTP request url
         * @param {string} [body] - HTTP request body
         * @param {object} [headers] - HTTP request headers
         * @returns {Promise} this promise will resolve to a Response object
         */
        request(method: string, url: string, body?: string, headers?: IncomingHeaders): Promise<Response>;
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
        protected _buildNext(request_method: string, path: string, request_body: string | undefined, request_headers: IncomingHeaders | undefined, context: Context): NextCallback;
    }
}
declare module "middleware/storeVals" {
    /**
     * storeVals.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a single middleware function to help manage the page title. This is best used alongside the PJAX helper
     */
    import { Context, Middleware } from "core/road";
    export const TITLE_KEY = "pjax-page-title";
    export interface StoreValsContext extends Context {
        storeVal: (field: string, val: unknown) => void;
        getVal: (field: string) => unknown;
    }
    /**
     * Adds two simple functions to get and set a page title on the request context. This is very helpful for
     * 		isomorphic js, since on the client, page titles aren't part of the rendered view data.
     *  todo: Should we ask for the valid key:data type pairings be sent via a generic to storevalscontext?
     * 		This would be nice for stricter typing
     */
    const storeVals: Middleware<StoreValsContext>;
    export default storeVals;
}
declare module "client/pjax" {
    /**
     * pjax.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * This file exposes a PJAX class to help with client side rendering
     */
    import Road from "core/road";
    import Response from "core/response";
    /**
      * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
      * by progressively turning standard HTML links into AJAX requests for portions of a web page.
      *
      * @todo Form support
      * @todo tests
      */
    export default class RoadsPjax {
        protected _road: Road;
        protected _page_title?: string;
        protected _window: Window;
        protected _container_element: HTMLElement;
        /**
         * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
         *
         * @param {Road} road - The road that will turn your pjax requests into HTML
         * @param {HTMLElement} container_element - The element that will be filled with your roads output
         * @param {Window} window - The pages window object to help set page title and other items
         */
        constructor(road: Road, container_element: HTMLElement, window: Window);
        /**
         * Adds middleware to the assigned road which will adds storeVal and getVal to the PJAX
         * 		object (as opposed to the request object like the setTitle middlweare does).
         *
         * This allows you to easily update the page title.
         *
         * @returns {RoadsPjax} this, useful for chaining
         */
        addTitleMiddleware(): RoadsPjax;
        /**
         * Hooks up the PJAX functionality to the information provided via the constructor.
         */
        register(): void;
        /**
         *
         * @param {HTMLAnchorElement} element
         */
        registerAdditionalElement(element: HTMLAnchorElement): void;
        /**
         * The response from the roads request
         *
         * @param {Response} response_object
         */
        render(response_object: Response): void;
        /**
         * Handles all click events, and directs
         * @param {MouseEvent} event
         */
        protected _pjaxEventMonitor(event: MouseEvent): void;
        /**
         * Follows the link and renders the UI
         *
         * @param  {HTMLAnchorElement} link
         */
        protected _roadsLinkEvent(link: HTMLAnchorElement): void;
        /**
         * Submits the form and re-renders the UI
         *
         * @param {HTMLFormElement} form
         */
        protected _roadsFormEvent(form: HTMLFormElement): void;
    }
}
declare module "client/request" {
    import { IncomingHeaders } from "core/road";
    import Response from "core/response";
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
}
declare module "middleware/applyToContext" {
    /**
     * applyToContext.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a single function to be used with roads middleware. It makes it easy to assign
     * static values to a roads context.
     */
    import { Context, Middleware } from "core/road";
    /**
     * Very simple middleware to apply a single value to the request context.
     *
     * TODO: Get better typing on this. I think we need to wait for https://github.com/Microsoft/TypeScript/pull/26797.
     *		In the meanwhile anyone who uses this function should include key: Middleware<Context> to
     *		their final request context type
     *
     * @param {string} key - The key that should store the value on the request context.
     * @param {any} val - The value to apply to the request context.
     * @returns {Middleware} The middleware function to apply to the road.use(fn) method.
     */
    export default function applyToContext(key: string, val: unknown): Middleware<Context>;
}
declare module "middleware/cookieMiddleware" {
    /**
     * cookie.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a single middleware function to help with cookies
     */
    /**
     * Middleware to make it easier for roads to work with cookies.
     *
     * Any parsed cookies from the request header are added as key value pairs on the
     * request context under the "cookie" property.
     *
     * If you want to set new cookies, helper methods have been added onto the request context's
     * Response object. If you create a new Response object using new this.Response, it will receive
     * a `setCookie` method for updating cookies, and a `getCookieHeader` method for retrieval.
     *
     * The `setCookie` method uses the [cookie module[(https://github.com/jshttp/cookie). This module
     * accepts the following cookie options
     *
     * - path
     * - expires
     * - maxAge
     * - domain
     * - secure
     * - httpOnly
     * - firstPartyOnly
     *
     */
    import * as cookie from 'cookie';
    import { Context, Middleware } from "core/road";
    export interface CookieMiddleware extends Context {
        setCookie: (name: string, value?: string, options?: cookie.CookieSerializeOptions) => void;
        getCookies: () => {
            [x: string]: string;
        };
    }
    const cookieMiddleware: Middleware<CookieMiddleware>;
    export const clientCookieMiddleware: (document: Document) => Middleware<CookieMiddleware>;
    export default cookieMiddleware;
}
declare module "middleware/cors" {
    /**
     * cors.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * This exposes a function that helps you manage CORS in your roads service
     */
    import { Context, Middleware } from "core/road";
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
    export default function cors(options: {
        validOrigins?: string[];
        supportsCredentials?: boolean;
        responseHeaders?: Array<string>;
        requestHeaders?: Array<string>;
        validMethods?: Array<string>;
        cacheMaxAge?: number;
        logger?: {
            log: (ley: string, data?: unknown) => void;
        };
    }): Middleware<Context>;
}
declare module "middleware/killSlash" {
    /**
     * killSlash.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a single middleware function to kill trailing slashes in HTTP requests.
     * This is done by redirecting the end user to the same route without the trailing slash.
     */
    import { Context, Middleware } from "core/road";
    /**
     * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
     */
    const killSlash: Middleware<Context>;
    export default killSlash;
}
declare module "middleware/parseBody" {
    /**
     * parseBody.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a single middleware function to help parse request bodies
     */
    import { Context, Middleware } from "core/road";
    /**
     * Attempts the parse the request body into a useful object
     */
    const parseBody: Middleware<Context>;
    export default parseBody;
}
declare module "middleware/reroute" {
    /**
     * reroute.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes a method that allows you to bind additional roads to a road context. This allows you to manage multiple
     * client side or server side road objects at once
     */
    import { Context, Middleware } from "core/road";
    import Road from "core/road";
    /**
     * Applies a method to the request context that allows you to make requests into another roads object
     *
     * TODO: Get better typing on this. I think we need to wait for https://github.com/Microsoft/TypeScript/pull/26797.
     *     	In the meanwhile anyone who uses this function should include key: Middleware<Context> to
     * 		their final request context type
     *
     * @param {string} key - The name of the key in the request context that will store the roads request.
     * @param  {road} road - The roads object that you will interact with.
     * @return {function} The middleware function. This value should be passed to road.use(fn);
     */
    export default function (key: string, road: Road): Middleware<Context>;
}
declare module "middleware/simpleRouter" {
    /**
     * simpleRouter.ts
     * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
     * MIT Licensed
     *
     * Exposes the SimpleRouter class to be used with roads middleware.
     */
    import * as url_module from 'url';
    import { IncomingHeaders, NextCallback } from "core/road";
    import Road, { Context } from "core/road";
    import Response from "core/response";
    export interface Route {
        (this: Context, path: SimpleRouterURL, body: string, headers: IncomingHeaders, next: NextCallback): Promise<Response>;
    }
    interface RouteDetails {
        route: Route;
        path: string;
        method: string;
    }
    export interface SimpleRouterURL extends url_module.UrlWithParsedQuery {
        args?: {
            [x: string]: string | number;
        };
    }
    /**
     * This is a simple router middleware for roads.
     * You can assign functions to url paths, and those paths can have some very basic variable templating
     *
     * Templating is basic. Each URI is considered to be a series of "path parts" separated by slashes.
     * If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
     * If a path part starts with a $, it is considered to be an alphanumeric variabe.
     * 		All non-slash values will match this route.
     *
     * Any variables will be added to the route's request url object under the "args" object.
     *
     * e.g.
     * /users/#user_id will match /users/12345, not /users/abcde. If a request is made to /users/12345
     * 	 the route's requestUrl object will contain { args: {user_id: 12345}} along with all other url object values
     *
     * @name SimpleRouter
     */
    export default class SimpleRouter {
        protected _routes: RouteDetails[];
        /**
         * @param {Road} [road] - The road that will receive the SimpleRouter middleware
         */
        constructor(road?: Road);
        /**
         * Assigns the middleware to the provided road
         *
         * @param  {Road} road - The road that will receive the SimpleRouter middleware
         */
        applyMiddleware(road: Road): void;
        /**
         * Adds a route to this router. The route is a function that will match the standard roads request signature.
         * It will be associated with one HTTP method, and one or many HTTP paths
         *
         * @param {string} method - The HTTP method that will trigger the provided function
         * @param {(string|array)} paths - One or many URL paths that will trigger the provided function
         * @param {function} fn - The function containing all of your route logic
         */
        addRoute(method: string, paths: string | string[], fn: Route): void;
        /**
         * Add an entire file worth of routes.
         *
         * The file should be a node module that exposes an object.
         * Each key should be an HTTP path, each value should be an object.
         * In that object, each key should be an HTTP method, and the value should be your route function.
         *
         * @param {string} file_path - The file path
         * @param {string} [prefix] - A string that will help namespace this file. e.g. if you call this on a file
         * 		with a route of "/posts", and the prefix "/users", the route will be assigned to "/users/posts"
         */
        addRouteFile(file_path: string, prefix?: string): Promise<void>;
        /**
         * Slightly non-standard roads middleware to execute the functions in this router when requests are received by the road
         * The first method is the routes to ensure that we can properly use this router once we loose the "this" value
         * from the roads context
         *
         * @todo there might be a better way to do this
         */
        protected _middleware(routes: RouteDetails[], request_method: string, request_url: string, request_body: string, request_headers: IncomingHeaders, next: NextCallback): Promise<Response | string>;
    }
}
declare module "index" {
    export { default as Response } from "core/response";
    export { default as Road } from "core/road";
    export { default as RoadsPJAX } from "client/pjax";
    export { default as Request } from "client/request";
    export { default as applyToContextMiddleware } from "middleware/applyToContext";
    export { default as cookieMiddleware } from "middleware/cookieMiddleware";
    export { default as corsMiddleware } from "middleware/cors";
    export { default as killSlashMiddleware } from "middleware/killSlash";
    export { default as parseBodyMiddleware } from "middleware/parseBody";
    export { default as rerouteMiddleware } from "middleware/reroute";
    export { default as storeValsMiddleware } from "middleware/storeVals";
    export { default as SimpleRouter } from "middleware/simpleRouter";
}
declare module "tests/__tests__/testResponse" { }
declare module "tests/resources/mockServer" {
    import { Server } from 'http';
    export const port = 8081;
    export default function createServer(): Promise<Server>;
}
declare module "tests/__tests__/client/testRequest" { }
declare module "tests/__tests__/middleware/testApplyToContext" { }
declare module "tests/__tests__/middleware/testCookie" { }
declare module "tests/__tests__/middleware/testCors" { }
declare module "tests/__tests__/middleware/testKillSlashes" { }
declare module "tests/__tests__/middleware/testParseRequestBody" { }
declare module "tests/__tests__/middleware/testReroute" { }
declare module "tests/__tests__/middleware/testSimpleRouter" { }
declare module "tests/__tests__/middleware/testStoreVals" { }
declare module "tests/__tests__/road/testBuildNext" { }
declare module "tests/__tests__/road/testRoadContext" { }
declare module "tests/__tests__/road/testRoadRequest" { }
declare module "tests/__tests__/road/testRoadUse" { }
