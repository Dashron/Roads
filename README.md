# The Roads.js HTTP abstraction

Roads is an abstraction around the HTTP request/response lifecycle. It's very similar to a standard MVC framework plus router.

# Why should I use Roads?

1. It helps build an organized, resource oriented website or API through a nested routing structure.
2. It can be bound to an HTTP server, or used like a standard javascript object.
3. It can be used in the browser using [browserify ](http://browserify.org/) to build client side applications.
4. It is built using promises and supports generator-based coroutines so that you never have to worry about callbacks.

# Build Status
![Build status](https://travis-ci.org/Dashron/roads.svg?branch=master)

# Index

 - [Getting Started](#getting-started)
 - [Roads.Road](#roadsroad)
  - [new Road(*Resource|array* root_resource)](#new-roadresourcearray-root_resource)
  - [use(*Function* fn)](#roadusefunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *Object* headers)](#roadrequeststring-method-string-url-dynamic-body-object-headers)
  - [server(*IncomingMessage* http_request, *ServerResponse* http_response)](#roadserverincomingmessage-http_request-serverresponse-http_response)
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
 - [Performance Improvements](#performance-improvements)

## Getting Started

Building a project with roads is very straightforward.

1. Create a [Resource](#roadsresource) object for every endpoint (`/`, `/users`, `/posts`, `/users/#user_id`)
	```node
	// Create your resource.
	var resource = new roads.Resource({
	    // Define sub-resources.
	    resources : {
	        // This attaches the resource at ./users to the url "/users"
	        "users" : require('./users'),
	        // This attaches the resource at ./posts to the url "/posts"
	        "posts" : require('./posts')
	    },
	    // Incomplete. See step 2.
	    methods : ...
	});
	
	// Assign your resource to the root "/" endpoint.
	var road = new roads.Road(resource);
	```

2. Each [Resource](#roadsresource) from step #1 should contain one or more [resource methods](#resource-method). Each resource method is associated with an HTTP method.
	```node
	var resource = new roads.Resource({
	    // Incomplete. See step 1.
	    resources : ...,
	    methods : {
	        // Whenever a GET request is made to this resource, it will execute the following function
	        GET : function (url, body, headers) {
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

3. Each [resource method](#resource-method) from step #2 should return your response. If a promise, it will be evaluated. If not a [response](#roadsresponse) object, it will be automatically wrapped.
	```node
	var resource = new roads.Resource({
	    // Incomplete. See step 1.
	    resources : ...,
	    methods : {
	        GET : function (url, body, headers) {
	            // Incomplete, see step 2.
	            ...
	
	            // Build a response object, with the body, status code and headers.
	            return new this.Response({ "name" : "aaron" }, 200, {"last-modified" : "Tue, 15 Nov 1994 12:45:26 GMT"});
	        }
	    }
	});
	```

4. Manually make a request. This will locate and execute the proper resource and resource method. You can also bind it to the standard HTTP server using the `server` method.

	```node
	// Call directly
	road.request('GET', '/users', {page : 2})
	    .then(function (response) {
	        console.log(response);
	    });
	```
	
	```node
	// Bind to an HTTP server
	require('http').createServer(road.server.bind(road))
	    .listen(8080, function () {
	        console.log('server has started');
	    });
	```

Once all of these steps are complete, you should be able to access your roads through your script, or the bound http server. Continue reading the docs below for more information on [error handling](#roadusefunction-fn), [URL parameters](#url-part) and more!



## Roads.Road

A Road is a container that holds a hierarchy of [Resource](#roadsresource) objects. It exposes a [request](#requeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with the resources.

You must provide at least one root resource to the constructor. The request method will check each resource in array order for a matching route. The root resources will handle all requests to the root (`/`) endpoint. Any additional routes will be referenced as sub-resources of the root endpoint.


### new Road(*Resource|array* root_resource)
**Create a Road.**

 name          | type                                | required | description
 --------------|-------------------------------------|----------|-------------
 root_resource | [Resource](#roadsresource) or array | yes      | Used to generate the [response](#roadsresponse) for the root endpoint ( [protocol]://[host]/ ). Also determines the starting point for routing for the [request](#requeststring-method-string-url-dynamic-body-object-headers) method.

Creates your Road object. You must provide a [Resource](#roadsresource) or array of resources to the constructor. The provided resource becomes the root resource, and will be used for any requests to `/`. If the route isn't found in the first method, we will continue to the second root resource.

```node
var roads = require('roads');
var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at [Resource](#roadsresource) for information about the Resource constructor.
var road = new roads.Road(root_resource);
```



### Road.use(*Function* fn)
**Add one or many custom functions to be executed along with every request.**

The functions added will be executed in the order they were added. Each handler must execute the "next" parameter if it wants to continue executing the chain.

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(*string* method, *string* url,*object* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the object.
 
 This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters :
 
#### use Callback 
**function (*string* method,*string* url, *Object* body, *Object* headers, *Function* next)**

name     | type                               | description
 --------|------------------------------------|---------------
 method  | string                             | The HTTP method that was provided to the request
 url     | string                             | The URL that was provided to the request
 body    | object                             | The body that was provided to the request, after it was properly parsed into an object
 headers | object                             | The headers that were provided to the request
 next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.

If the callback does not return a [response](#roadsresponse) object, it will be wrapped in a [response](#roadsresponse) object with the default status code of 200.

```node
// Example of a request handler that kills trailing slashes (This is provided for you in the middleware!)
road.use(function (method, url, body, headers, next) {
	// kill trailing slash as long as we aren't at the root level
    if (url.path != '/' && url.path[url.path.length - 1] === '/') {
        return new roads.Response(null, 302, {
            location : url.path.substring(0, url.path.length - 1)
        });
    }

    return next();
});

// Example of a request handler that catches errors and returns Response objects
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
**Execute the resource method associated with the request parameters.**


This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.

```node
var promise = road.request('GET', '/users/dashron');

promise.then(function (response) {        
    console.log(response);
});

promise.catch(function (error) {
    console.log(error);
});
```


### Road.server(*IncomingMessage* http_request, *ServerResponse* http_response)
**A function to facilitate binding the road to http.createServer()**

Helper function to attach your road directly into http.createServer.

```node
require('http').createServer(road.server.bind(road))
    .listen(8081, function () {
        console.log('server has started');
    });
```

### Road.addResource(*Resource* resource)
**Add another resource for the router.**

The provided resource will be added to the list of resources checked whenever a request is made on this road.

## Roads.Resource

Each resource represents a single endpoint. The object provided to the constructor describes how it can be used by the road.


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
    resources : {
        'users' : require('./users').many,
        'posts' : require('./posts').many
    },
    methods : {
        GET : function* (url, body, headers) {
            return new Response({
                "users" : "/users",
                "posts" : "/posts"
            });
        }
    }
});
```

#### URL Part (routing)

All URL routing is defined through the resource definition, and through sub resources. The root resource represents a URL without any path ([protocol]://[host]/). This root resource must define additional resources as sub resources, which will branch out after the root resource.

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
    resources : {
        "#user_id" : single
    }
});

var root = new Resource({
    resources : {
        "users" : many
    }
});
```

For variable fields, you can retrieve the variable in the URL parameter. The URL parameter will be an object, and will have an "args" parameter

```node
var single = new Resource({
    methods : function (url, body, headers) {
        console.log(url.args.user_id);
    }
});

var many = new Resource({
    resources : {
        "#user_id" : single
    }
});

var root = new Resource({
    resources : {
        "users" : many
    }
});
```

#### Resource Method

Each ```method : function``` pair in the methods section of the resource definition is called a "[resource method](#resource-method)". [Road.request](#roadrequeststring-method-string-url-dynamic-body-object-headers) will first locate the proper resource from the request path, and then the [resource method](#resource-method) from the request method. The resource method accepts three parameters.

name     | type                               | description
 --------|------------------------------------|---------------
 url     | string                             | The URL of the request. Is parsed with the standard url module.
 body    | object                             | The request body. If the `Content-Type` header is `application/json` the body will be parsed into an object.
 headers | object                             | The request headers


```node
var road = new Road(new Resource({
    methods : {
        GET : function (url, body, headers) {
            return 'Welcome!';
        }
    }
}));
```

##### Generators

If you provide a generator function as your resource method, we will turn it into a coroutine. Coroutines mimic ES7 async functions by letting you yield promises. It lets you drastically improve the readability of your code.

```node
var road = new Road(new Resource({
    methods : {
        GET : function* (url, body, headers) {
            var user = yield db.User(url.args.user_id);
        }
    }
}));
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
    methods : {
        GET : function (url, body, headers) {
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
    context : {
        require_authentication : true
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
new Response({"uri" : "..."}, 200, {"last-modified":"2014-04-27 00:00:00"});
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

## Performance improvements
It's possible to design your API responses to achieve significant performance gains. [Roads Fields Filter](https://github.com/Dashron/roads-fieldsfilter) helps facilitate that feature.

## Next Steps
 - Mention roads-client from this doc, and update it to retain api compatibility with 3.0
