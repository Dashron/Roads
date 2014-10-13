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
  - [onRequest(*Function* fn)](#apionrequestfunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *Object* headers)](#apirequeststring-method-string-url-dynamic-body-object-headers)
  - [server(*IncomingMessage* http_request, *ServerResponse* http_response)](#apiserverincomingmessage-http_request-serverresponse-http_response)
 - [Roads.Resource](#roadsresource)
  - [new Resource(*Object* definition)](#new-resourceobject-definition)
  - [URL Part (routing)](#url-part)
  - [Resource method](#resource-method)
 - [Roads.Response](#roadsresponse)
  - [new Response(*Object* data, *number* status, *Object* headers)](#new-responsedynamic-data-number-status-object-headers)
  - [getData()](#responsegetdata)
  - [writeTo(*ServerResponse* httpResponse)](#responsewritetoserverserverresponse-http_response)
 - [Roads.FieldsFilter](#roadsfieldsfilter)
  - [new FieldsFilter(*dynamic* data)](#new-fieldsfilterdynamic-data)
  - [filter(*Array* fields)](#filterarray-fields)
 - [Roads.HttpError](#roadshttperror)
  - [new HttpError(*string* message, *number* code)](#new-httperrorstring-message-number-code)

## Roads.API

The API is a container that holds a hierarchy of [Resource](#roadsresource) objects. It exposes a [request](#apirequeststring-method-string-url-dynamic-body-object-headers) method which allows you to interact directly with the resources.

You must provide the root resource to the constructor. This resource will resolve any requests to the root (`/`) endpoint. Any additional routes will be referenced as sub-resources of the root endpoint.

### new API(*Resource* root_resource)
**Create an API object.**

 name          | type                       | required | description
 --------------|----------------------------|----------|-------------
 root_resource | [Resource](#roadsresource) | yes      | Used to generate the [response](#roadsresponse) for the root endpoint ( [protocol]://[host]/ ).

Creates your API object. You must provide a [Resource](#roadsresource) to the constructor. The provided resource becomes the root resource, and will be used for any API requests to `/`.

```node
var roads = require('roads');
var root_resource = new roads.Resource(...); // The resource definition has not been set here, because it's out of the scope of this example. Take a look at [Resource](#roadsresource) for information about the Resource constructor.
var api = new roads.API(root_resource);
```

### API.onRequest(*Function* fn)
**Add a custom function to be executed along with every request.**

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(*string* method, *string* url,*object* body,*object* headers,*function* next) | yes      | Will be called any time a request is made on the API object.
 
 This will be called for every request, even for routes that do not exist. The callback will be executed with the following five parameters :
 
#### onRequest Callback 
**function (*string* method,*string* url, *Object* body, *Object* headers, *Function* next)**

name     | type                               | description
 --------|------------------------------------|---------------
 method  | string                             | The HTTP method that was provided to the request
 url     | string                             | The url that was provided to the request
 body    | object                             | The body that was provided to the request, after it was properly parsed into an object
 headers | object                             | The headers that were provided to the request
 next    | function                           | The [resource method](#resource-method) that this request expected. If you want to execute the [resource method](#resource-method), you must execute this function. The method is not called for you.

If the callback does not return a [response](#roadsresponse) object, it will be wrapped in a [response](#roadsresponse) object with the default status code of 200.

    // Example of an onRequest handler
    api.onRequest(function* (url, body, headers, next) {
    	// kill trailing slash as long as we aren't at the root level
        if (url.path != '/' && url.path[url.path.length - 1] === '/') {
            return new roads.Response(null, 302, {
                location : url.path.substring(0, url.path.length - 1)
            });
        }
    
        // This would also be a good place to identify the authenticated user, or api app and add it to the current request context
        // eg: this.cur_user = user;

        // Catch any errors that are thrown by the resources
        try {
            // execute the actual resource method, and return the response
            return next();
        } catch (err) {
            var response = null;

            // Wwrap the errors in response objects. If they are [HttpErrors](#roadshttperror) we adjust the status code
            switch (err.code) {
                case 404:
                    return new roads.Response(notFoundRepresentation(err), 404);
                case 405:
                    return new roads.Response(notAllowedRepresentation(err), 405);
                case 500:
                default:
                    return new roads.Response(unknownRepresentation(err), 500);
            }
        }
    });

### API.request(*string* method, *string* url, *dynamic* body, *Object* headers)
**Make a request to the API.**


This function will locate the appropriate [resource method](#resource-method) for the provided HTTP Method and URL, execute it and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). It will always return a [Response](#roadsresponse) object.

    var promise = api.request('GET', '/users/dashron');
    
    promise.then(function (response) {        
        console.log(response.data);
    });


### API.server(*IncomingMessage* http_request, *ServerResponse* http_response)
**An onRequest callback for http.createServer()**

Helper function so the api can be thrown directly into http.createServer.

    require('http').createServer(api.server.bind(api))
        .listen(8081, function () {
            console.log('server has started');
        });


## Roads.Resource

Each resource represents a single endpoint. The definition provided to the constructor describes how it can be used by the API object.

### new Resource(*Object* definition)
**Constructor**

name        | type                               | description
 -----------|------------------------------------|---------------
 definition | object                             | A definition which describes how the resource should operate

The definition only looks for two fields.

name        | type                               | description
 -----------|------------------------------------|---------------
 resources  | object                             | Each key is a [url part](#url-part), and each value is a sub-[resource](#roadsresource)
 methods    | object                             | Each key is an HTTP method, and each value is a [resource method](#resource-method).

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

#### URL Part (routing)

All URL routing happens through the resource definition, and through sub resources. The root resource represents a url without any path ([protocol]://[host]/). This root resource must define additional resources as sub resources, which will branch out after the root resource.

Part       | Example   | Example values | Description
-----------|-----------|----------------|--------------
{literal}  | users     | users          | The provided value must explicitly match the [url part](#url-part)
#{key}     | #user_id  | 12445          | The provided value must be numeric
${key}     | #username | dashron        | The provided value can be any series of non-forward slash, url valid characters

In the following example, the only valid urls are /, /users and /users/{number}

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

For variable fields, you can retrieve the variable in the url parameter. The url parameter will be an object, and will have an "args" parameter

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

#### Resource Method

Each ```method : function``` pair of the methods field describes how the API server will respond to an HTTP request. The function is called a "resource method".

If a resource could not be located for the provided URL, the API will throw an [HttpError](#roadshttperror) with a 404 status code.
If a resource was located for the provided URL, but the resource did not have the appropriate [resource method](#resource-method) for the requested HTTP method, the API will throw an [HttpError](#roadshttperror) with a 405 status code.

Each resource method has access to a request context through ```this```. Each ```this``` will be unique to the request, and will persist from the requestHandler into the actual request. The context is pre-loaded with a request method, which is an alias for [API.request](#apirequeststring-method-string-url-dynamic-body-object-headers). You may add any additional methods or properties to the context.

    var api = new API(new Resource({
        methods : {
            GET : function (url, body, headers) {
                // true
                console.log(this.uri === '/me');
            }
        }
    }));

    api.onRequest(function* (method, url, body, headers, next) {
        this.uri = '/me';
        return yield next();
    });


## Roads.Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers. 

### new Response(*dynamic* data, *number* status, *Object* headers)
**Constructor**

name        | type                               | description
 -----------|------------------------------------|---------------
 data       | dynamic                            | A definition which describes how the resource should operate
 status     | number                             | The HTTP Status code
 headers    | object                             | Key value pairs of http headers.

Create a response object. 

    new Response({"uri" : "..."}, 200, {"last-modified":"2014-04-27 00:00:00"});

### Response.getData()
**Get the final data from the response, after all parsing**

The result will always be a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A), no matter what data has been provided to the Response object.

**NOTE:** The [request](#apirequeststring-method-string-url-dynamic-body-object-headers) method will have already called `getData()`. `getData()` is only useful if you have not yet called request, but need to expand a response object. If you call this, I highly recommend assigning the final value back into response.data, so that you do not have to process the response data multiple times. 

    // Get the data, which will be a promise
    return response.getData()
        .then(function (data) {
            console.log(data);
            // NOTE: If any of your values are functions or promises, you must pass them through the field filter for them to be properly expanded.
        });

### Response.writeToServer(*ServerResponse* http_response)
**A helper function to write the response object to a server response**

This will apply the body, status code, and any applicable headers to the provided http_response. It will not end the response, so you need to do that yourself.

    // execute the api logic and retrieve the appropriate response object
    api.request(http_request.method, http_request.url, body, http_request.headers)
        .then(function (response) {
            // Get the data, which will be a promise
            response.writeToServer(http_response);
            http_response.end();
        });

## Roads.FieldsFilter

Many APIs benefit from allowing users to limit which fields they want. If a user is only trying to display title and description, there's no need to provide tons of unrelated stats and metadata. This is the first benefit of the fields filter. When provided the response data of a route, and an array of valid fields, The field filter will remove any unwanted fields.

    var f = new FieldsFilter({
        'test' : {
            'one' : true,
            'two' : true
        },
        'hello' : {
            'one' : true,
            'two' : true
        }
    });

    // notice test.two was not requested, so it's ignored
    // notice hello was requested, so the entire child resource is provided
    f.filter(['test.one', 'hello'])
        .then(function (response) {
            console.log(response === {
                'test' : {
                    'one' : true
                },
                'hello' : {
                    'one' : true,
                    'two' : true
                }
            });
        });

The second benefit is that you can provide function or promise values and the filter will expand them ONLY if the user has explicitly requested them. This allows you to avoid heavy DB queries or cache hits by intelligently structuring your responses.

    var f = new FieldsFilter({
        'test' : {
            'one' : function () {
                return true;
            },
            'two' : function () {
                console.log('this will never be reached!');
                return true;
            }
        },
        'hello' : {
            'one' : true,
            'two' : true
        }
    });

    // notice test.two was not requested, so it's ignored and the function is never executed
    // notice test.one was requested, so the function is executed and the response is provided
    f.filter(['test.one', 'hello'])
        .then(function (response) {
            console.log(response === {
                'test' : {
                    'one' : true
                },
                'hello' : {
                    'one' : true,
                    'two' : true
                }
            });
        });

### new FieldsFilter(*dynamic* data)
**Create an object to help filter down a set of data**

name        | type                               | description
 -----------|------------------------------------|---------------
 data       | dynamic                            | A piece of data that needs to be expanded and or filtered

    var f = new FieldsFilter({"hello" : "goodbye"});

### filter(*Array* fields)
**Filter down a set of data based on a whitelist of fields**

name        | type                               | description
 -----------|------------------------------------|---------------
 fields     | dynamic                            | An array of fields that should remain in the response. To represent a heirarchy use periods

Reduce the data associated with this filter object to only contain the fields provided in the "fields" array
If true is passed, the whole object will be expanded and all fields returned.

    var f = new FieldsFilter({
        'test' : {
            'one' : true,
            'two' : true
        },
        'hello' : {
            'one' : true,
            'two' : true
        }
    });

    f.filter(['test.one', 'hello'])
        .then(function (response) {
            console.log(response === {
                'test' : {
                    'one' : true
                },
                'hello' : {
                    'one' : true,
                    'two' : true
                }
            });
        });

## Roads.HttpError

### new HttpError(*string* message, *number* code)
**A helper error, that contains information relevant to common HTTP errors**

name        | type                               | description
 -----------|------------------------------------|---------------
 message    | string                             | A message describing the HTTP error
 code       | number                             | An official [http status code](#http://www.httpstatus.es)

    throw new Roads.HttpError('Page not found', 404);
