# The Roads.js API Framework

Roads is a framework for creating APIs in node.js. It requires generator support, so you should be using node 0.11.13 or higher with the `--harmony` flag enabled.

# Why should I use Roads?

1. It helps build an organized, resource oriented API through a nested routing structure.
2. It can be required right from your code, or called over HTTP.
3. It supports yield, for cleaner code.
4. It supports delayed response execution. If your users don't want certain fields, the code associated will never be run


# Index

 - [Roads.API](#roadsapi)
  - [new API(`Resource` root_resource)](#new-apiresource-root_resource)
  - [onError(`Function` fn)](#apionerrorfunction-fn)
  - [onRequest(`Function` fn)](#apionrequestfunction-fn)
  - [request(`String` method, `String` url, `dynamic` body, `Object` headers)](#apirequeststring-method-string-url-dynamic-body-object-headers)
  - [server(`IncomingMessage` http_request, `ServerResponse` http_response)](#apiserverincomingmessage-http_request-serverresponse-http_response)
 - [Roads.Resource](#roadsresource)
  - [new Resource(`Object` definition)](#new-resourceobject-definition)
 - [Roads.Response](#roadsresponse)
  - [new Response(`Object` data, `Number` status, `Object` headers)](#new-responsedynamic-data-number-status-object-headers)
  - [getData()](#responsegetdata)
  - [filter(`dynamic` fields)](#responsefilterarray-fields)
  - [writeTo(`ServerResponse` httpResponse, `Boolean` end)](#responsewritetoserverresponse-http_response-boolean-end)
 - [Roads.HttpError](#roadshttperror)
  - [new HttpError(`string` message, `number` code)](#new-httperrorstring-message-number-code)

## Roads.API

The API is a container that holds a series of Resource objects. It exposes a [request](#apirequeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with resources.

### new API(`Resource` root_resource)
**API Constructor**

Creates your API object, so you can use it directly or bind it to an HTTP server. A resource must be provided to this constructor.
This resource will be used to generate the response for the root endpoint ( [protocol]://[host]/ ), and can link off to sub resources to define the rest of the endpoints.
 
    var roads = require('roads');
    var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at <link> for information about the Resource constructor.

    var api = new roads.API(root_resource);

### API.onError(`Function` fn)
**Assign an error handler to the API object**

You must provide a callback to the onError function. This callback will be called any time an error is thrown from a resource, or from the API object. The only parameter will be an `error` object.

There are only 3 errors that can be thrown from the API object
 - *new roads.HttpError(parsed_url.pathname, 404)* If the endpoint could not be found
 - *new roads.HttpError(resource.getValidMethods(), 405);* If the endpoint was found, but the HTTP method was not supported
 - *new Error()* If an unexpected error occurs

 Any other error (and possibly some of the three above) can be thrown from a resource object, and will be surfaced through this callback.

 This callback can return a Response object, which will be rendered for the user if possible.

    var api = new roads.API(root_resource);
    api.onError(function (error) {
        console.log(error);
        switch (error.code) {
            case 404:
                return new roads.Response(notFoundRepresentation(error), 404); // The notFoundRepresentation returns a promise, and is out of the scope of this example. Take a look at <link> for information about the Response constructor
            case 405:
                return new roads.Response(notAllowedRepresentation(error), 405); // The notAllowedRepresentation returns a promise, and is out of the scope of this example. Take a look at <link> for information about the Response constructor
            case 500:
            default:
                return new roads.Response(unknownRepresentation(error), 500); // The unknownRepresentation returns a promise, and is out of the scope of this example. Take a look at <link> for information about the Response constructor
        }
    });


### API.onRequest(`Function` fn)
**Add a custom handler for every request**

You must provide a callback to the onRequest function. This callback will be called any time a request is made on the API object. This callback will be provided four parameters
 - **`url`** `string` The url that was provided to the request
 - **`body`** `object` The body that was provided to the request, after it was properly parsed into an object
 - **`headers`** `object` The headers that were provided to the request
  - **`next`** `function` The proper routed function that this url should execute. It can take a single parameter, which will be passed through as the final parameter of a resource route. You can read more about the resource routes at <link>

This callback also must return a response object to be properly sent to the user.

	// Example of an onRequest handler
    api.onRequest(function* (url, body, headers, next) {
    	// define an extras object
	    var extras = {
	    	example : "test"
	    };

    	// kill trailing slash as long as we aren't at the root level
	    if (url.path != '/' && url.path[url.path.length - 1] === '/') {
		    return new roads.Response(null, 302, {
	    		location : url.path.substring(0, url.path.length - 1)
    		});
	    }
	    
	    // This would also be a good place to identify the authenticated user, or api app and add it to the extras
    
    	// execute the actual route, and return the response
    	return next(extras);
    });

    // Example of resource route that accepts the extra data from an `onRequest` handler. This would be called when `onRequest` calls `next(extras)`
    GET : function* (url, body, headers, extras) {
    	extras.example === "test";
    }

### API.request(`string` method, `string` url, `dynamic` body, `object` headers)
**Make a request to the API.**

This function will locate the appropriate route for the provided parameters and execute it and return a <link>thenable (Promises/A compatible promise).
On success, you should receive a <link>Response object
On failure, you should receive an error. This error might be an <link>HttpError

    var promise = api.request('GET', '/users/dashron');
    
    promise.then(function (response) {
        // you can't predict error fields easily, so we don't apply the filter on errors
        response.getData()
        	.then(function(data) {
        		console.log(data);
        	})
            .catch(function (err) {
                console.log(err);
        	});
    });

    promise.catch(function (err) {
    	console.log(err);
    });


### API.server(`IncomingMessage` http_request, `ServerResponse` http_response)
**An onRequest callback for http.createServer()**

Helper function so the api can be thrown directly into http.createServer


## Roads.Resource

### new Resource(`object` definition)
**Constructor**

## Roads.Response

### new Response(`dynamic` data, `number` status, `object` headers)
**Constructor**

### Response.getData()
**Get the final data from the response, after all parsing**


### Response.filter(`array` fields)
**Assign a whitelist of field keys that should be allowed to pass through getData**

### Response.writeTo(`ServerResponse` http_response, `boolean` end)
**A helper function to retrieve the response data and write it out to a server**


## Roads.HttpError

### new HttpError(`string` message, `number` code)
**A helper error, that when thrown will turn into an HTTP status code, and json message**
