# The Roads.js isomophic web framework

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
  - [new Road(*Resource|array* root_resource)](#new-roadresourcearray-root_resource)
  - [use(*Function* fn)](#roadusefunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *Object* headers)](#roadrequeststring-method-string-url-dynamic-body-object-headers)
  - [addResource(*Resource* resource)](#roadaddresourceresource-resource)
 - [Roads.Resource](#roadsresource)
  - [new Resource(*Object* definition)](#new-resourceobject-definition)
  - [URL Part (routing)](#url-part-routing)
  - [Resource method](#resource-method)
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
 - [Roads.build](#roadsbuildstring-input_file-string-output_file-object-options)
 - [Roads.PJAX(*Object* road)](#roadspjaxobject-road)
  - [register(*Object* window, *DomElement* container_element)](#pjaxregisterobject-window-domelement-container_element)
  - [PJAX Link Format](#pjax-link-format)
  - [PJAX Page titles](#pjax-page-titles)
  - [Isomorphic PJAX tips](#isomorphic-pjax-tips)

## Getting Started

Building a project with roads is very straightforward.

1. Create your root [Resource](#roadsresource). This resource will be used for any request to the root (`/`) endpoint. Other endpoints will be defined in step 4.
	```node
	// Create your resource.
	var resource = new roads.Resource({
	    // Define the supported HTTP methods. See step 2 for more details
	    methods: ...
	});

	// Assign your root resource to the Road.
	var road = new roads.Road(resource);
	```

2. Each [Resource](#roadsresource) from step #1 should contain one or more [resource methods](#resource-method). Each resource method is associated with an HTTP method.
	```node
	var resource = new roads.Resource({
        // Define the supported HTTP methods.
	    methods: {
	        // Whenever a GET request is made to this resource, it will execute the following function
	        GET: function (url, body, headers) {
	            // URL is parsed via the url module. The following code will access the querystring parameter "page"
	            url.query.page;
	
	            // JSON or query body, parsed depending on the content-type header.
	            body.name;
	
	            // Incomplete, see step 3.
	            return ...
	        }
	    }
	});
	```
**note:** Resource methods are not required. If you do not include any resource methods, roads will still search through all sub-resources.

3. Each [resource method](#resource-method) from step #2 should return your response. If you return a promise which will be resolved and the response/errors will be handled appropriately. If you do not return (or your promise does not resolve) a [response](#roadsresponse) object it will be automatically wrapped in a response object.

	```node
	var resource = new roads.Resource({
        // Define the supported HTTP methods.
	    methods: {
	        GET: function (url, body, headers) {
	            // Perform your route logic, see step 2.
	            ...
	
	            // Build a response object, with the body, status code and headers.
	            return new this.Response({ "name": "aaron" }, 200, {"last-modified": "Tue, 15 Nov 1994 12:45:26 GMT"});
	        }
	    }
	});
	```

4. Assign sub-resources to the root resource. These will be attached to endpoints under this resource (e.g. `/` contains `/users`. `/users` will contain `/users/#user_id`) All subresources are resources objects like the root resource defined in step 1, so you can continue to follow steps 1-4 to build out your sub resources.

    ```node
    var resource = new roads.Resource({
        // Define the supported HTTP methods. See steps 2 and 3.
        methods: ... ,
        // Define sub-resources. 
        resources:         {
            // This assumes the file located at `./users` exposes another `Resource` object. That resource will be bound to the route `/users`.
            "users": require('./users'),
            // This assumes the file located at `./posts` exposes another `Resource` object. That resource will be bound to the route `/posts`.
            "posts": require('./posts')
        },
    });
    ```

5. Now you want to run your code. There are four options in this library.

 - You can tie the road to node's standard HTTP Server. This will automatically route any HTTP requests to that server into your road.
        ```node
        // Tie to node's HTTP server
        const roads = require('roads');

        var road = ...; // See steps 1-4 for road construction
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

        var road = ...; // See steps 1-4 for road construction
        var app = koa();
        app.use(roads.integrations.koa(road));
        app.listen(8080);
        
        ```

 - You can Manually execute a resource method. This will behave just like a web request without having to use HTTP.

	```node
        // Tie to node's HTTP server
        const roads = require('roads');

        var road = ...; // See steps 1-4 for road construction

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
        var road = ...; // See steps 1-4 for road construction

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


Now that you can use your road, continue reading the docs below for more information on [error handling](#roadusefunction-fn), [URL parameters](#url-part), [PJAX support](#roadspjaxobject-road) and more!



## Roads.Road

A Road is a container that holds a hierarchy of [Resource](#roadsresource) objects. It exposes a [request](#requeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with the resources.

### new Road(*Resource|array* root_resource)
**Create a Road.**

 name          | type                                | required | description
 --------------|-------------------------------------|----------|-------------
 root_resource | [Resource](#roadsresource) or array | yes      | Used to generate the [response](#roadsresponse) for the root endpoint ( [protocol]://[host]/ ). Also determines the starting point for routing for the [request](#requeststring-method-string-url-dynamic-body-object-headers) method.

Creates your Road object. You must provide at least one root [Resource](#roadsresource) to the constructor. These [resources](#roadsresource) will be mounted to the root (`/`) endpoint. The [request](#requeststring-method-string-url-dynamic-body-object-headers) method will search these [resources](#roadsresource) for a matching route. If you provide an array of [resources](#roadsresource) is, it will search through them in array order. 


```node
const roads = require('roads');
var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at [Resource](#roadsresource) for information about the Resource constructor.
// Create a road with a single resource
var road = new roads.Road(root_resource);
```

```node
const roads = require('roads');
var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at [Resource](#roadsresource) for information about the Resource constructor.
var root_resource2 = new roads.Resource(...); 
// Create a road with multiple resources. If the route is found in root_resource, request will never search root_resource2
var road = new roads.Road([root_resource, root_resource2]);
```

### Road.use(*Function* fn)
**Add a custom function that will be executed before every request.**

This function can be called one or more times. Each time it is called, the provided function will be added to a queue that is executed before every request. The execution order will match the order the middleware functions were added to the road. Each middleware function can choose whether or not it wants to progress to the following middleware function, and ultimately the final [resource method](#resource-method).

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


This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.

If no [resource](#resource) is found for the requested url, the [thenable](http://wiki.commonjs.org/wiki/Promises/A) will surface an [HttpError](#roadshttperror) with a 404 status code.

If a [resource](#resource) is found for the requested url, but no [resource method](#resource-method), the [thenable](http://wiki.commonjs.org/wiki/Promises/A) will surface an [HttpError](#roadshttperror) with a 405 status code.

If the system encounters an unexpected error, it will try to throw an [HttpError](#roadshttperror) with a 500 status code, but it's always worth checking the error type just in case.


```node
var promise = road.request('GET', '/users/dashron');

promise.then(function (response) {        
    console.log(response);
});

promise.catch(function (error) {
    console.log(error);
});
```

### Road.addResource(*Resource* resource)
**Add another resource for the router.**

This resource will be added to the end of the array of resources passed in through the [constructor](#new-roadresourcearray-root_resource). Read up on more details in the [constructor's docs](#new-roadresourcearray-root_resource).

## Roads.Resource

Each resource represents a single endpoint. It can contain a list of sub-resources (to help build a structured url path), or [resource methods](#resource-method) (to handle each HTTP method for this endpoint).


### new Resource(*Object* definition)
**Constructor**

name        | type                               | description
 -----------|------------------------------------|---------------
 definition | object                             | A definition which describes how the resource should operate

The definition only looks for three fields.

name        | type                               | description
 -----------|------------------------------------|---------------
 resources  | object                             | Each key is a [URL part](#url-part), and each value is a sub-[resource](#roadsresource)
 methods    | object                             | Each key is an HTTP method, and each value is a [resource method](#resource-method).
 context    | mixed                              | The value of the Resource context will appear in the [context](#context) of every [resource method](#resource-method) with the key `resource_context`

```node
module.exports.many = new Resource({
    resources: {
        'users': require('./users').many,
        'posts': require('./posts').many
    },
    methods: {
        GET: function* (url, body, headers) {
            return new Response({
                "users": "/users",
                "posts": "/posts"
            });
        }
    }
});
```

#### URL Part (routing)

All URL routing is defined through the resource definition, and through sub-resources. The root resource represents a URL without any path ([protocol]://[host]/). This root resource must define additional resources as sub-resources, which will branch out after the root resource.

Part       | Example   | Example values | Description
-----------|-----------|----------------|--------------
{literal}  | users     | users          | The provided value must explicitly match the [URL part](#url-part)
#{key}     | #user_id  | 12445          | The provided value must be numeric
${key}     | #username | dashron        | The provided value can be any series of non-forward slash, URL valid characters

In the following example, the only valid URLs are `/`, `/users` and `/users/{number}`

```node
var single = new Resource({
});

var many = new Resource({
    resources: {
        "#user_id": single
    }
});

var root = new Resource({
    resources: {
        "users": many
    }
});
```

For variable fields, you can retrieve the variable in the URL parameter. The URL parameter will be an object, and will have an "args" parameter

```node
var single = new Resource({
    methods: function (url, body, headers) {
        console.log(url.args.user_id);
    }
});

var many = new Resource({
    resources: {
        "#user_id": single
    }
});

var root = new Resource({
    resources: {
        "users": many
    }
});
```

#### Resource Method

The methods section of the resource definition should be an object which contains many key value pairs. The keys must be one of the HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, etc). The value for these keys must be an object, a function, or a generator. These are called "[resource methods](#resource-method)". Resource methods are used by [Road.request](#roadrequeststring-method-string-url-dynamic-body-object-headers) when trying to run your program. First `request` finds the resource from the request path, and then the [resource method](#resource-method) from the request method.  

##### Resource Method Functions

If you provide a function, this function will be executed any time the corresponding HTTP method is run. This function will be passed three parameters.

name     | type                               | description
 --------|------------------------------------|---------------
 url     | string                             | The URL of the request. Is parsed with the standard url module.
 body    | object                             | The request body. If the `Content-Type` header is `application/json` the body will be parsed into an object.
 headers | object                             | The request headers


```node
var road = new Road(new Resource({
    methods: {
        GET: function (url, body, headers) {
            return 'Welcome!';
        }
    }
}));

##### Resource Method Generators

If you provide a generator function as your resource method, we will turn it into a coroutine. Coroutines mimic ES7 async functions by letting you yield promises. It lets you drastically improve the readability of your code. If you would like to read more about coroutines, check out my blog post here: 

```node
var road = new Road(new Resource({
    methods: {
        GET: function* (url, body, headers) {
            try {
                var user = yield db.User(url.args.user_id);
            } catch (e) {
                console.log(e);
            }
        }
    }
}));
```

##### Resource Method Objects

If you provide an object instead of a function or a generator, this allows you to define the resource method's function along with additional contextual data that will exist in the request context. The resource method must be provided as the value to the key `fn`. Within the context of fn, you can find the entire resource method object on the key "method_context".

```node
var road = new Road(new Resource({
    methods: {
        GET: {
            fn: function (url, body, headers) {
	            return 'Welcome to ' + this.method_context.route_name + "!";
        	},
            route_name: "here"
        }
    }
}));
```

As always, this context information will also be available to all middleware

```js
road.use(function (method, url, body, headers, next) {
    if (this.method_context.route_name) {
        console.log(this.method_context.route_name);
    }

    return next(); 
});
```

##### Errors
If a resource could not be located for the provided request path, the request method will throw an [HttpError](#roadshttperror) with a 404 status code.

```node
road.request('GET', '/invalidpath')
    .catch(function (error) {
        error.status === 404
    });
```

If a resource was located for the provided request path, but the resource did not have a matching [resource method](#resource-method), the request method will throw an [HttpError](#roadshttperror) with a 405 status code.

```node
road.request('FAKE_METHOD', '/users')
    .catch(function (error) {
        error.status === 405
    });
```

##### Context
Each resource method has access to a request context through ```this```. Each ```this``` will be unique to the request, and will persist from each request handler (assigned via `use`) into the actual request. The context is pre-loaded with four variables, listed below.

name             | type     | description
 ----------------|----------|---------------
request          | function | An alias for [Road.request](#roadrequeststring-method-string-url-dynamic-body-object-headers). You may add any additional methods or properties to the context and use them in your routes. This is useful for determining the authenticated user or adding helper methods.
http_methods     | array    | And array of valid http methods for the resource associated with this method (primarily used for OPTIONS requests and 405 errors)
Response         | Response | The Response constructor, so you don't have to load the file each time
resource_context | mixed    | The contents of the context variable passed into the Resource constructor


```node
var road = new Road(new Resource({
    methods: {
        GET: function (url, body, headers) {
            // true because the middleware persists to this context
            console.log(this.uri === '/me');

            // Access the resource context for additional useful information
            if (this.resource_context.require_authentication) {
                // Here you could ensure that authentication was provided to the server Here you could ensure that authentication was provided to the server 
            }

            // true. There's only one method, so the array only contains GET
            console.log(this.http_methods === ['GET']);

            // Easy access to the response object
            return new this.Response('hello world', 200);
        }
    },
    context: {
        require_authentication: true
    }
}));

// Modifying context will persist into the resource method
road.use(function (method, url, body, headers, next) {
    this.uri = '/me';
    return next();
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

## Roads.PJAX(*Object* road)
**A helper object to easily enable PJAX on your website using roads**

PJAX stands for pushState + AJAX. PJAX a technique for speeding up webpages by replacing certain links on the page with AJAX calls. To enable PJAX, you must register the PJAX handler via JavaScript and add attributes to some of your html links.

### PJAX.register(*Object* window, *DomElement* container_element)

On page load, you will need to construct and register your PJAX handler. Registration takes two parameters, the window object an a DomElement. When you click certain links in your html (as defined by the link format below), PJAX will intercept the action and instead use roads to generate the new page content. Once the new html is ready, it will replace the innerHTML of the container_element.

This allows for clean, quick page refreshes via JavaScript, with a safe, JavaScript free fallback (the links will still work as normal without JavaScript!).

```
var road = ...; // Incomplete. See the getting started section for more information about creating a road
var pjax = new require('roads').PJAX(road);
pjax.register(window, document.getElementById('container'));
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
