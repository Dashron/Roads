var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * response.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Provides a simple class to manage HTTP responses
 */
define("core/response", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrap = void 0;
    class Response {
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
    exports.default = Response;
    /**
     * Wraps the return value of a promise in a Response object to ensure consistency.
     *
     * @param {Promise<Response | string>} promise
     * @returns {Promise<unknown>}
     */
    function wrap(promise) {
        return promise.then((routeResponse) => {
            return routeResponse instanceof Response ? routeResponse : new Response(routeResponse);
        });
    }
    exports.wrap = wrap;
});
/* eslint-disable max-len */
/**
 * road.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the core Road class
 */
define("core/road", ["require", "exports", "core/response", "core/response"], function (require, exports, response_lib, response_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * See roadsjs.com for full docs.
     *
     * @name Road
     */
    class Road {
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
        use(fn) {
            // Currently we pass everything through the coroutine wrapper to be save. Let that library decide
            // 		what does and does not actually need to be wrapped
            this._request_chain.push(fn);
            return this;
        }
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
        request(method, url, body, headers) {
            return response_lib.wrap(this._buildNext(method, url, body, headers, {
                request: this.request.bind(this),
                Response: response_1.default
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
            let progress = 0;
            const next = () => __awaiter(this, void 0, void 0, function* () {
                if (this._request_chain.length && this._request_chain[progress]) {
                    return this._request_chain[progress].call(context, request_method, path, request_body, request_headers, () => {
                        progress += 1;
                        return next();
                    });
                }
                // If next is called and there is nothing next, we should still return a promise,
                //		it just shouldn't do anything
                return new response_1.default('Page not found', 404);
            });
            return next;
        }
    }
    exports.default = Road;
});
/**
 * storeVals.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help manage the page title. This is best used alongside the PJAX helper
 */
define("middleware/storeVals", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TITLE_KEY = void 0;
    /*
     * This is a convention used by pjax for storing and retrieving the page title, and placed here
     *   for consistency with any server side rendering.
     */
    exports.TITLE_KEY = 'pjax-page-title';
    /**
     * Adds two simple functions to get and set a page title on the request context. This is very helpful for
     * 		isomorphic js, since on the client, page titles aren't part of the rendered view data.
     *  todo: Should we ask for the valid key:data type pairings be sent via a generic to storevalscontext?
     * 		This would be nice for stricter typing
     */
    const storeVals = function (method, path, body, headers, next) {
        const storedVals = {};
        this.storeVal = (field, val) => {
            storedVals[field] = val;
        };
        this.getVal = (field) => {
            return storedVals[field];
        };
        return next();
    };
    exports.default = storeVals;
});
/**
 * pjax.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a PJAX class to help with client side rendering
 */
define("client/pjax", ["require", "exports", "middleware/storeVals"], function (require, exports, storeVals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
      * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
      * by progressively turning standard HTML links into AJAX requests for portions of a web page.
      *
      * @todo Form support
      * @todo tests
      */
    class RoadsPjax {
        /**
         * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
         *
         * @param {Road} road - The road that will turn your pjax requests into HTML
         * @param {HTMLElement} container_element - The element that will be filled with your roads output
         * @param {Window} window - The pages window object to help set page title and other items
         */
        constructor(road, container_element, window) {
            this._road = road;
            this._page_title = undefined;
            this._window = window;
            this._container_element = container_element;
        }
        /**
         * Adds middleware to the assigned road which will adds storeVal and getVal to the PJAX
         * 		object (as opposed to the request object like the setTitle middlweare does).
         *
         * This allows you to easily update the page title.
         *
         * @returns {RoadsPjax} this, useful for chaining
         */
        addTitleMiddleware() {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const pjaxObj = this;
            const titleMiddleware = function (method, url, body, headers, next) {
                return next().then((response) => {
                    if (this.getVal) {
                        pjaxObj._page_title = this.getVal(storeVals_1.TITLE_KEY);
                    }
                    return response;
                });
            };
            this._road.use(titleMiddleware);
            return this;
        }
        /**
         * Hooks up the PJAX functionality to the information provided via the constructor.
         */
        register() {
            // Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
            // TODO: If a request is in process during the popstate, we should kill it and use the new url
            this._window.onpopstate = (event) => {
                if (event.state.pjax) {
                    // if the popped state was generated  via pjax, execute the appropriate route
                    this._road.request('GET', this._window.location.pathname)
                        .then((response) => {
                        this.render(response);
                        this._window.document.title = this._page_title ? this._page_title : '';
                    })
                        .catch((err) => {
                        console.log('road err');
                        console.log(err);
                    });
                }
                else {
                    // reload the page if the popped state wasn't generated via an pjax call
                    // eslint-disable-next-line no-self-assign
                    this._window.location.pathname = this._window.location.pathname;
                }
            };
            // Trigger the pjax on any click event for roads links
            this._container_element.addEventListener('click', this._pjaxEventMonitor.bind(this));
            // initial state
            this._window.history.replaceState({
                page_title: this._window.document.title,
                pjax: false
            }, this._page_title ? this._page_title : '');
        }
        /**
         *
         * @param {HTMLAnchorElement} element
         */
        registerAdditionalElement(element) {
            element.addEventListener('click', this._pjaxEventMonitor.bind(this));
        }
        /**
         * The response from the roads request
         *
         * @param {Response} response_object
         */
        render(response_object) {
            if (response_object.body !== undefined) {
                this._container_element.innerHTML = response_object.body;
            }
            else {
                this._container_element.innerHTML = '';
            }
        }
        /**
         * Handles all click events, and directs
         * @param {MouseEvent} event
         */
        _pjaxEventMonitor(event) {
            if (event.target instanceof HTMLAnchorElement && event.target.dataset['roadsPjax'] === 'link' && !event.ctrlKey) {
                event.preventDefault();
                this._roadsLinkEvent(event.target);
                // TODO: Change this to a on submit event?
            }
            else if ((event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement)
                && event.target.dataset['roadsPjax'] === 'submit'
                && event.target.form && event.target.form.dataset['roadsPjax'] === 'form') {
                event.preventDefault();
                this._roadsFormEvent(event.target.form);
            }
        }
        /**
         * Follows the link and renders the UI
         *
         * @param  {HTMLAnchorElement} link
         */
        _roadsLinkEvent(link) {
            this._road.request('GET', link.href)
                .then((response) => {
                this._window.history.pushState({
                    page_title: this._page_title,
                    pjax: true
                }, this._page_title ? this._page_title : '', link.href);
                this.render(response);
                this._window.document.title = this._page_title ? this._page_title : '';
            })
                .catch((err) => {
                console.log('road err');
                console.log(err);
                return;
            });
        }
        /**
         * Submits the form and re-renders the UI
         *
         * @param {HTMLFormElement} form
         */
        _roadsFormEvent(form) {
            // execute the form.
            //	note: while HTTP methods are case sensitive, HTML forms seem
            //		to lowercase their methods. To fix this we uppercase here as any is a workaround.
            //		see https://github.com/Microsoft/TypeScript/issues/30584
            this._road.request(form.method.toUpperCase(), form.action, new URLSearchParams(new FormData(form).toString()).toString(), { 'content-type': 'application/x-www-form-urlencoded' })
                .then((response) => {
                var _a;
                if ([301, 302, 303, 307, 308].includes(response.status) && typeof ((_a = response.headers) === null || _a === void 0 ? void 0 : _a.location) === 'string') {
                    // todo: location can be an array via code, but I don't think it's vaild to the spec?
                    return this._road.request('GET', response.headers.location);
                }
                else {
                    return response;
                }
            })
                .then((response) => {
                this.render(response);
                this._window.document.title = this._page_title ? this._page_title : '';
            })
                .catch((err) => {
                console.log('roads err');
                console.log(err);
                return;
            });
        }
    }
    exports.default = RoadsPjax;
});
/**
 * request.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a Request object to offer an HTTP request library with a method signature that matches
 * the roads.request method
 */
define("client/request", ["require", "exports", "roads-req", "core/response"], function (require, exports, roads_req_1, response_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class is a helper with making HTTP requests that look like roads requests.
     * The function signature matches the roads "request" method to allow the details of a request to be abstracted
     * away from the client. Sometimes the request may route internally, sometimes it may be an HTTP request.
     *
     * @todo tests
     */
    class Request {
        /**
         * @todo: port should just be part of the host
         *
         * @param {boolean} secure - Whether or not this request should use HTTPS
         * @param {string} host - The hostname of all requests made by this function
         * @param {number} port - The post of all requests made by this function
         */
        constructor(secure, host, port) {
            this._secure = secure;
            this._host = host;
            this._port = port;
        }
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
        request(method, path, body, headers) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield roads_req_1.default({
                    request: {
                        hostname: this._host,
                        port: this._port,
                        path: path,
                        method: method,
                        headers: headers,
                        // does this really work here? The goal is to have it sent when compiled
                        // 		into a client request with browserify
                        // withCredentials: true,
                        protocol: this._secure ? 'https' : 'http'
                    },
                    requestBody: body,
                    followRedirects: false
                });
                return new response_2.default(response.body, response.response.statusCode, response.response.headers);
            });
        }
    }
    exports.default = Request;
});
/**
 * applyToContext.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single function to be used with roads middleware. It makes it easy to assign
 * static values to a roads context.
 */
