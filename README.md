The Roads.js API Framework

Roads is a framework for creating APIs in node.js. It requires generator support, so you should be using node 0.11.13 or higher with the `--harmony` flag enabled.

# Why should I use Roads?

1. It helps build an organized, resource oriented API through a nested routing structure.
2. It can be required right from your code, or called over HTTP.
3. It supports yield, for cleaner code.
4. It supports delayed response execution. If your users don't want certain fields, the code associated will never be run


# Index

 - API
 -- new API(`Resource` rootResource)
 -- onError(`Function` fn)
 -- onRequest(`Function` fn)
 -- request(`String` method, `String` url, `dynamic` body, `Object` headers)
 -- server(`IncomingMessage` httpRequest, `ServerResponse` httpResponse)

 - Resource
 -- new Resource(`Object` definition)
 -- allowsMethod(`String` method)
 -- getValidMethods()
 -- getResourceKey(`String` request_url)
 -- OPTIONS(`String` url, `dynamic` body, `Object` headers)

 - Response
 -- new Response(`Object` data, `Number` status, `Object` headers)
 -- getData()
 -- filter(`dynamic` fields)
 -- writeTo(`ServerResponse` httpResponse, `Boolean` end)


# API

## new API(`Resource` rootResource)
### API Constructor

Creates your API object, so you can use it directly or bind it to an HTTP server. A resource must be provided to this constructor.
This resource will be used to generate the response for the root endpoint ( [protocol]://[host]/ ), and can link off to sub resources to define the rest of the endpoints.
 
    var roads = require('roads');
    var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at <link> for information about the Resource constructor.

    var api = new roads.API(root_esource);

## API.onError(`Function` fn)
### Assign an error handler to the API object

You must provide a callback to the onError function. This callback will be called any time an error is thrown from a resource, or from the API object. The only parameter will be an `error` object.

There are only 3 errors that can be thrown from the API object
 - *new roads.HttpError(parsed_url.pathname, 404)* If the endpoint could not be found
 - *new roads.HttpError(resource.getValidMethods(), 405);* If the endpoint was found, but the HTTP method was not supported
 - *new Error()* If an unexpected error occurs

 Any other error (and possibly some of the three above) can be thrown from a resource object, and will be surfaced through this callback.

 This callback can return a Response object, which will be rendered for the user if possible.


    var roads = require('roads');
    var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at <link> for information about the Resource constructor.

    var api = new roads.API(root_esource);
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


## API.onRequest(`Function` fn)
### Add a custom handler for every request

You must provide a callback to the onRequest function. This callback will be called any time a request is made on the API object. This callback will be provided four parameters
 - *`url`* `string` The url that was provided to the request
 - *`body`* `object` The body that was provided to the request, after it was properly parsed into an object
 - *`headers`* `object` The headers that were provided to the request
  - *`next`* `function` The proper routed function that this url should execute. It can take a single parameter, which will be passed through as the final parameter of a resource route. You can read more about the resource routes at <link>

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

## API.request(`string` method, `string` url, `dynamic` body, `object` headers)
### Make a request to the API.

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


/**
 * Make a request into the API
 * 
 * @param  string method
 * @param  string url     
 * @param  string body    
 * @param  array headers 
 * @return string
 */
API.prototype.request = function (method, url, body, headers) {

/**
 * Helper function so the api can be thrown directly into http.createServer
 * 
 * @param  ClientRequest http_request
 * @param  ServerResponse http_response
 */
API.prototype.server = function (http_request, http_response) {

# RESOURCE

//TODO: add direct spec references
var Resource = module.exports = function Resource (definition) {

/**
 * [allowedMethod description]
 * @param  {[type]} method [description]
 * @return {[type]}        [description]
 */
Resource.prototype.allowsMethod = function (method) {

/**
 * [getValidMethods description]
 * @return {[type]} [description]
 */
Resource.prototype.getValidMethods = function () {


/**
 * [getResource description]
 * @param  {[type]} request_url [description]
 * @return {[type]}             [description]
 */
Resource.prototype.getResourceKey = function (request_url) {

/**
 * [OPTIONS description]
 * @type {[type]}
 */
Resource.prototype.OPTIONS = function* (url, body, headers) {

# RESPONSE

var Response = module.exports = function Response (data, status, headers) {

/**
 * [getData description]
 * @return {[type]} [description]
 */
Response.prototype.getData = function () {

/**
 * Load the fields whitelist for the final representation
 * 
 * @param  {[type]} fields [description]
 * @return {[type]}        [description]
 */
Response.prototype.filter = function (fields) {

/**
 * [write description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
Response.prototype.writeTo = function(http_response, end) {