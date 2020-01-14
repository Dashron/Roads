# The Roads.js isomorphic web framework

Roads is a web framework built for use with async functions. It's similar to Koa.js, but can be used both in the browser and on the server.

# Why should I use Roads?

1. Roads can be attached to any node HTTP server, including Koa.js, Express.js, and the built in node HTTP server.
2. Roads is isomorphic, meaning you can generate html on the server or in the browser with the same code.
3. Roads lets you work without callbacks. It's built on top of promises and async functions.
4. Roads can be run without ever attaching it to an HTTP server. This is great for writing tests, working with web sockets, or writing API first websites. 


# Build Status
![Build status](https://travis-ci.org/Dashron/roads.svg?branch=master)

# Index

- [Getting Started](#getting-started)
- [Road](#road)
  - [new Road()](#new-road)
  - [use(*function* fn)](#roadusefunction-fn)
  - [request(*string* method, *string* url, *dynamic* body, *object* headers)](#roadrequeststring-method-string-url-dynamic-body-object-headers)
- [Response](#response)
  - [new Response(*mixed* body, *number* status, *object* headers)](#new-responsemixed-body-number-status-object-headers)
  - [body](#body)
  - [status](#status)
  - [headers](#headers)
- [Middleware](#middleware)
  - [cookie()](#cookie)
  - [cors(*object* options)](#corsobject-options)
  - [killSlash()](#killslash)
  - [parseBody](#parsebody)
  - [applyToContext](#applytocontext)
  - [reroute](#reroute)
  - [setTitle](#settitle)
  - [SimpleRouter](#simplerouterroad-road)
    - [SimpleRouter.applyMiddleware(road)](#simplerouterapplymiddlewareroad-road)
    - [SimpleRouter.addRoute(*string* method, *string* path,*function* fn)](#simplerouteraddroutestring-method-string-path-function-fn)
    - [SimpleRouter.addRouteFile(*string* full_path)](#simplerouteraddroutefilestring-full_path)
- [build(*string* input_file, *string* output_file, *object* options)](#buildstring-input_file-string-output_file-object-options)
- [PJAX(*object* road, *DomElement* container_element, *object* window)](#pjaxobject-road-domelement-container_element-object-window)
  - [register()](#pjaxregister)
  - [PJAX Link Format](#pjax-link-format)
  - [PJAX Form Format](#pjax-form-format)
  - [PJAX Page titles](#pjax-page-titles)
  - [Isomorphic PJAX tips](#isomorphic-pjax-tips)

## Getting Started

Building a project with roads is very straightforward.

1. Create your Road object

    **TypeScript**
    ```TypeScript
    import * as roads from 'roads';
    let road = new roads.Road();
	```

    **JavaScript**
    ```JavaScript
    const roads = require('roads');
    let road = new roads.Road();
	```

2. Add code to the road

    **TypeScript**
    ```TypeScript
    import * as roads from 'roads';
    let road = new roads.Road();

    road.use(function (method, path, body, headers) {
        console.log('A ' + method + ' request was made to ' + path);
    });
	```

    **JavaScript**
    ```JavaScript
    const roads = require('roads');
    let road = new roads.Road();

    road.use(function (method, path, body, headers) {
        console.log('A ' + method + ' request was made to ' + path);
    });
	```

5. Run your code.

 - roads-server helps you attach your road to the standard node HTTP server. Feel free to use other http servers. roads-server is documented below.

     **TypeScript**
    ```TypeScript
    import * as roads from 'roads';
    import { Server } from 'roads-server';

    let road = ...; // See steps 1 and 2 for road construction
    let server = new Server(road, function (error) {
        console.log('roads encountered an error', error);
    });

    server.listen(8080);
	```

    **JavaScript**
    ```JavaScript
    const roads = require('roads');
    const Server = require('roads-server').Server;

    let road = ...; // See steps 1 and 2 for road construction
    let server = new Server(road, function (error) {
        console.log('roads encountered an error', error);
    });

    server.listen(8080);
	```

 - You can manually interact with the road

     **TypeScript**
    ```TypeScript
    import * as roads from 'roads';
    import { Server } from 'roads-server';

    let road = ...; // See steps 1 and 2 for road construction
    // Call directly
    road.request('GET', '/users', {page: 2})
        .then(function (response) {
            console.log(response);
        });
	```

    **JavaScript**
    ```JavaScript
    const roads = require('roads');
    const Server = require('roads-server').Server;

    let road = ...; // See steps 1 and 2 for road construction
    // Call directly
    road.request('GET', '/users', {page: 2})
        .then(function (response) {
            console.log(response);
        });
	```

 - You can use browserify to compile everything for use in the browser. The following are the scripts necessary to compile the previous manual example, if it were saved as a file "client_index.js".

     **TypeScript**
    ```TypeScript
    import { build } from 'roads/build';
    build('client_index.js', __dirname + '/build/client.js', { use_sourcemaps: true });
	```

    **JavaScript**
    ```JavaScript
    const build = require('roads/build');
    build('client_index.js', __dirname + '/build/client.js', { use_sourcemaps: true });
	```


Now that you can use your road, continue reading the docs below for more information on [routers](#simplerouter), [error handling](#roadusefunction-fn), [PJAX support](#roadspjaxobject-road) and more!



## Road

A Road is a container that holds an array of functions called the *request chain*. The request chain generally holds your routing logic, and any pre or post processing instructions. You interact with your road primarily via the [use](#roadusefunction-fn) method, which assigns new functions to the request chain, or the [request](#requeststring-method-string-url-dynamic-body-object-headers) method which executes all functions in the request chain.

### new Road()
**Create a Road.**

Creates your Road object. 

**TypeScript**
```TypeScript
import * as roads from 'roads';
let road = new roads.Road();
```

**JavaScript**
```JavaScript
const roads = require('roads');
let road = new roads.Road();
```


### Road.use(*Function* fn)
**Add a custom function that will be executed with every request.**

The use function can be called one or more times. Each time it is called, the function provided via the `fn` parameter will be added to the end of the request chain. The execution order will match the order the functions were added to the road. 

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(*string* method, *string* url,*string* body,*object* headers,*function* next) | yes      | Adds this function to the request chain, which is executed any time a request is made on the object. See the [use callback](#roadusefunction-fn) below for more details on the function parameters.
 
 **Note:** Each function in the request chain can choose to progress to the following function by calling and returning the `next` parameter. The `next` parameter is defined below as part of the use callback
 
#### use Callback 
**function (*string* method,*string* url, *string* body, *Object* headers, *Function* next)**

name     | type                               | description
 --------|------------------------------------|---------------
 method  | string                             | The HTTP method that was provided to the request
 url     | string                             | The URL that was provided to the request. To have separate code for each url, see the SimpleRouter middleware
 body    | string                             | The body that was provided to the request. To parse this see the parseBody middleware.
 headers | object                             | The headers that were provided to the request
 next    | function                           | The next step of the handler chain. If there are no more custom handlers assigned, next will resolve to the [resource method](#resource-method) that the router located. This method will always return a promise.

If the callback does not return a [response](#roadsresponse) object, roads.request will turn the return value into the response body of a [response](#roadsresponse) object with the default status code of 200 and no headers.


```JavaScript   
// Simple example that sends a JSON response
road.use(function (method, url, body, headers, next) {
    return JSON.stringify({
        method: method,
        url: url,
        body: body,
        headers: headers,
        next: next
    });
});

// Simple async example that sends a JSON response
road.use(async function (method, url, body, headers, next) {
    let db_record = await myPromiseReturningDBCall();

    return JSON.stringify(db_record);
})


// Example of a request handler that kills trailing slashes (This is code is provided for you at middleware.skillSlash!)
// The logic will happen before any other middleware because it's before you call next
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
// The logic will happen after any other middleware because it's in response to the promise result of next();
road.use(function (method, url, body, headers, next) {
    // execute the actual resource method, and return the response
    return next()
        // Catch any errors that are thrown by the resources
        .catch ((err) => {
            // Wrap the errors in response objects. There might be some javascript errors worth translating into different response status codes
            return new roads.Response(unknownRepresentation(err), 500);
        });
});
```

**How do I control the order of my middleware?**

Let's say you have assigned a middlewawre function via `use`. Each function has two places you can put your logic. I have described them in the example below.

```JavaScript
road.use(function (method, url, body, params, next) {
	// This is the first point. This code will be executed first.
	return next()
	.then((response) => {
		// This is the second point. This code will be executed after all subsequent middleware have executed both their first and second mount points.
	});
});
```

You can picture the logic path like a U. The following example assumes two functions have been added to the request chain.

```
First point for                  Second point for        
first middleware                 first middleware
          |                              / \
         \ /                              |
First point for       ____ \     Second mount for
second middleware          /     second middleware
```

As you add more functions to the request chain, it lengthens each side of the U.



### Road.request(*string* method, *string* url, *dynamic* body, *Object* headers)
**Locate and execute the resource method associated with the request parameters.**


This function will execute all of the functions assigned via [use](#roadusefunction-fn) in the order they were assigned and return a [thenable (Promises/A compatible promise)](http://wiki.commonjs.org/wiki/Promises/A). The thenable will always resolve to a [Response](#roadsresponse) object.

Make sure to listen for errors surfaced by the request promise!.


```JavaScript
let promise = road.request('GET', '/users/dashron');

promise.then((response) => {        
    console.log(response);
});

promise.catch((error) => {
    // handle errors
});
```

##### Context
Each middleware function has access to a request context through ```this```. Each ```this``` will be unique to the request and will be reused for each request handler (assigned via `use`). The context is pre-loaded with two variables, listed below.

name             | type     | description
 ----------------|----------|---------------
request          | function | An alias for [Road.request](#roadrequeststring-method-string-url-dynamic-body-object-headers). If you need to make a roads request from within middleware, it is recommended to use this instead of `Road.request`.
Response         | Response | The Response constructor. Every request *should* return a `Response`, so this is provided to simplify the process. If you are constructing a `Response` from within middleware it is recommended that you use this instead of `Roads.Response`.

**Note:** Do not use arrow functions if you want to interact with `this`. JavaScript is unable to transmit the custom `this` object into arrow functions.

```JavaScript
var road = new Road();

road.use(function (method, url, body, headers, next) {
    this.extraInfo = 'hello!';
    return next();
});

road.use(function (method, url, body, headers) {
    // true because the middleware persists to this context
    console.log(this.extraInfo === 'hello!');


    // Easy access to the response object
    return new this.Response('hello world', 200);
});

road.request('GET', '/me').then((response) => {
    console.log(response);
});
```

Middleware is encouraged to add variables to this context to simplify development. Make sure to namespace your variables to ensure there are no conflicts with other librares.

eg:
```JavaScript
var road = new Road();
road.use(function (method, url, body, headers) {
    this.context.my_project.require_authentication = true;
});
```

## Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers. 


### new Response(*mixed* body, *number* status, *Object* headers)
**Constructor**

name        | type                               | description
 -----------|------------------------------------|---------------
 body       | mixed                              | The body of the response.
 status     | number                             | The HTTP Status code.
 headers    | object                             | Key value pairs of http headers.

Create a response object. 

```JavaScript
new Response({"uri": "..."}, 200, {"last-modified":"2014-04-27 00:00:00"});
```

### Body
**The raw JavaScript object returned by the request**

```JavaScript
console.log(response.body);
```

### Status
**The HTTP status returned by the request**

```JavaScript
console.log(response.status);
```

### Headers
**A JavaScript object of all response headers**

```JavaScript
console.log(response.headers);
```

## Middleware

Roads comes bundled with some common middleware. All bundled middleware can be acccessed via the `roads/middleware` package.

```TypeScript
    import * as Middleware from 'roads/middleware';
```

```JavaScript
    let Middleware = require('roads/middleware');
```

### cookie()
**Middleware to add some cookie management functions**

When you use the cookie middleware, it adds one method to the request context and two methods to any response created from the request context.

`this.cookies`
The cookies object on the request context will contain an object with all the parsed out cookie values sent by the client. Each key is the cookie name, each value is the cookie value.

`setCookie(name, value, options)`
Calling this function will set any necessary headers to create or update the cookie on the client. The values directly map to the [cookie](https://github.com/jshttp/cookie) module. 

To remove a cookie, set the value to null.

`getCookies()`
Returns an object with all the response cookies.

```JavaScript
road.use(Middleware.cookie);

roads.use(function (method, url, body, headers) {
	console.log(this.cookies);
	
	let response = new this.Response();
	
	response.setCookie('auth', 12345, {
		domain: 'dashron.com'
	});
	
	console.log(response.getCookies());
	
	return new this.Response(200, 'Hello!');
});
```

### cors(*object* options)
**Middleware to Apply proper cors headers**

Sets up the proper preflight, and standard repsonse headers so that browsers can make proper CORS requests.

The options object spports the following keys

name            | type                               | description
---------------|------------------------------------|---------------
validOrigins  | array                      | An array of origin urls that can send requests to this API
supportsCredentials  | boolean                       | A boolean, true if you want this endpoint to receive cookies
responseHeaders  | array                       | An array of valid HTTP response headers
requestHeaders  | array                       | An array of valid HTTP request headers
validMethods  | array                       | An array of valid HTTP methods
cacheMaxAge  | number                       | The maximum age to cache the cors information

```JavaScript
road.use(Middleware.cors({
    validOrigins: ['http://localhost:8080'],
    responseHeaders: ['content-type']
}));
```

### killSlash()
**Middleware to kill the trailing slash on http requests**

If used, any url that ends with a trailing slash will return a response object redirecting the client to the same url without the trailing slash (302 redirect with Location: [url_without_slash])

```JavaScript
road.use(Middleware.killSlash);
```

### parseBody
**Middleware to parse the request body**

This middleware looks at the Content-Type header, and uses that information to attempt to parse the incoming request body string. The body will be applied to the context field `body`

```JavaScript
road.use(Middleware.parseBody);

road.use(function (method, url, body, headers) {
    console.log(body); // The string '{"name":"dashron"}'
    console.log(this.body); // The parsed object { name : "dashron" }
});

road.request('POST', '/users', '{"name":"dashron"}', {"content-type": "application/json"});
```

### applyToContext
**Middleware to apply a predefined value to the request context**

```JavaScript
road.use(Middleware.applyToContext('example', 'test'));

road.use(function (method, url, body, headers) {
    console.log(this.example); // test
});
```

### reroute
**Middleware that offers a function in the request context that allows you to easily interact with a road**

In the following exxample, road and APIRoad are two different Road objects.
```JavaScript
road.use(Middleware.reroute('api', APIRoad));

road.use(function (method, url, body, headers) {
    this.api('GET', '/users')
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
});
```

### setTitle
**Middleware that helps you work with setting page titles. Used in conjunction with PJAX's setTitle**

See [PJAX](#pjaxobject-road-domelement-container_element-object-window) for more information about this middleware.

### SimpleRouter(*Road* road)
This is a simple router middleware for roads. To use it, you have to take a couple of steps.

1. Create your road (see [Getting Started](#getting-started) step 1)
2. Load the Middleware (see [Middleware](#middleware))
3. Create your Router

```JavaScript
    let router = new Middleware.SimpleRouter(road);
```

3. Assign routes to the router

```JavaScript
    // This is a simple route with no URI variables
    router.addRoute('GET', '/posts', (url, body, headers) => {
        // url, body and headers are all identical to the values sent to functions in roads.use
    });

    // This route supports numeric variables
    router.addRoute('GET', '/posts/#post_id', (url, body, headers) => {
        // url.args.post_id will contain the integer from the URL.
        // e.g. GET /posts/12345 will have url.args.post_id === 12345
    });

    // This route supports any variable
    router.addRoute('GET', '/posts/$post_slug', (url, body, headers) => {
        // url.args.post_slug will contain the value from the URL.
        // e.g. GET /posts/my-post will have url.args.post_slug === 'my-ost'
    });
```

You can assign functions to url paths, and those paths can have some very basic variable templating. See addRoute for more details.

#### SimpleRouter.applyMiddleware(*Road* road)
If you don't provide a road to the SimpleRouter constructor, the router will not be used. This function allows you to assign the router to the road middleware.

#### SimpleRouter.addRoute(*string* method, *string* path, *function* fn)

This assigns a function to an HTTP Method and Path combination. When roads middleware uses the Simple Router, incoming requests will execute the appropriate function for the incoming method and path.

When assigning a function, you can use a simple templating language in your path. In these templates each URI is considered to be a series of "path parts" separated by slashes.
 - If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 - If a path part starts with a $, it is considered to be an alphanumeric variabe. All non-slash values will match this route.

Any variables will be added to the route's request url object under the "args" object.

e.g. /users/#user_id will match /users/12345, not /users/abcde. If a request is made to /users/12345 the route's requestUrl object will contain { args: {user_id: 12345}} along with all other url object values

```JavaScript
    // This is a simple route with no URI variables
    router.addRoute('GET', '/posts', (url, body, headers) => {
        // url, body and headers are all identical to the values sent to functions in roads.use
    });

    // This route supports numeric variables
    router.addRoute('GET', '/posts/#post_id', (url, body, headers) => {
        // url.args.post_id will contain the integer from the URL.
        // e.g. GET /posts/12345 will have url.args.post_id === 12345
    });

    // This route supports any variable
    router.addRoute('GET', '/posts/$post_slug', (url, body, headers) => {
        // url.args.post_slug will contain the value from the URL.
        // e.g. GET /posts/my-post will have url.args.post_slug === 'my-ost'
    });
```

#### SimpleRouter.addRouteFile(*string* full_path)
Add an entire file worth of routes. 

The file should be a node module that exposes an object. 
Each key should be an HTTP path, each value should be an object.
In that object, each key should be an HTTP method, and the value should be your route function.

Example File:
```JavaScript
{
    '/posts/#post_id': {
        'GET': (url, body, headers) => {

        }
    }
}
```

## build(*string* input_file, *string* output_file, *object* options)
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


```TypeScript
    let build = require('roads/build');

    build(__dirname + '/static/client.js', __dirname + '/static/client.brws.js', {
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

```JavaScript
    import build from 'roads/build';

    build(__dirname + '/static/client.js', __dirname + '/static/client.brws.js', {
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

## PJAX(*Object* road, *DomElement* container_element, *Object* window)
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

`data-roads-pjax="link"`

e.g.

`<a href="/home" data-roads-pjax="link">Home</a>`

### PJAX Form Format

If you would like a form to run via PJAX instead of a new page load, simply add the following data attributes

Form attributes
- `data-roads-pjax="form"`

Submit button attributes
- `data-roads-pjax="submit"`

e.g.

```html
    <form method="POST" action="/users/12345" data-roads-pjax="form">
        {{your form elements}{}
        <input type="submit" value="Send message" data-roads-pjax="submit">
    </form>
```

### PJAX Page titles

To handle page titles you will need to add matching middleware to your client and server roads. Roads already includes a simple form of this via the setTitle middleware, and the PJAX function addTitleMiddleware.

Your server should include the following:

```JavaScript
var roads = require('roads');
var Middleware = require('roads/middleware');

var road = ...; // Incomplete. See the getting started section for more information about creating a road
road.use(Middleware.setTitle);
```

```JavaScript
var roads = require('roads');
var road = ...; // Incomplete. See the getting started section for more information about creating a road

var pjax = new roads.RoadsPJAX(road);
pjax.addTitleMiddleware();
pjax.register(window, document.getElementById('container'));
```

### Isomorphic PJAX tips

There's a very easy pattern to follow to ensure sharing client and server code works successfully via PJAX. You can see this pattern in more detail in the examples folder

1. Keep your backend only, and the mixed frontend-or-backend routes in separate files
2. Have a "server" script that gets your backend server running, applying both backend and mixed routes
3. Have a "build" script that compiles your frontend server, applying only the mixed routes.
4. Keep your page layout (headers, footers, body, meta tags, etc.) in the "backend only" section.
5. Keep your DB calls in the "backend only" section
6. Make sure the mixed frontend-or-backend routes only ever make HTTP requests, or render HTML