define("middleware/applyToContext", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    function applyToContext(key, val) {
        const applyToContext = function (method, url, body, headers, next) {
            this[key] = val;
            return next();
        };
        return applyToContext;
    }
    exports.default = applyToContext;
});
/**
 * cookie.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help with cookies
 */
define("middleware/cookieMiddleware", ["require", "exports", "cookie", "core/response"], function (require, exports, cookie, response_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clientCookieMiddleware = void 0;
    function getCookieValues(newCookies) {
        const cookies = {};
        const cookieKeys = Object.keys(newCookies);
        for (let i = 0; i < cookieKeys.length; i++) {
            const newCookie = newCookies[cookieKeys[i]];
            cookies[cookieKeys[i]] = newCookie.value;
        }
        return cookies;
    }
    const cookieMiddleware = function (route_method, route_path, route_body, route_headers, next) {
        let cookies = {};
        const newCookies = {};
        // Find the cookies from the request and store them locally
        if (route_headers.cookie) {
            cookies = cookie.parse(
            // todo: hmm... Can we get an array of cookies? I don't think so... this handles it properly if we do though.
            Array.isArray(route_headers.cookie) ? route_headers.cookie.join('; ') : route_headers.cookie);
        }
        // Add a cookie method to the middleware context
        this.setCookie = function (name, value, options) {
            newCookies[name] = {
                value: value ? value : '',
                options: options ? options : {}
            };
        };
        // Return the inital cookies with any new cookies merged on top.
        this.getCookies = () => {
            return Object.assign(Object.assign({}, cookies), getCookieValues(newCookies));
        };
        // Apply the cookie headers to the response
        return next().then((response) => {
            const cookieKeys = Object.keys(newCookies);
            // If there are new cookies to transmit
            if (cookieKeys.length) {
                // Ensure we're dealing with a response object and not a string
                if (!(response instanceof response_3.default)) {
                    response = new response_3.default(response);
                }
                // Initalize the header
                if (!response.headers['Set-Cookie']) {
                    response.headers['Set-Cookie'] = [];
                }
                // Apply all the cookies
                for (let i = 0; i < cookieKeys.length; i++) {
                    response.headers['Set-Cookie'].push(cookie.serialize(cookieKeys[i], newCookies[cookieKeys[i]].value, newCookies[cookieKeys[i]].options));
                }
            }
            return response;
        });
    };
    const clientCookieMiddleware = (document) => {
        return function (route_method, route_path, route_body, route_headers, next) {
            // TODO: Finalize this
            return next();
        };
    };
    exports.clientCookieMiddleware = clientCookieMiddleware;
    exports.default = cookieMiddleware;
});
/**
 * cors.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This exposes a function that helps you manage CORS in your roads service
 */
