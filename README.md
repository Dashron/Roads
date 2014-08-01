# The Roads.js API Framework

Roads is a framework for creating APIs in node.js. It requires generator support, so you should be using node 0.11.13 or higher with the `--harmony` flag enabled.

# Why should I use Roads?

1. It helps build an organized, resource oriented API through a nested routing structure.
2. It can be required right from your code, or called over HTTP.
3. It supports yield, for cleaner code.
4. It supports delayed response execution. If your users don't want certain fields, the code associated will never be run


# Index

 - [Roads.API](#roadsapi)
  - [new API(*Resource* root_resource)](#new-apiresource-root_resource)
  - [onError(*Function* fn)](#apionerrorfunction-fn)
  - [onRequest(*Function* fn)](#apionrequestfunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *Object* headers)](#apirequeststring-method-string-url-dynamic-body-object-headers)
  - [server(*IncomingMessage* http_request, *ServerResponse* http_response)](#apiserverincomingmessage-http_request-serverresponse-http_response)
 - [Roads.Resource](#roadsresource)
  - [new Resource(*Object* definition)](#new-resourceobject-definition)
 - [Roads.Response](#roadsresponse)
  - [new Response(*Object* data, *number* status, *Object* headers)](#new-responsedynamic-data-number-status-object-headers)
  - [getData()](#responsegetdata)
  - [filter(*dynamic* fields)](#responsefilterarray-fields)
  - [writeTo(*ServerResponse* httpResponse, *boolean* end)](##responsewritetoserverresponse-http_response-boolean-end)
 - [Roads.HttpError](#roadshttperror)
  - [new HttpError(*string* message, *number* code)](#new-httperrorstring-message-number-code)

## Roads.API

The API is a container that holds a series of Resource objects. It exposes a [request](#apirequeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with resources.

To create all of your api endpoints, you start with the root_resource, and assign [sub-resources](#roadsresource).

### new API(*Resource* root_resource)
**API Constructor**

 name          | type                       | required | description
 --------------|----------------------------|----------|-------------
 root_resource | [Resource](#roadsresource) | yes      | Used to generate the [response](#roadsresponse) for the root endpoint ( [protocol]://[host]/ ).

Creates your API object, so you can use it directly or bind it to an [HTTP server](http://nodejs.org/api/http.html#http_http_createserver_requestlistener). 


    var roads = require('roads');
    var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at <link> for information about the Resource constructor.
    var api = new roads.API(root_resource);


### API.onError(*Function* fn)
**Assign an error handler to the API object**

 name | type                    | required | description
 -----|-------------------------|----------|-------------
 fn   | Function(*Error* error) | Yes      | A callback that will be executed any time an error is thrown from within a resource, or from the API object. The only parameter will be an `error` object.

This callback can return a Response object, which will be rendered for the user if possible.

Independent of any errors thrown by your resources, the API object can surface one of three errors.

code                                                    | message                                                          | description
--------------------------------------------------------|------------------------------------------------------------------|-----------------------------
`new roads.HttpError(parsed_url.pathname, 404);`        | The request pathname                                             | If the endpoint could not be found
`new roads.HttpError(resource.getValidMethods(), 405);` | An array of HTTP methods that can be requested for this resource | If the endpoint was found, but the HTTP method was not supported
`new Error();`                                          | Dependant on the error                                           | If an unexpected error occurs



    var api = new roads.API(root_resource);
    api.onError(function (error) {
        console.log(error);
        switch (error.code) {
            case 404:
                return new roads.Response(notFoundRepresentation(error), 404); 
            case 405:
                return new roads.Response(notAllowedRepresentation(error), 405); 
            case 500:
            default:
                return new roads.Response(unknownRepresentation(error), 500); 
        }
    });



### API.onRequest(*Function* fn)
**Add a custom handler for every request**

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(*string* url,*object* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the API object.
 
 This callback will be provided four parameters
 
name     | type                               | description
 --------|------------------------------------|---------------
 url     | string                             | The url that was provided to the request
 body    | object                             | The body that was provided to the request, after it was properly parsed into an object
 headers | object                             | The headers that were provided to the request
 next    | function                           | The resource method that this request expected. You may optionally execute this method. If you provide a parameter, it will become the fourth parameter of the <link>resource method.

This callback must return a response object. You do not have to return the response from the `next` method, you can return an entirely different response object.

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
    // execute the actual resource method, and return the response
        return next(extras);
    });

### API.request(*string* method, *string* url, *dynamic* body, *Object* headers)
**Make a request to the API.**


This function will locate the appropriate <link>resource method for the provided parameters and execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A).
On success, you should receive a [Response](#roadsresponse) object
On failure, you should receive an error. This error might be an [HttpError](#roadshttperror)

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


### API.server(*IncomingMessage* http_request, *ServerResponse* http_response)
**An onRequest callback for http.createServer()**

Helper function so the api can be thrown directly into http.createServer


## Roads.Resource

### new Resource(*Object* definition)
**Constructor**

    // Example of resource method that accepts the extra data from an `onRequest` handler. This would be called when `onRequest` calls `next(extras)`
    GET : function* (url, body, headers, extras) {
      extras.example === "test";
    }

## Roads.Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers. 

### new Response(*dynamic* data, *number* status, *Object* headers)
**Constructor**

Build a response object. 
 - `data` : 


### Response.getData()
**Get the final data from the response, after all parsing**


### Response.filter(*array* fields)
**Assign a whitelist of field keys that should be allowed to pass through getData**

### Response.writeTo(*ServerResponse* http_response, *boolean* end)
**A helper function to retrieve the response data and write it out to a server**


## Roads.HttpError

### new HttpError(*string* message, *number* code)
**A helper error, that when thrown will turn into an HTTP status code, and json message**
