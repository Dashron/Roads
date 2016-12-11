# The Roads.js isomorphic web framework

Roads is a web framework built on Generators. It's similar to Koa.js, but can be used both in the browser and on the server.

# Why should I use Roads?

1. Roads can be attached to any node HTTP server, including Koa.js, Express.js, and the built in node HTTP server.
2. Roads is isomorphic, meaning you can generate html on the server or in the browser with the same code.
3. Roads lets you work without callbacks. It's built on top of promises and generator-based coroutines.
4. Roads can be run without ever attaching it to an HTTP server. This is great for writing tests, working with web sockets, or writing API first websites. 


# Build Status
![Build status](https://travis-ci.org/Dashron/roads.svg?branch=master)

# Index

 - [Getting Started](#getting-started)
 - [Roads.Road](#roadsroad)
  - [new Road()](#new-road)
  - [use(*Function* fn)](#roadusefunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *Object* headers)](#roadrequeststring-method-string-url-dynamic-body-object-headers)
 - [Roads.Response](#roadsresponse)
  - [new Response(*mixed* body, *number* status, *Object* headers)](#new-responsemixed-body-number-status-object-headers)
  - [body](#body)
  - [status](#status)
  - [headers](#headers)
  - [writeTo(*ServerResponse* httpResponse)](#responsewritetoserverserverresponse-http_response)
 - [Roads.HttpError](#roadshttperror)
  - [new HttpError(*string* message, *number* code)](#new-httperrorstring-message-number-code)
 - [Roads.middleware](#roadsmiddleware)
  - [killSlash()](#killslash)
  - [cors(*Array|string* allow_origins, *Array* allow_headers)](#corsarraystring-allow_origins-array-allow_headers)
  - [SimpleRouter](#simplerouter)
   - [SimpleRouter.applyMiddleware(road)](#simplerouterapplymiddlewareroad)
   - [Road.addRoute(*string* method, *string* path,*function* fn)](#roadaddroutestring-method-string-path-function-fn)
 - [Roads.build](#roadsbuildstring-input_file-string-output_file-object-options)
 - [Roads.PJAX(*Object* road, *DomElement* container_element, *Object* window)](#roadspjaxobject-road-domelement-container_element-object-window)
  - [register()](#pjaxregister)
  - [PJAX Link Format](#pjax-link-format)
  - [PJAX Page titles](#pjax-page-titles)
  - [Isomorphic PJAX tips](#isomorphic-pjax-tips)

## Getting Started

Building a project with roads is very straightforward.

1. Create your Road object
    ```
    const roads = require('roads');
    var road = new Road();
	```

2. Add code to the road
    ```
    const roads = require('roads');
    var road = new Road();
    road.use(function (method, path, body, headers) {
        console.log('A ' + method + ' request was made to ' + path);
    });
    ```

5. Now you want to run your code. There are four options in this library.

 - You can tie the road to node's standard HTTP Server. This will automatically route any HTTP requests to that server into your road.
        ```node
        const roads = require('roads');

        var road = ...; // See steps 1 and 2 for road construction
        var server = new roads.Server(road, function (error) {
            console.log('roads encountered an error', error);
        });

        server.listen(8080);
        ```

 - You can use the road as a router for your Koa.js server.
        ```node
        // Tie to node's HTTP server
        const roads = require('roads');
        const koa = require('koa');

        var road = ...; // See steps 1 and 2 for road construction
        var app = koa();
        app.use(roads.integrations.koa(road));
        app.listen(8080);
        
        ```

 - You can Manually execute a resource method. This will behave just like a web request without having to use HTTP.

	```node
        // Tie to node's HTTP server
        const roads = require('roads');

        var road = ...; // See steps 1 and 2 for road construction

    	// Call directly
    	road.request('GET', '/users', {page: 2})
    	    .then(function (response) {
    	        console.log(response);
    	    });
	```
 - You can use browserify to compile everything for use in the browser.
    
    **client_index.js**
    ```node
        const roads = require('roads');
        var road = ...; // See steps 1 and 2 for road construction

        // Make a client side request. See the PJAX section of the docs for more client side options
        road.request('GET', '/users', {page: 2})
            .then(function (response) {
                console.log(response);
            });

    ```

    **build.js**
    ```node
        require('roads').build('client_index.js', '/build/client.js', {
            roads: {
                output_file: './build/roads.js',
            }
        });

    ```


Now that you can use your road, continue reading the docs below for more information on [routers](#simplerouter), [error handling](#roadusefunction-fn), [PJAX support](#roadspjaxobject-road) and more!



## Roads.Road

A Road is a container that holds an array of functions. It exposes a [request](#requeststring-method-string-url-dynamic-body-object-headers) method which allows you to execute the functions and provide consistent parameters..

### new Road()
**Create a Road.**

Creates your Road object. 

```node
const roads = require('roads');
var road = new roads.Road();
```


### Road.use(*Function* fn)
**Add a custom function that will be executed before every request.**

This function can be called one or more times. Each time it is called, the provided function will be added to a queue that is executed when you call the [request](#roadrequeststring-method-string-url-dynamic-body-object-headers) method. The execution order will match the order the functions were added to the road. Each function can choose whether or not it wants to progress to the following middleware function by calling or ignoring the `next` method.

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(*string* method, *string* url,*object* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the object.
 
 This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters:
 
#### use Callback 
**function (*string* method,*string* url, *Object* body, *Object* headers, *Function* next)**

name     | type                               | description
 --------|------------------------------------|---------------
 method  | string                             | The HTTP method that was provided to the request
 url     | string                             | The URL that was provided to the request
 body    | object                             | The body that was provided to the request, after it was properly parsed into an object
 headers | object                             | The headers that were provided to the request
 next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.

If the callback does not return a [response](#roadsresponse) object, the return value will become the body of a new [response](#roadsresponse) object with the default status code of 200.

```node
// Example of a request handler that kills trailing slashes (This is provided for you in the middleware!)
// The main logic of this function will be executed before the resource method, because it all happens before the middleware calls next()
road.use(function (method, url, body, headers, next) {
	// kill trailing slash as long as we aren't at the root level
    if (url.path != '/' && url.path[url.path.length - 1] === '/') {
        return new roads.Response(null, 302, {
            location: url.path.substring(0, url.path.length - 1)
        });
    }

    return next();
});

// Example of a request handler that catches errors and returns Response objects
// The main logic of this function will execute after the resource method,  because it all happens after the middleware calls next()
road.use(function(method, url, body, headers, next) {
    // execute the actual resource method, and return the response
    return next()
        // Catch any errors that are thrown by the resources
        .catch (function (err) {
            // Wrap the errors in response objects. If they are [HttpErrors](#roadshttperror) we adjust the status code
            switch (err.code) {
                case 404:
                    return new roads.Response(notFoundRepresentation(err), 404);
                case 405:
                    return new roads.Response(notAllowedRepresentation(err), 405);
                case 500:
                default:
                    return new roads.Response(unknownRepresentation(err), 500);
            }
        });
});
```


### Road.request(*string* method, *string* url, *dynamic* body, *Object* headers)
**Locate and execute the resource method associated with the request parameters.**


This function will execute all of the functions assigned via [use](#roadusefunction-fn) in the order they were assigned and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.

If the system encounters an unexpected error, it will try to throw an [HttpError](#roadshttperror) with a 500 status code. There may be circumstances where we were unable to wrap the exception with an HttpError, so be sure to check whether or not your exceptions are `instance of HttpError`.


```node
var promise = road.request('GET', '/users/dashron');

promise.then(function (response) {        
    console.log(response);
});

promise.catch(function (error) {
    console.log(error);
});
```

##### Context
Each middleware function has access to a request context through ```this```. Each ```this``` will be unique to the request, and will persist from each request handler (assigned via `use`) into the actual request. The context is pre-loaded with two variables, listed below.

name             | type     | description
 ----------------|----------|---------------
request          | function | An alias for [Road.request](#roadrequeststring-method-string-url-dynamic-body-object-headers). If you need to make a request from within middleware, it is recommended to use this instead of `Road.request`.
Response         | Response | The Response constructor. Every request *should* return a `Response`, so this is provided to simplify the process. If you are constructing a `Response` from within middleware it is recommended that you use this instead of `Roads.Response`.


```node
var road = new Road();
road.use(function (method, url, body, headers) {
    // true because the middleware persists to this context
    console.log(this.uri === '/me');


    // Easy access to the response object
    return new this.Response('hello world', 200);
});

road.request('GET', '/me').then(function (response) {
    console.log(response);
});
```

Middleware is encouraged to add variables to this context to simplify development. Make sure to namespace your variables to ensure there are no conflicts with other librares.

eg:
```node
var road = new Road();
road.use(function (method, url, body, headers) {
    this.context.my_project.require_authentication = true;
});
```

## Roads.Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers. 


### new Response(*mixed* body, *number* status, *Object* headers)
**Constructor**

name        | type                               | description
 -----------|------------------------------------|---------------
 body       | mixed                              | The body of the response.
 status     | number                             | The HTTP Status code.
 headers    | object                             | Key value pairs of http headers.

Create a response object. 

```node
new Response({"uri": "..."}, 200, {"last-modified":"2014-04-27 00:00:00"});
```

### Body
**The raw JavaScript object returned by the request**

```node
console.log(response.body);
```

### Status
**The HTTP status returned by the request**

```node
console.log(response.status);
```

### Headers
**A JavaScript object of all response headers**

```node
console.log(response.headers);
```


### Response.writeToServer(*ServerResponse* http_response)
**A helper function to write the response object to a server response**

This will apply the body, status code, and any applicable headers to the provided http_response. It will not end the response, so you need to do that yourself. If the body is a JavaScript object, and no content-type header is set, the response will be sent through JSON.stringify, and the content-type header will be set to `application/json`.

```node
// Use middleware to automatically apply a response wrapper
road.use(roads.middleware.standard());

// execute the route logic and retrieve the appropriate response object
road.request(http_request.method, http_request.url, body, http_request.headers)
    .then(function (response) {
        // Write the response to the server
        response.writeToServer(http_response);
        http_response.end();
    })
    .catch(function (error) {
        // be careful throwing an error in a response like this
        // errors might expose sensitive data
        (new roads.Response(error, 500)).writeToServer(http_response);
        http_response.end();
    });
```


## Roads.HttpError

### new HttpError(*string* message, *number* code)
**A helper error, that contains information relevant to common HTTP errors**

name        | type                               | description
 -----------|------------------------------------|---------------
 message    | string                             | A message describing the HTTP error
 code       | number                             | An official [http status code](#http://www.httpstatus.es)

```node
throw new Roads.HttpError('Page not found', 404);
```

### Constants

These constants make it easier to keep track of some common error status codes. For more information on what they mean, check out (httpstatus.es)[http://httpstatus.es]

```
HttpError.invalid_request = 400;
HttpError.unauthorized = 401;
HttpError.forbidden = 403;
HttpError.not_found = 404;
HttpError.method_not_allowed = 405;
HttpError.not_acceptable = 406;
HttpError.conflict = 409;
HttpError.gone = 410;
HttpError.unprocessable_entity = 422;
HttpError.too_many_requests = 429;
HttpError.internal_server_error = 500;
```

## Roads.middleware

### killSlash()
**Middleware to kill the trailing slash on http requests**

If used, any url that ends with a trailing slash will return a response object redirecting the client to the same url without the trailing slash (302 redirect with Location: [url_without_slash])

```node
road.use(roads.middleware.killSlash);
```

### cors(*Array|string* allow_origins, *array* allow_headers)
**Middleware to Apply proper cors headers**

Sets up the proper preflight, and standard repsonse headers so that browsers can make proper CORS requests.

name            | type                               | description
 ---------------|------------------------------------|---------------
 allow_origins  | Array|string                       | Either * to allow all origins, or an explicit list of valid origins.
 allow_headers  | Array                              | (optional) A white list of headers that the client is allowed to send in their requests

```node
road.use(roads.middleware.cors(['http://localhost:8080'], ['authorization']));
```

### SimpleRouter()

**TODO:** Docs. See the testSimpleRouter.js file in the meanwhile.

#### SimpleRouter.applyMiddleware(road)

#### Road.addRoute(*string* method, *string* path, *function* fn)


## Roads.build(*string* input_file, *string* output_file, *object* options)
**Browserify function to convert your script to run in the browser**

name                    | type                               | description
 -----------------------|------------------------------------|---------------
 input_file             | string                             | The source file that will be converted to use in the browser
 output_file            | string                             | The output file that will be accessible by your browser
 options                | object                             | A set of options that can influence the build process. See all fields below
 options.babelify       | object                             | An object containing parameters to pass to the babelify transform
 options.envify         | object                             | An object to pass to envify. This allows you to change values between your server and client scripts.
 options.exclude        | array                              | An array of files that should not be included in the build process.
 options.external       | array                              | An array of dependencies that should be included from exernal resources instead of built into the project
 options.use_sourcemaps | boolean                            | Whether or not the build process should include source maps.


```
require('roads')
    .build(__dirname + '/static/client.js', __dirname + '/static/client.brws.js', {
        use_sourcemaps: true,
        external: {
            roads: {
                output_file: __dirname + '/static/roads.brws.js',
            }, 
            react: {
                output_file: __dirname + '/static/react.brws.js',
            }
        },
        babelify: {presets: ['react']}
    });
```

## Roads.PJAX(*Object* road, *DomElement* container_element, *Object* window)
**A helper object to easily enable PJAX on your website using roads**

PJAX stands for pushState + AJAX. PJAX a technique for speeding up webpages by replacing certain links on the page with AJAX calls. To enable PJAX, you must create a PJAX object and call the register method. Until you call register, PJAX links will not be handled properly.

### PJAX.register()

On page load, you will need to construct and register your PJAX handler. When you click certain links in the container element, PJAX will intercept the action and instead use roads to generate the new page content. Once the new html is ready, it will replace the innerHTML of the container_element.

This allows for clean, quick page refreshes via JavaScript, with a safe, JavaScript free fallback (the links will still work as normal without JavaScript!).

```
var road = ...; // Incomplete. See the getting started section for more information about creating a road
var pjax = new require('roads').PJAX(road, document.getElementById('container'), window);
pjax.register();
```

### PJAX Link Format

If you would like a link to run via PJAX instead of a new page load, simply add the following data attribute

`data-roads="link"`

e.g.

`<a href="/home" data-roads="link">Home</a>`

### PJAX Page titles

To handle page titles you will need to add matching middleware to your server, and your client road. Roads already includes a simple form of this via the setTitle middleware, and the PJAX function addTitleMiddleware.

Your server should include the following:

```node
var roads = require('roads');
var road = ...; // Incomplete. See the getting started section for more information about creating a road
road.use(roads.middleware.setTitle);
```

```node

var roads = require('roads');
var road = ...; // Incomplete. See the getting started section for more information about creating a road

var pjax = new roads.PJAX(road);
pjax.addTitleMiddleware();
pjax.register(window, document.getElementById('container'));
```

### Isomorphic PJAX tips

There's a very easy pattern to follow to ensure sharing client and server code works successfully via PJAX.

1. Your layout (everything wrapping the PJAX container) should be added via middleware. This middleware should not be used when built in the client.
2. You should have one road that contains all of your public controllers, and one road that contains all of your private controllers
3. Your public controller should only contain public data, and interact with the rest of your system via HTTP. e.g. instead of making DB calls, these controllers would make HTTP requests to a separate API. This pattern is GREAT, and worthy of another entire article.
4. Private controllers aren't absolutely necessary, but may come into play if you need authentication or filesystem access for certain pages.


### TODO:

- Now that the opinionated router has been split out, it needs to be rebuilt into middleware, matching simplerouter as closely as possible.
- Improved PJAX test coverage
- Unit tests for HTTPServer class
- Examples of koa and other middleware
- Revise documentation to more clearly describe new middleware-only system
- Add code coverage libraries
- Directly reference the field-filter system from this library (or just build that new representation class)
- Should roads-client be in this library?