define("middleware/cors", ["require", "exports", "core/response"], function (require, exports, response_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getSingleHeader(headers, key) {
        if (headers) {
            // This is a little weirder than I would like, but it works better with typescript
            const val = headers[key];
            if (Array.isArray(val)) {
                return val[0];
            }
            return val;
        }
    }
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
    function cors(options) {
        const validOrigins = options.validOrigins || [];
        const supportsCredentials = options.supportsCredentials || false;
        const responseHeaders = options.responseHeaders || [];
        const requestHeaders = options.requestHeaders || [];
        // todo: lowercase all valid methods
        const validMethods = options.validMethods || [];
        const cacheMaxAge = options.cacheMaxAge || null;
        const logger = options.logger || { log: () => { } };
        /*
        Note: the comments below are pulled from the spec https://www.w3.org/TR/cors/ to help development
        */
        const corsMiddleware = function (method, url, body, headers, next) {
            const corsResponseHeaders = {};
            const preflight = method === 'OPTIONS' && headers['access-control-request-method'];
            /*
             * Terms
             *	"list of origins" consisting of zero or more origins that are allowed access to the resource.
             *		Note: This can include the origin of the resource itself though be aware that requests to
             *		cross-origin resources can be redirected back to the resource.
             *	"list of methods" consisting of zero or more methods that are supported by the resource.
             *	"list of headers" consisting of zero or more header field names that are supported by the resource.
             *	"list of exposed headers" consisting of zero or more header field names of headers other than
             *		the simple response headers that the resource might use and can be exposed.
             *	"supports credentials flag" that indicates whether the resource supports user credentials
             *		in the request. It is true when the resource does and false otherwise.
             *  "Simple Requests" If the Origin header is not present terminate this set of
             * 		steps. The request is outside the scope of this specification. https://www.w3.org/TR/cors/#resource-requests
             * 	"Actual Requests" https://www.w3.org/TR/cors/#resource-requests
             *  "Preflight Requests":  If the Origin header is not present terminate this set of steps. The request is \
             * 		outside the scope of this specification. https://www.w3.org/TR/cors/#resource-preflight-requests
            */
            if (!headers.origin) {
                return next();
            }
            /* Simple:
            If the value of the Origin header is not a case-sensitive match for any of the values in list of
            origins do not set any additional headers and terminate this set of steps.
    
            Note: Always matching is acceptable since the list of origins can be unbounded.
            */
            /* Preflight:
            If the value of the Origin header is not a case-sensitive match for any of the values in list of
            origins do not set any additional headers and terminate this set of steps.
    
            Note: Always matching is acceptable since the list of origins can be unbounded.
            Note: The Origin header can only contain a single origin as the user agent will not follow redirects.
            Implementation Note: Resources that wish to enable themselves to be shared with multiple Origins but do not respond
                uniformly with "*" must in practice generate the Access-Control-Allow-Origin header dynamically in response to
                every request they wish to allow. As a consequence, authors of such resources should send a Vary: Origin HTTP
                header or provide other appropriate control directives to prevent caching of such responses, which may be
                inaccurate if re-used across-origins.
            */
            const originHeader = getSingleHeader(headers, 'origin');
            if (validOrigins[0] !== '*' && originHeader && validOrigins.indexOf(originHeader) === -1) {
                logger.log('CORS ERROR: bad origin', originHeader);
                return next();
            }
            if (preflight) {
                /*
                 *	Preflight
                 *	Let method be the value as result of parsing the Access-Control-Request-Method header.
                 *	If there is no Access-Control-Request-Method header or if parsing failed, do not set any additional headers
                 *	and terminate this set of steps. The request is outside the scope of this specification.
                */
                const corsMethod = getSingleHeader(headers, 'access-control-request-method');
                /*
                preflight
                If method is not a case-sensitive match for any of the values in list of methods do not set any additional
                    headers and terminate this set of steps.
    
                Note: Always matching is acceptable since the list of methods can be unbounded.
                */
                // todo: lowercase valid methods and cors method
                if (corsMethod && validMethods.indexOf(corsMethod) === -1) {
                    logger.log('CORS Error: bad method', corsMethod);
                    return next();
                }
                /*
                 *	preflight
                 *	Let header field-names be the values as result of parsing the Access-Control-Request-Headers headers.
                 *
                 *	Note: If there are no Access-Control-Request-Headers headers let header field-names be the empty list.
                 *	Note: If parsing failed do not set any additional headers and terminate this set of steps. The request
                 *		is outside the scope of this specification.
                */
                let headerNames = undefined;
                const acRequestHeaders = getSingleHeader(headers, 'access-control-request-headers');
                try {
                    headerNames = acRequestHeaders ? acRequestHeaders.split(',') : [];
                }
                catch (e) {
                    logger.log('CORS Error: request headers parse fail');
                    return next();
                }
                /*
                preflight
                If any of the header field-names is not a ASCII case-insensitive match for any of the values in list of
                    headers do not set any additional headers and terminate this set of steps.
    
                Note: Always matching is acceptable since the list of headers can be unbounded.
                */
                for (let i = 0; i < headerNames.length; i++) {
                    if (requestHeaders.indexOf(headerNames[i]) === -1) {
                        logger.log('CORS Error: invalid header requested', headerNames[i]);
                        return next();
                    }
                }
                /*
                 *	Preflight
                 *	Optionally add a single Access-Control-Max-Age header with as value the amount of seconds the user agent is
                 *	allowed to cache the result of the request.
                */
                if (typeof (cacheMaxAge) === 'number') {
                    corsResponseHeaders['access-control-max-age'] = String(cacheMaxAge);
                }
                /*
                 *	Preflight
                 *	If method is a simple method this step may be skipped.
                 *	Add one or more Access-Control-Allow-Methods headers consisting of (a subset of) the list of methods.
                 *	Note: If a method is a simple method it does not need to be listed, but this is not prohibited.
                 *	Note: Since the list of methods can be unbounded, simply returning the method indicated by
                 *		Access-Control-Request-Method (if supported) can be enough.
                */
                corsResponseHeaders['access-control-allow-methods'] = validMethods.join(', ');
                /*
                 *	Preflight
                 *	If each of the header field-names is a simple header and none is Content-Type, this step may be skipped.
                 *	Add one or more Access-Control-Allow-Headers headers consisting of (a subset of) the list of headers.
                 *	Note: If a header field name is a simple header and is not Content-Type, it is not required to be listed.
                 *		Content-Type is to be listed as only a subset of its values makes it qualify as simple header.
                 *	Note: Since the list of headers can be unbounded, simply returning supported headers from
                 * 		Access-Control-Allow-Headers can be enough.
                */
                corsResponseHeaders['access-control-allow-headers'] = requestHeaders.join(', ');
            }
            else {
                /*
                 *	Simple
                 *	If the list of exposed headers is not empty add one or more Access-Control-Expose-Headers headers,
                 *	with as values the header field names given in the list of exposed headers.
                 *
                 *	By not adding the appropriate headers resource can also clear the preflight result cache of all entries
                 *	where origin is a case-sensitive match for the value of the Origin header and url is a case-sensitive
                 *	match for the URL of the resource.
                */
                if (responseHeaders && responseHeaders.length) {
                    corsResponseHeaders['access-control-expose-headers'] = responseHeaders.join(', ');
                }
            }
            /*
             *	preflight
             *	If the resource supports credentials add a single Access-Control-Allow-Origin header,
             *	with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials
             *	header with the case-sensitive string "true" as value.
             *
             *	Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or
             *		the string "*" as value.
             *	Note: The string "*" cannot be used for a resource that supports credentials.
            */
            /*
             *	Simple
             *	If the resource supports credentials add a single Access-Control-Allow-Origin header,
             *	with the value of the Origin header as value, and add a single Access-Control-Allow-Credentials
             *	header with the case-sensitive string "true" as value
             *
             *	Note: Otherwise, add a single Access-Control-Allow-Origin header, with either the value of the Origin header or
             *		the string "*" as value.
             *	Note: The string "*" cannot be used for a resource that supports credentials.
            */
            if (originHeader) {
                corsResponseHeaders['access-control-allow-origin'] = originHeader;
            }
            if (supportsCredentials) {
                corsResponseHeaders['access-control-allow-credentials'] = 'true';
            }
            if (preflight) {
                return Promise.resolve(new response_4.default('', 200, corsResponseHeaders));
            }
            return next()
                .then((response) => {
                for (const key in corsResponseHeaders) {
                    response.headers[key] = corsResponseHeaders[key];
                }
                return response;
            });
        };
        return corsMiddleware;
    }
    exports.default = cors;
});
define("middleware/killSlash", ["require", "exports", "url"], function (require, exports, url_module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Any requests with trailing slashes will immediately return a Response object redirecting to a non-trailing-slash path
     */
    const killSlash = function (method, url, body, headers, next) {
        // TODO: parse is deprecated
        const parsedUrl = url_module.parse(url);
        const parsedPath = parsedUrl.path;
        if (!parsedPath) {
            return next();
        }
        // kill trailing slash as long as we aren't at the root level
        if (parsedPath !== '/' && parsedPath[parsedPath.length - 1] === '/') {
            return Promise.resolve(new this.Response('', 302, {
                location: parsedPath.substring(0, parsedPath.length - 1)
            }));
        }
        return next();
    };
    exports.default = killSlash;
});
/**
 * parseBody.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a single middleware function to help parse request bodies
 */
define("middleware/parseBody", ["require", "exports", "content-type", "querystring"], function (require, exports, contentTypeModule, qsModule) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getSingleHeader(headers, key) {
        if (headers) {
            // This is a little weirder than I would like, but it works better with typescript
            const val = headers[key];
            if (Array.isArray(val)) {
                return val[0];
            }
            return val;
        }
    }
    /**
     * Translate the request body into a usable value.
     *
     * If the content type is application/json this will attempt to parse that json
     * If application/x-www-form-urlencoded this will attempt to parse it as a query format
     * Otherwise this will return a string
     *
     * @param  {string} body - request body
     * @param  {string} content_type - media type of the body
     * @returns {(object|string)} parsed body
     * @todo Actually do something with the parameters, such as charset
     */
    function parseRequestBody(body, contentType) {
        if (contentType) {
            const parsedContentType = contentTypeModule.parse(contentType);
            if (parsedContentType.type === 'application/json') {
                // parse json
                return JSON.parse(body);
            }
            else if (parsedContentType.type === 'application/x-www-form-urlencoded') {
                // parse form encoded
                return qsModule.parse(body);
            }
        }
        // maybe it's supposed to be literal
        return body;
    }
    /**
     * Attempts the parse the request body into a useful object
     */
    const parseBody = function (method, url, body, headers, next) {
        this.body = parseRequestBody(body, getSingleHeader(headers, 'content-type'));
        return next();
    };
    exports.default = parseBody;
});
/**
 * reroute.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes a method that allows you to bind additional roads to a road context. This allows you to manage multiple
 * client side or server side road objects at once
 */
define("middleware/reroute", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    function default_1(key, road) {
        const reroute = function (route_method, route_path, route_body, route_headers, next) {
            this[key] = function (method, path, body, headers) {
                if (!headers) {
                    headers = {};
                }
                return road.request(method, path, body, headers);
            };
            return next();
        };
        return reroute;
    }
    exports.default = default_1;
});
/**
 * simpleRouter.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Exposes the SimpleRouter class to be used with roads middleware.
 */
define("middleware/simpleRouter", ["require", "exports", "url"], function (require, exports, url_module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    class SimpleRouter {
        /**
         * @param {Road} [road] - The road that will receive the SimpleRouter middleware
         */
        constructor(road) {
            this._routes = [];
            if (road) {
                this.applyMiddleware(road);
            }
        }
        /**
         * Assigns the middleware to the provided road
         *
         * @param  {Road} road - The road that will receive the SimpleRouter middleware
         */
        applyMiddleware(road) {
            // We need to alias because "this" for the middleware function must
            //		be the this applied by road.use, not the simplerouter
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _self = this;
            // We do this to ensure we have access to the SimpleRouter once we lose this due to road's context
            road.use((function (request_method, request_url, request_body, request_headers, next) {
                return _self._middleware.call(this, _self._routes, request_method, request_url, request_body, request_headers, next);
            }));
        }
        /**
         * Adds a route to this router. The route is a function that will match the standard roads request signature.
         * It will be associated with one HTTP method, and one or many HTTP paths
         *
         * @param {string} method - The HTTP method that will trigger the provided function
         * @param {(string|array)} paths - One or many URL paths that will trigger the provided function
         * @param {function} fn - The function containing all of your route logic
         */
        addRoute(method, paths, fn) {
            if (!Array.isArray(paths)) {
                paths = [paths];
            }
            paths.forEach((path) => {
                this._routes.push({
                    path: path,
                    method: method,
                    route: fn
                });
            });
        }
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
        addRouteFile(file_path, prefix) {
            return new Promise((resolve_1, reject_1) => { require([file_path], resolve_1, reject_1); }).then(routes => {
                for (const path in routes) {
                    for (const method in routes[path]) {
                        this.addRoute(method, buildRouterPath(path, prefix), routes[path][method]);
                    }
                }
            });
        }
        /**
         * Slightly non-standard roads middleware to execute the functions in this router when requests are received by the road
         * The first method is the routes to ensure that we can properly use this router once we loose the "this" value
         * from the roads context
         *
         * @todo there might be a better way to do this
         */
        _middleware(routes, request_method, request_url, request_body, request_headers, next) {
            let response = null;
            let hit = false;
            const parsed_url = url_module.parse(request_url, true);
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                if (compareRouteAndApplyArgs(route, parsed_url, request_method)) {
                    response = (route.route).call(this, parsed_url, request_body, request_headers, next);
                    hit = true;
                    break;
                }
            }
            if (hit) {
                return response;
            }
            return next();
        }
    }
    exports.default = SimpleRouter;
    /**
     * Checks to see if the route matches the request, and if true assigns any applicable url variables and returns the route
     *
     * @param {object} route - Route object from this simple router class
     * @param {object} route.method - HTTP method associated with this route
     * @param {object} route.path - HTTP path associated with this route
     * @param {object} request_url - Parsed HTTP request url
     * @param {string} request_method - HTTP request method
     * @returns {boolean}
     */
    function compareRouteAndApplyArgs(route, request_url, request_method) {
        if (route.method !== request_method || !request_url.pathname) {
            return false;
        }
        let template = route.path.split('/');
        if (template[0] === '') {
            template = template.slice(1); // Slice kills the emptystring before the leading slash
        }
        let actual = request_url.pathname.split('/');
        if (actual[0] === '') {
            actual = actual.slice(1); // Slice kills the emptystring before the leading slash
        }
        if (template.length != actual.length) {
            return false;
        }
        for (let i = 0; i < template.length; i++) {
            const actual_part = actual[i];
            const template_part = template[i];
            // Process variables first
            if (template_part[0] === '#') {
                // # templates only accept numbers
                if (isNaN(Number(actual_part))) {
                    return false;
                }
                applyArg(request_url, template_part.substring(1), Number(actual_part));
                continue;
            }
            if (template_part[0] === '$') {
                // $ templates accept any non-slash alphanumeric character
                applyArg(request_url, template_part.substring(1), String(actual_part));
                // Continue so that
                continue;
            }
            // Process exact matches second
            if (actual_part === template_part) {
                continue;
            }
            return false;
        }
        return true;
    }
    /**
     * Assigns a value to the parsed request urls args parameter
     *
     * @param {object} request_url - The parsed url object
     * @param {string} template_part - The template variable
     * @param {*} actual_part - The url value
     */
    function applyArg(request_url, template_part, actual_part) {
        if (typeof (request_url.args) === 'undefined') {
            request_url.args = {};
        }
        if (typeof request_url.args !== 'object') {
            throw new Error(`The request url's args have already been defined as a ${typeof request_url.args}
			and we expected an object. For safety we are throwing this error instead of overwriting your
			existing data. Please use a different field name in your code`);
        }
        request_url.args[template_part] = actual_part;
    }
    /**
     * Applies a prefix to paths of route files
     *
     * @todo I'm pretty sure there's an existing library that will do this more accurately
     * @param {string} path - The HTTP path of a route
     * @param {string} [prefix] - An optional prefix for the HTTP path
     * @returns {string}
     */
    function buildRouterPath(path, prefix) {
        if (!prefix) {
            prefix = '';
        }
        if (prefix.length && path === '/') {
            return prefix;
        }
        return prefix + path;
    }
});
define("index", ["require", "exports", "core/response", "core/road", "client/pjax", "client/request", "middleware/applyToContext", "middleware/cookieMiddleware", "middleware/cors", "middleware/killSlash", "middleware/parseBody", "middleware/reroute", "middleware/storeVals", "middleware/simpleRouter"], function (require, exports, response_5, road_1, pjax_1, request_1, applyToContext_1, cookieMiddleware_1, cors_1, killSlash_1, parseBody_1, reroute_1, storeVals_2, simpleRouter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleRouter = exports.storeValsMiddleware = exports.rerouteMiddleware = exports.parseBodyMiddleware = exports.killSlashMiddleware = exports.corsMiddleware = exports.cookieMiddleware = exports.applyToContextMiddleware = exports.Request = exports.RoadsPJAX = exports.Road = exports.Response = void 0;
    Object.defineProperty(exports, "Response", { enumerable: true, get: function () { return response_5.default; } });
    Object.defineProperty(exports, "Road", { enumerable: true, get: function () { return road_1.default; } });
    Object.defineProperty(exports, "RoadsPJAX", { enumerable: true, get: function () { return pjax_1.default; } });
    Object.defineProperty(exports, "Request", { enumerable: true, get: function () { return request_1.default; } });
    Object.defineProperty(exports, "applyToContextMiddleware", { enumerable: true, get: function () { return applyToContext_1.default; } });
    Object.defineProperty(exports, "cookieMiddleware", { enumerable: true, get: function () { return cookieMiddleware_1.default; } });
    Object.defineProperty(exports, "corsMiddleware", { enumerable: true, get: function () { return cors_1.default; } });
    Object.defineProperty(exports, "killSlashMiddleware", { enumerable: true, get: function () { return killSlash_1.default; } });
    Object.defineProperty(exports, "parseBodyMiddleware", { enumerable: true, get: function () { return parseBody_1.default; } });
    Object.defineProperty(exports, "rerouteMiddleware", { enumerable: true, get: function () { return reroute_1.default; } });
    Object.defineProperty(exports, "storeValsMiddleware", { enumerable: true, get: function () { return storeVals_2.default; } });
    Object.defineProperty(exports, "SimpleRouter", { enumerable: true, get: function () { return simpleRouter_1.default; } });
});
define("tests/__tests__/testResponse", ["require", "exports", "index"], function (require, exports, index_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('response tests', () => {
        /**
         * Test that the constructor fields are accessible by the proper attributes.
         */
        test('Constructor applies to body', () => {
            expect.assertions(3);
            const response_data = { message: 'hello' };
            const headers = { hello: 'there' };
            const res = new index_1.Response(JSON.stringify(response_data), 200, headers);
            expect(res.body).toEqual(JSON.stringify(response_data));
            expect(res.status).toEqual(200);
            expect(res.headers).toEqual(headers);
        });
    });
});
define("tests/resources/mockServer", ["require", "exports", "http"], function (require, exports, http) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.port = void 0;
    exports.port = 8081;
    // creates an http server specifically for testing this request library
    function createServer() {
        return new Promise((resolve, reject) => {
            const server = http.createServer();
            let body = '';
            let bodyFound = false;
            server.on('request', (request, response) => {
                // Get all the streaming input data from the request
                request.on('readable', () => {
                    bodyFound = true;
                    let chunk = null;
                    while (null !== (chunk = request.read())) {
                        body += chunk;
                    }
                });
                // When the request stops sending data, wrap it all up and find the proper API response
                request.on('end', () => {
                    if (!bodyFound) {
                        body = undefined;
                    }
                    const routerResponse = router(request.method, request.url)(body, request.headers);
                    response.writeHead(routerResponse.status, routerResponse.headers ? routerResponse.headers : {});
                    if (typeof routerResponse.body !== 'undefined') {
                        response.write(routerResponse.body);
                    }
                    response.end();
                });
                // Handle any errors
                request.on('error', (err) => {
                    throw err;
                });
            });
            server.listen(exports.port, () => {
                resolve(server);
            });
            server.on('error', (err) => {
                reject(err);
            });
        });
    }
    exports.default = createServer;
    // Formatting help for building the responses interpreted by this test http server
    function buildResponse(status, headers, body) {
        return {
            status: status,
            headers: headers,
            body: body
        };
    }
    /**
     * List of all test routes
     */
    const routes = {
        '/': {
            GET: (body, headers) => {
                return {
                    status: 200,
                    headers: {
                        'this-is': 'for real',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: '/',
                        method: 'GET',
                        body: body,
                        headers: headers,
                        message: 'hello!'
                    })
                };
            },
            POST: (body, headers) => {
                return {
                    status: 200,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: '/',
                        method: 'POST',
                        body: body,
                        headers: headers,
                        message: 'hello!'
                    })
                };
            }
        }
    };
    /**
     * Function to help locate test routes
     *
     * @param {*} method
     * @param {*} url
     */
    function router(method, url) {
        if (routes[url] && routes[url][method]) {
            return routes[url][method];
        }
        return () => {
            return buildResponse(404, {}, 'Page not found');
        };
    }
});
define("tests/__tests__/client/testRequest", ["require", "exports", "client/request", "tests/resources/mockServer"], function (require, exports, request_2, mockServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('request', () => {
        let server;
        /**
         * Setup
         */
        beforeAll(() => {
            return mockServer_1.default()
                .then((newServer) => {
                server = newServer;
            });
        });
        /**
         * Shutdown
         */
        afterAll(() => {
            return server.close();
        });
        /**
         * Ensure that the basic request system lines up
         */
        test('Request Without Body', () => {
            expect.assertions(3);
            const client = new request_2.default(false, '127.0.0.1', mockServer_1.port);
            return new Promise((resolve) => {
                resolve(client.request('GET', '/', undefined, {
                    one: 'two'
                }).then(function (response) {
                    expect(response.status).toEqual(200);
                    expect(response.body).toEqual(JSON.stringify({
                        url: '/',
                        method: 'GET',
                        body: '',
                        headers: { one: 'two', host: `127.0.0.1:${mockServer_1.port}`, connection: 'close' },
                        message: 'hello!'
                    }));
                    expect(response.headers['this-is']).toEqual('for real');
                }));
            });
        });
        /**
         * Ensure that the basic request system lines up
         */
        test('Request With Body', () => {
            expect.assertions(2);
            const client = new request_2.default(false, '127.0.0.1', mockServer_1.port);
            return new Promise((resolve, reject) => {
                resolve(client.request('POST', '/', '{"yeah": "what"}', {
                    three: 'four'
                }).then(function (response) {
                    expect(response.status).toEqual(200);
                    expect(response.body).toEqual(JSON.stringify({
                        url: '/',
                        method: 'POST',
                        // for some reason JSON.stringify is dropping whitespace on this
                        body: '{"yeah": "what"}',
                        headers: {
                            three: 'four',
                            host: `127.0.0.1:${mockServer_1.port}`,
                            connection: 'close',
                            'transfer-encoding': 'chunked'
                        },
                        message: 'hello!'
                    }));
                }));
            });
        });
    });
});
define("tests/__tests__/middleware/testApplyToContext", ["require", "exports", "index"], function (require, exports, index_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('ApplyToContext tests', () => {
        test('test apply to context applies context', () => {
            expect.assertions(2);
            const key = 'foo';
            const val = 'bar';
            const context = {};
            const fn = index_2.applyToContextMiddleware(key, val);
            expect(typeof (fn)).toEqual('function');
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            fn.call(context, 'a', 'b', 'c', 'd', function () { });
            expect(val).toEqual(context[key]);
        });
        test('test apply to context calls next', () => {
            expect.assertions(2);
            const key = 'foo';
            const val = 'bar';
            const context = {};
            const fn = index_2.applyToContextMiddleware(key, val);
            expect(typeof (fn)).toEqual('function');
            const custom = fn.call(context, 'a', 'b', 'c', 'd', function () {
                return 'custom data';
            });
            expect(custom).toEqual('custom data');
        });
    });
});
define("tests/__tests__/middleware/testCookie", ["require", "exports", "index", "core/response"], function (require, exports, index_3, response_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('cookie tests', () => {
        test('test cookie middleware parses cookies into context', () => {
            expect.assertions(2);
            const context = {
                Response: response_6.default
            };
            index_3.cookieMiddleware.call(context, 'a', 'b', 'c', {
                cookie: 'foo=bar;abc=def'
            }, function () { return Promise.resolve('test'); });
            expect(context.getCookies().foo).toEqual('bar');
            expect(context.getCookies().abc).toEqual('def');
        });
        test('test cookie middleware will update the response headers', () => {
            expect.assertions(1);
            const context = {
                Response: response_6.default
            };
            const next = function () {
                this.setCookie('foo', 'bar');
                return Promise.resolve('test');
            };
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            expect(index_3.cookieMiddleware.call(context, 'a', 'b', 'c', {}, next.bind(context)))
                .resolves.toEqual(new response_6.default('test', 200, {
                'Set-Cookie': ['foo=bar']
            }));
        });
        /*test('test that getCookies merges new and old cookies together', () => {
    
        });*/
    });
});
define("tests/__tests__/middleware/testCors", ["require", "exports", "index"], function (require, exports, index_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('Cors tests', () => {
        test('test kill slash doesn\'t break normal', () => {
            expect.assertions(1);
            return expect(index_4.corsMiddleware({})).toBeInstanceOf(Function);
        });
        /* test.skip('old cors tests. need to update these', () => {
    
        // Temporarily deactivated. This is for the old cors middlware, which has been rewritten.
        // 		These tests need to be rewritten.
    
        /*
        function makeCorsCall (allowed_origins, method, allowed_methods, allowed_headers, provide_origin, throw_error) {
            var url = '/';
            var body = {};
            var contents = {headers: {}};
            var headers = {
                origin : 'localhost:8080',
                'access-control-request-method' : method === 'OPTIONS' ? 'GET' : method
            };
            var next = null;
    
            if (!provide_origin) {
                delete headers.origin;
            }
    
            var context = {
                http_methods : allowed_methods,
                Response : roads.Response
            };
    
            if (throw_error) {
                next = function () {
                    return new Promise(function (accept, reject) {
                        reject(new roads.HttpError('Forbidden', roads.HttpError.forbidden));
                    });
                };
            } else {
                next = function () {
                    return new Promise(function (accept, reject) {
                        accept(contents);
                    });
                };
            }
    
            return roads.middleware.cors(allowed_origins, allowed_headers).call(context, method, url, body, headers, next);
        }
    
        /**
         * Ensure a basic valid preflight check works
         */
        /*test(''test preflight request with cors and no settings']', () => {
            var origin = '*';
            var method = 'OPTIONS';
            var allowed_methods = ['GET', 'POST'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
            .then(function (response) {
                test.deepEqual(response, {
                    body: null,
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Methods' : allowed_methods.join(', '),
                        'Access-Control-Allow-Headers' : allowed_headers.join(', '),
                        'Access-Control-Allow-Origin' : origin,
                        'Access-Control-Allow-Credentials' : true
                    }
                });
            })
            .catch(function (err) {
                console.log(err.stack);
                test.fail();
            });
        };
    
    
        /**
         * Ensure a basic valid preflight check works
         */
        /*test(''test preflight request with cors and origin allow list hits']', () => {
            var origin = ['localhost:8080', 'dashron.com'];
            var method = 'OPTIONS';
            var allowed_methods = ['GET', 'POST'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
            .then(function (response) {
                test.deepEqual(response, {
                    body: null,
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Methods' : allowed_methods.join(', '),
                        'Access-Control-Allow-Headers' : allowed_headers.join(', '),
                        'Access-Control-Allow-Origin' : 'localhost:8080',
                        'Access-Control-Allow-Credentials' : true
                    }
                });
            })
            .catch(function (err) {
                console.log(err.stack);
                test.fail();
            });
        };
    
        /**
         * Ensure a basic valid preflight check works
         */
        /*test(''test preflight request with cors and origin allow list misses']', () => {
            var origin = ['dashron.com'];
            var method = 'OPTIONS';
            var allowed_methods = ['GET', 'POST'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
            .then(function (response) {
                console.log('response', response);
                test.fail();
            })
            .catch(function (err) {
                test.deepEqual(err, new roads.HttpError(origin.join(','), 403));
            });
        };
    
    
        /**
         * Ensure a non-cors options request still works
         */
        /*test(''test options without origin isn\'t cors']', () => {
            var origin = '*';
            var method = 'OPTIONS';
            var allowed_methods = ['GET'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
            .then(function (response) {
                test.deepEqual(response, { headers : {} });
            })
            .catch(function (err) {
                console.log(err.stack);
                test.fail();
            });
        };
    
        /**
         * Ensure a preflight check with a http method miss fails
         */
        /*test('test preflight method miss with cors and no settings', () => {
            var origin = '*';
            var method = 'OPTIONS';
            var allowed_methods = ['POST'];
            var allowed_headers = [];
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
            .then(function (response) {
                console.log('response', response);
                test.fail();
            })
            .catch(function (err) {
                test.deepEqual(err, new roads.HttpError(allowed_methods, 405));
            });
        };
    
        /**
         * Ensure a normal request works
         */
        /*test('test standard request with cors and no settings', () => {
            var origin = '*';
            var method = 'GET';
            var allowed_methods = ['GET'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true)
            .then(function (response) {
                test.deepEqual(response, {
                    headers: {
                        'Access-Control-Allow-Credentials' : true,
                        'Access-Control-Allow-Origin' : '*'
                    }
                });
            })
            .catch(function (err) {
                console.log(err.stack);
                test.fail();
            });
        };
    
        /**
         * Ensure a non-cors request still works
         */
        /*test('test standard without origin isn\'t cors', () => {
            var origin = '*';
            var method = 'GET';
            var allowed_methods = ['GET'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, false)
            .then(function (response) {
                test.deepEqual(response, { headers : {} });
            })
            .catch(function (err) {
                console.log(err.stack);
                test.fail();
            });
        };
    
    
        /**
         * Ensure a normal request works
         */
        /*test('test standard request with error thrown still sends cors headers', () => {
            var origin = '*';
            var method = 'GET';
            var allowed_methods = ['GET'];
            var allowed_headers = [];
    
            makeCorsCall(origin, method, allowed_methods, allowed_headers, true, true)
            .then(function (response) {
                console.log(response);
                test.fail();
            })
            .catch(function (err) {
                test.deepEqual(err.headers, {
                    'Access-Control-Allow-Credentials' : true,
                    'Access-Control-Allow-Origin' : '*'
                });
    
                test.equal(err.code, 403);
                test.equal(err.message, 'Forbidden');
            });
        };*/
        //});
    });
});
define("tests/__tests__/middleware/testKillSlashes", ["require", "exports", "index", "core/response"], function (require, exports, index_5, response_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('KillSlashes tests', () => {
        test('test kill slash doesn\'t break normal', () => {
            expect.assertions(1);
            const method = 'GET';
            const url = '/users';
            const body = {};
            const headers = {};
            const contents = 'fooo';
            const next = function () {
                return new Promise(function (accept, reject) {
                    accept(contents);
                });
            };
            return expect(index_5.killSlashMiddleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
        });
        /**
     * Test that a request with slash fixing, on a request with a trailing slash is turned into a redirect response
     */
        test('test kill slash only trailing slash fixing a route', () => {
            expect.assertions(1);
            const method = 'GET';
            const url = '/users/';
            const body = {};
            const headers = {};
            const contents = 'fooo';
            const next = function () {
                return new Promise(function (accept, reject) {
                    accept(contents);
                });
            };
            return expect(index_5.killSlashMiddleware.call({
                // the redirection needs the Response context
                Response: response_7.default
            }, method, url, body, headers, next)).resolves.toEqual({
                status: 302,
                body: '',
                headers: {
                    location: '/users'
                }
            });
        });
        /**
         * Test that a request with slash fixing on a request to the root endpoint isn't messed up.
         * Technically it's a trailing slash, so I added this test to test the edge case
         */
        test('test kill slash not breaking on root', () => {
            expect.assertions(1);
            const method = 'GET';
            const url = '/';
            const body = {};
            const headers = {};
            const contents = 'fooo';
            const next = function () {
                return new Promise(function (accept, reject) {
                    accept(contents);
                });
            };
            return expect(index_5.killSlashMiddleware.call({}, method, url, body, headers, next)).resolves.toEqual(contents);
        });
    });
});
define("tests/__tests__/middleware/testParseRequestBody", ["require", "exports", "index", "index", "core/response"], function (require, exports, index_6, index_7, response_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('Parse Request Body tests', () => {
        test('test request with valid json body', () => {
            expect.assertions(1);
            const context = {};
            const body = '{"hello": "there"}';
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            index_6.parseBodyMiddleware.call(context, '', '', body, { 'content-type': 'application/json' }, () => { });
            expect(context.body).toEqual({ hello: 'there' });
        });
        /**
         * Test that valid json parsing works as expected
         */
        test('test request with invalid json body', () => {
            expect.assertions(1);
            const context = {};
            const body = '{hello ';
            return expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                return index_6.parseBodyMiddleware.call(context, '', '', body, { 'content-type': 'application/json' }, () => { });
            }).toThrowError();
        });
        /**
         * Test that valid json parsing works as expected with roads
         */
        test('test used request with valid json body', () => {
            expect.assertions(1);
            const road = new index_7.Road();
            road.use(index_6.parseBodyMiddleware);
            const body = '{"hello": "there"}';
            const middleware = function (method, url, request_body, headers) {
                expect(this.body).toEqual({ hello: 'there' });
                return Promise.resolve(new response_8.default(''));
            };
            road.use(middleware);
            road.request('', '', body, {
                'content-type': 'application/json'
            });
        });
        /**
         * Test that invalid json parsing fails as expected with roads
         */
        test('test used request with invalid json body', () => {
            expect.assertions(1);
            const road = new index_7.Road();
            road.use(index_6.parseBodyMiddleware);
            const body = '{hello there';
            return expect(road.request('', '', body, {
                'content-type': 'application/json'
            })).rejects.toEqual(new Error('Unexpected token h in JSON at position 1'));
        });
        /**
         * Test that the content type can contain parameters
         */
        test('test content type with parameters', () => {
            expect.assertions(1);
            const context = {};
            const body = '{"hello": "there"}';
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            index_6.parseBodyMiddleware.call(context, '', '', body, { 'content-type': 'application/json; charset=utf-8' }, () => { });
            expect(context.body).toEqual({ hello: 'there' });
        });
    });
});
define("tests/__tests__/middleware/testReroute", ["require", "exports", "index", "core/response"], function (require, exports, index_8, response_9) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('Reroute middleware tests', () => {
        /**
         * Tests that the provided road's request method is bound to the
         * original road's context under the provided key
         */
        test('test request method is bound to context key', () => {
            expect.assertions(3);
            const request = function (method, path, body, headers) {
                return Promise.resolve(new response_9.default('banana'));
            };
            const mockRoad = {
                request: request
            };
            const key = 'foo';
            const context = {};
            const middleware = index_8.rerouteMiddleware(key, mockRoad);
            expect(typeof (middleware)).toEqual('function');
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            middleware.call(context, 'a', 'b', 'c', {}, function () { });
            expect(typeof (context[key])).toEqual('function');
            return expect(context[key]()).resolves.toEqual(new response_9.default('banana'));
        });
    });
});
define("tests/__tests__/middleware/testSimpleRouter", ["require", "exports", "url", "index", "index"], function (require, exports, url_module, index_9, index_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const router_file_test_path = `${__dirname}/../../resources/_router_file_test.js`;
    describe('Simple Router Tests', () => {
        /**
         *
         */
        test('test addRoute adds values to the list of routes in the right format', () => {
            expect.assertions(1);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            const fn = () => { return Promise.resolve(new index_10.Response('')); };
            router.addRoute(method, path, fn);
            expect({
                path: path,
                method: method,
                route: fn
            }).toEqual(router['_routes'][0]);
        });
        /**
         *
         */
        test('test addRoute adds middleware to the route', () => {
            expect.assertions(1);
            const road = new index_10.Road();
            const router = new index_9.SimpleRouter();
            router.applyMiddleware(road);
            expect(road['_request_chain'].length).toEqual(1);
        });
        /**
         *
         */
        test('test middleware function routes successfully to successful routes', () => {
            expect.assertions(1);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            let route_hit = false;
            const fn = () => {
                route_hit = true;
                return Promise.resolve(new index_10.Response('{"route_hit": true}'));
            };
            const next = () => {
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, fn);
            router['_middleware'](router['_routes'], method, path, '', {}, next);
            expect(route_hit).toEqual(true);
        });
        /**
         *
         */
        test(`test middleware function routes successfully to successful routes
	only once when there may be more than one route`, () => {
            expect.assertions(1);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            let route_hit = false;
            const fn = () => {
                route_hit = true;
                return Promise.resolve(new index_10.Response(''));
            };
            const fn2 = () => {
                route_hit = false;
                return Promise.resolve(new index_10.Response(''));
            };
            const next = () => {
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, fn);
            router.addRoute(method, path, fn2);
            router['_middleware'](router['_routes'], method, path, '', {}, next);
            expect(route_hit).toEqual(true);
        });
        /**
         *
         */
        test('test middleware function routes to next  on a missed url', () => {
            expect.assertions(2);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            let route_hit = false;
            let next_hit = false;
            const fn = () => {
                route_hit = true;
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute('/foo', method, fn);
            router['_middleware'](router['_routes'], method, path, '', {}, () => {
                next_hit = true;
                return Promise.resolve(new index_10.Response(''));
            });
            expect(route_hit).toEqual(false);
            expect(next_hit).toEqual(true);
        });
        /**
         *
         */
        test('test middleware function routes to next on a missed http method but matching url', () => {
            expect.assertions(2);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            let route_hit = false;
            let next_hit = false;
            const fn = () => {
                route_hit = true;
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(path, 'PUT', fn);
            router['_middleware'](router['_routes'], method, path, '', {}, () => {
                next_hit = true;
                return Promise.resolve(new index_10.Response(''));
            });
            expect(route_hit).toEqual(false);
            expect(next_hit).toEqual(true);
        });
        /**
         *
         */
        test('test route function with no template gets the proper context and arguments', () => {
            expect.assertions(3);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            const body = '{"harvey": "birdman"}';
            const headers = { bojack: 'horseman' };
            const route = (request_url, request_body, request_headers) => {
                // parsed url
                expect(request_url).toEqual(url_module.parse(path, true));
                // passthrough request body
                expect(request_body).toEqual(body);
                // passthrough headers
                expect(request_headers).toEqual(headers);
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, route);
            router['_middleware'](router['_routes'], method, path, body, headers, () => {
                return Promise.resolve(new index_10.Response(''));
            });
        });
        /**
         *
         */
        test('test route function with numeric template gets the proper context and arguments', () => {
            expect.assertions(3);
            const router = new index_9.SimpleRouter();
            const path = '/#numeric';
            const req_path = '/12345';
            const method = 'GET';
            const body = '{"harvey": "birdman"}';
            const headers = { bojack: 'horseman' };
            const route = (request_url, request_body, request_headers, next) => {
                // parsed url
                const parsed_url = url_module.parse(req_path, true);
                parsed_url.args = { numeric: 12345 };
                expect(request_url).toEqual(parsed_url);
                // passthrough request body
                expect(request_body).toEqual(body);
                // passthrough headers
                expect(request_headers).toEqual(headers);
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, route);
            router['_middleware'](router['_routes'], method, req_path, body, headers, () => {
                return Promise.resolve(new index_10.Response(''));
            });
        });
        /**
         *
         */
        test('test route function with string template gets the proper context and arguments', () => {
            expect.assertions(3);
            const router = new index_9.SimpleRouter();
            const path = '/$string';
            const req_path = '/hello';
            const method = 'GET';
            const body = '{"harvey": "birdman"}';
            const headers = { bojack: 'horseman' };
            const route = (request_url, request_body, request_headers) => {
                // parsed url
                const parsed_url = url_module.parse(req_path, true);
                parsed_url.args = { string: 'hello' };
                expect(request_url).toEqual(parsed_url);
                // passthrough request body
                expect(request_body).toEqual(body);
                // passthrough headers
                expect(request_headers).toEqual(headers);
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, route);
            router['_middleware'](router['_routes'], method, req_path, body, headers, () => {
                return Promise.resolve(new index_10.Response(''));
            });
        });
        /**
         *
         */
        test('test route that throws an exception is handled properly', () => {
            expect.assertions(1);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            const error_message = 'blah blah blah';
            const fn = () => {
                throw new Error(error_message);
            };
            router.addRoute(method, path, fn);
            expect(() => {
                router['_middleware'](router['_routes'], method, path, '', {}, () => {
                    return Promise.resolve(new index_10.Response(''));
                });
            }).toThrow(new Error(error_message));
        });
        /**
         *
         */
        test('test route successfully returns value out of the middleware', () => {
            expect.assertions(1);
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            const fn = () => {
                return Promise.resolve(new index_10.Response('route'));
            };
            router.addRoute(method, path, fn);
            const route_hit = router['_middleware'](router['_routes'], method, path, '', {}, () => {
                return Promise.resolve(new index_10.Response(''));
            });
            route_hit.then((response) => {
                expect(response.body).toEqual('route');
            });
        });
        /**
         *
         */
        test('test next successfully returns value out of the middleware', () => {
            const router = new index_9.SimpleRouter();
            const path = '/';
            const method = 'GET';
            const fn = () => {
                return Promise.resolve(new index_10.Response('true'));
            };
            router.addRoute(path, 'PUT', fn);
            const route_hit = router['_middleware'](router['_routes'], method, path, '', {}, () => {
                return Promise.resolve(new index_10.Response('next'));
            });
            route_hit.then((response) => {
                expect(response.body).toEqual('next');
            });
        });
        /**
         *
         */
        test('test applyMiddleware can call the middleware properly', () => {
            expect.assertions(1);
            const road = new index_10.Road();
            const router = new index_9.SimpleRouter();
            router.applyMiddleware(road);
            const path = '/';
            const method = 'GET';
            let route_hit = '';
            const fn = () => {
                route_hit = 'route';
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, fn);
            road.request(method, path, '');
            expect(route_hit).toEqual('route');
        });
        /**
         *
         */
        test('test routes with query params route properly', () => {
            expect.assertions(1);
            const road = new index_10.Road();
            const router = new index_9.SimpleRouter();
            router.applyMiddleware(road);
            const path = '/';
            const method = 'GET';
            let route_hit = '';
            const fn = () => {
                route_hit = 'route';
                return Promise.resolve(new index_10.Response(''));
            };
            router.addRoute(method, path, fn);
            road.request(method, `${path}?foo=bar`);
            expect(route_hit).toEqual('route');
        });
        test('test routes loaded from a file', () => {
            expect.assertions(5);
            const road = new index_10.Road();
            const router = new index_9.SimpleRouter();
            router.applyMiddleware(road);
            return router.addRouteFile(router_file_test_path)
                .then(() => {
                return Promise.all([
                    road.request('GET', '/'),
                    road.request('POST', '/'),
                    road.request('GET', '/test'),
                    //Bad Method
                    road.request('POST', '/test'),
                    //Bad Path
                    road.request('GET', '/fakeurl')
                ]).then(results => {
                    expect(results[0]).toEqual(new index_10.Response('root get successful'));
                    expect(results[1]).toEqual(new index_10.Response('root post successful'));
                    expect(results[2]).toEqual(new index_10.Response('test get successful'));
                    expect(results[3]).toEqual(new index_10.Response('Page not found', 404));
                    expect(results[4]).toEqual(new index_10.Response('Page not found', 404));
                });
            });
        });
        test('test routes loaded from a file with prefix', () => {
            expect.assertions(5);
            const road = new index_10.Road();
            const router = new index_9.SimpleRouter();
            router.applyMiddleware(road);
            return router.addRouteFile(router_file_test_path, '/test_prefix')
                .then(() => {
                return Promise.all([
                    road.request('GET', '/test_prefix'),
                    road.request('POST', '/test_prefix'),
                    road.request('GET', '/test_prefix/test'),
                    //Bad Method
                    road.request('POST', '/test_prefix/test'),
                    //Bad Path
                    road.request('GET', '/test_prefix/fakeurl')
                ]).then(results => {
                    expect(results[0]).toEqual(new index_10.Response('root get successful'));
                    expect(results[1]).toEqual(new index_10.Response('root post successful'));
                    expect(results[2]).toEqual(new index_10.Response('test get successful'));
                    expect(results[3]).toEqual(new index_10.Response('Page not found', 404));
                    expect(results[4]).toEqual(new index_10.Response('Page not found', 404));
                });
            });
        });
    });
});
define("tests/__tests__/middleware/testStoreVals", ["require", "exports", "index"], function (require, exports, index_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('Store Values', () => {
        test('test storeVal and getVal functions are properly applied to middleware', () => {
            expect.assertions(2);
            const context = {};
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            index_11.storeValsMiddleware.call(context, 'a', 'b', 'c', {}, function () { });
            expect(typeof (context.storeVal)).toEqual('function');
            expect(typeof (context.getVal)).toEqual('function');
        });
        /**
         * Test that the title is properly set to the request context
         */
        test('test storeVal and getVal work as expected', () => {
            expect.assertions(1);
            const context = {};
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            index_11.storeValsMiddleware.call(context, 'a', 'b', 'c', {}, function () { });
            context.storeVal('foo', 'bar');
            expect(context.getVal('foo')).toEqual('bar');
        });
    });
});
define("tests/__tests__/road/testBuildNext", ["require", "exports", "index", "index"], function (require, exports, index_12, index_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Note: This file used to have many more tests, but a recent roads change invalidated most of them, and the
    //	migration to jest made it clear that many of them were
    // covered by other tests (context, multi use, etc)
    describe('road buildNext test', () => {
        /**
         * Test buildNext success when a route does not have an onRequest handler
         */
        test('build next hits', () => {
            expect.assertions(1);
            const road = new index_12.Road();
            return expect(road['_buildNext']('GET', '/', '', {}, {
                request: function () { return Promise.resolve(new index_13.Response('')); },
                Response: index_13.Response
            })()).resolves.toEqual(new index_13.Response('Page not found', 404, {}));
        });
    });
});
define("tests/__tests__/road/testRoadContext", ["require", "exports", "index"], function (require, exports, index_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('Road Context', () => {
        /**
         * Ensure that the request context is the context provided in the Road constructor
         */
        test('Road Context Contains Request Method', () => {
            expect.assertions(1);
            const response_string = 'blahblahwhatwhatwhat';
            const road = new index_14.Road();
            road.use(function (method, url, body, headers) {
                return __awaiter(this, void 0, void 0, function* () {
                    switch (method) {
                        case 'GET':
                            return this.request('POST', '/');
                        case 'POST':
                            return response_string;
                        default:
                            throw new Error('not supposed to happen');
                    }
                });
            });
            return expect(road.request('GET', '/')).resolves.toEqual({
                status: 200,
                body: response_string,
                headers: {}
            });
        });
        /**
         * Ensure that the request context is the context provided in the Road constructor
         */
        test('Road Context Persists', () => {
            expect.assertions(1);
            const response_string = 'blahblahwhatwhatwhat';
            const road = new index_14.Road();
            road.use(function (method, url, body, headers, next) {
                this.confirmString = function () {
                    return response_string;
                };
                return next();
            });
            road.use(function (method, url, body, headers, next) {
                return this.confirmString();
            });
            return expect(road.request('GET', '/')).resolves.toEqual({
                status: 200,
                body: response_string,
                headers: {}
            });
        });
        /**
         * Ensure that the request context is the context provided in the Road constructor
         */
        test('Road Async Context Persists', () => {
            expect.assertions(1);
            const response_string = 'blahblahwhatwhatwhat';
            const road = new index_14.Road();
            road.use(function (method, url, body, headers, next) {
                return __awaiter(this, void 0, void 0, function* () {
                    this.confirmString = function () {
                        return response_string;
                    };
                    return yield next();
                });
            });
            road.use(function (method, url, body, headers, next) {
                return this.confirmString();
            });
            return expect(road.request('GET', '/')).resolves.toEqual({
                status: 200,
                body: response_string,
                headers: {}
            });
        });
        /**
         * Ensure that contexts are only added once to a resource.
         */
        test('Road Async Uniqueness', () => {
            expect.assertions(1);
            const road = new index_14.Road();
            road.use(function (method, url, body, headers, next) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield next();
                });
            });
            expect(road['_request_chain'].length).toEqual(1);
        });
    });
});
define("tests/__tests__/road/testRoadRequest", ["require", "exports", "index", "index"], function (require, exports, index_15, index_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('road request', () => {
        /**
         * Ensure that the basic request system lines up
         */
        test('Request', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            return expect(road.request('GET', '/', 'yeah', {
                one: 'two'
            })).resolves.toEqual({
                status: 404,
                headers: {},
                body: 'Page not found'
            });
        });
        /**
         * Ensure that route errors naturally bubble up through the promise catch
         */
        test('Method With Error', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            road.use(function () {
                throw new Error('huh');
            });
            return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
        });
        /**
         * Ensure that route errors naturally bubble up through the promise catch
         */
        test('Async Method With Error', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            road.use(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    throw new Error('huh');
                });
            });
            return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
        });
        /**
         * Ensure that a request handler that executes, then calls the actual route returns as expected
         */
        test('Request With Multiple Handlers Called', () => {
            expect.assertions(2);
            const road = new index_15.Road();
            let step1 = false;
            let step2 = false;
            road.use(function (method, url, body, headers, next) {
                step1 = true;
                return next();
            });
            road.use(function (method, url, body, headers, next) {
                step2 = true;
                return next();
            });
            return road.request('GET', '/').then(function (response) {
                expect(step1).toEqual(true);
                expect(step2).toEqual(true);
            });
        });
        /**
         * Ensure that a request handler that executes, then calls the actual route returns as expected
         */
        test('Request Error With Handler', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            road.use(function (method, url, body, headers, next) {
                return next();
            });
            road.use(function () {
                throw new Error('huh');
            });
            return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
        });
        /**
         * Ensure that a request handler that executes, then calls the actual route returns as expected
         */
        test('Async Request Error With Handler', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            road.use(function (method, url, body, headers, next) {
                return next();
            });
            road.use(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    throw new Error('huh');
                });
            });
            return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
        });
        /**
         * Ensure that you can handle errors properly from the request handler
         */
        test('Request Error With Handler That Catches Errors', () => {
            expect.assertions(1);
            const road = new index_15.Road();
            const middleware = function (method, url, body, headers, next) {
                return next()
                    .catch(function (error) {
                    return new index_16.Response(JSON.stringify({ error: error.message }), 200);
                });
            };
            road.use(middleware);
            road.use(function () {
                throw new Error('huh');
            });
            return expect(road.request('GET', '/')).resolves.toEqual({
                status: 200,
                headers: {},
                body: '{"error":"huh"}'
            });
        });
    });
});
define("tests/__tests__/road/testRoadUse", ["require", "exports", "index"], function (require, exports, index_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('road use', () => {
        /**
         * Test that the use function returns itself for viable chaining
         */
        test('Use Returns Self', () => {
            expect.assertions(1);
            const road = new index_17.Road();
            expect(road.use(function (method, path, body, headers, next) {
                return next();
            })).toEqual(road);
        });
    });
});
