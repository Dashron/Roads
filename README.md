# Roads.js - Write once, run everywhere

Roads is an isomorphic web framework that lets you share routing logic between your server and browser. The same code that handles requests on your Node.js server can power client-side navigation and be tested without any HTTP overhead.

```javascript
// This exact same code works on the server AND in the browser
const road = new Road();

road.use((method, path, body, headers) => {
    return `Hello from ${path}!`;
});

// Server: Attach to any HTTP server
server.use(road);

// Browser: Enable instant page navigation
const pjax = new RoadsPJAX(road, document.body, window);

// Tests: No server needed!
const response = await road.request('GET', '/api/users');
```

## What makes Roads different

**True isomorphism** - The same routing code runs on Node.js servers and in browsers. No more duplicating logic.

**Framework agnostic** - Works with Express, standalone HTTP servers, or completely serverless. Your choice.

**Testing made simple** - Test your routes directly without HTTP overhead. Perfect for TDD and CI/CD.

**Built for modern JavaScript** - Async/await throughout, promises everywhere, TypeScript-first design.


## Quick Navigation

**Getting Started**
- [Installation & Basic Setup](#getting-started) - Get up and running in 2 minutes
- [Core Concepts](#road) - Understanding Roads, middleware, and responses

**Going Further** 
- [Routing & URL Handling](#router) - Build REST APIs and handle dynamic URLs
- [Bundled Middleware](#bundled-middleware) - Cookies, CORS, body parsing, and more
- [Browser Integration](#roadspjax) - PJAX for lightning-fast page navigation

**Reference**
- [API Documentation](#road) - Complete method signatures and options

[![Node CI](https://github.com/Dashron/roads/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Dashron/roads/actions/workflows/nodejs.yml)

# Getting Started

## Installation

```bash
npm install roads
```

## Your first Road

Let's build something that actually returns a response:

```javascript
import { Road } from 'roads';

const road = new Road();

// Add a simple route handler
road.use((method, path, body, headers) => {
    if (path === '/hello') {
        return 'Hello, Roads!';
    }
    return 'Page not found';
});

// Test it directly (no server needed!)
const response = await road.request('GET', '/hello');
console.log(response.body); // "Hello, Roads!"
```

That's it! You've created your first Road. 

## Add Express integration

```javascript
import express from 'express';
import { Road, attachCommonMiddleware } from 'roads';

const app = express();
const road = new Road();

// Add common middleware (body parsing, trailing slash removal, etc.)
attachCommonMiddleware(road);

// Your routes here...
road.use((method, path, body, headers) => {
    if (path === '/hello') {
        return 'Hello, Roads!';
    }
    return 'Page not found';
});

// Connect your Road to Express - you'll need to create this middleware
// See the documentation for server integration examples

app.listen(3000);
console.log('Server running at http://localhost:3000/hello');
```

Visit `http://localhost:3000/hello` and you'll see your response. The same code that worked for testing now powers your web server.

## Make it work in the browser too

Bundle your Road with any bundler (webpack, esbuild, etc.) and enable instant page navigation:

```javascript
// In your bundled client-side code
import { RoadsPJAX } from 'roads';

const pjax = new RoadsPJAX(road, document.body, window);
pjax.register();

// Now all your routes work client-side for lightning-fast navigation!
```

## What's next?

- [Build a proper API](#router) with dynamic routes and middleware
- [Add authentication, CORS, and body parsing](#bundled-middleware)  
- [Enable PJAX](#roadspjax) for single-page-app-like performance

---

# API Reference

# Road

A Road is a container that holds an array of functions called the *request chain*. The *request chain* generally holds your routing logic and any pre or post processing instructions. You add to the *request chain* via the [use](#roadusefn-function) method, and execute the request chain with the [request](#requestmethod-string-url-string-body-string-headers-object) method.

## new Road()
**Create a Road.**

Creates a new Road object.

**TypeScript**
```TypeScript
import { Road }from 'roads';
let road = new Road();
```

**JavaScript**
```JavaScript
import { Road } from 'roads';
let road = new Road();
```


## use(fn *Function*)
**Add a custom function that will be executed with every request.**

The use function can be called one or more times. Each time it is called, the function provided via the `fn` parameter will be added to the end of the *request chain* which is executed when you call `request`.

 | name | type                                                                                           | required | description                                                                                                                                                     |
 | ---- | ---------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 | fn   | Function(method: *string*, path: *string*, body: *string*, headers: *object*, next: *function*) | yes      | This is the function that will be added to the end of the *request chain*. See the [Middleware](#middleware) below for more details on the function parameters. |

### Middleware

Each function in the request chain is called middleware. Each middleware function must match the following function signature.

**function (method: *string*, path: *string*, body: *string*, headers: *object*, next: *next*): Promise<Response | string>**

Parameters
| name    | type                         | description                                                                                      |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| method  | string                       | The request's HTTP method                                                                        |
| path    | string                       | The request's path. Use the Router middleware for advanced URL pattern matching.                |
| body    | string \| undefined          | The request's body (as a string). Use ParseBodyMiddleware to parse JSON/form data.              |
| headers | object \| undefined          | The request's headers. This is an object of strings or arrays of strings.                        |
| next    | function(): Promise<Response \| String> | The next step of the *request chain*. If there are no more steps in the *request chain* this returns a 404. This method will always return a promise, which resolves to a `Response` object, or a string. |

Each middleware function must return a promise that resolves to a [Response](#response) object or a string. If you return a string it will be transformed into a response object using the default status code (200) and no headers.


```JavaScript
// Simple example that sends a JSON response and doesn't continue through the request chain
road.use(function (method, path, body, headers, next) {
    return JSON.stringify({
        method: method,
        path: path,
        body: body,
        headers: headers
    });
});

// Simple async example that sends a JSON response and doesn't continue through the request chain
road.use(async function (method, path, body, headers, next) {
    let db_record = await myPromiseReturningDBCall();

    return JSON.stringify(db_record);
})


// Example of middleware that redirects the user if their path has a trailing slash, otherwise it
//	continues through the request chain
road.use(function (method, path, body, headers, next) {
    if (path != '/' && path[path.length - 1] === '/') {
        return new Response(null, 302, {
            location: path.substring(0, path.length - 1)
        });
    }

    return next();
});

// Example of middleware that catches errors and returns a 500 status code
road.use(function (method, path, body, headers, next) {
    // Continue down the request chain, and only execute this middleware logic afterwards
    return next()
        // Catch any errors that are thrown by the resources
        .catch ((err) => {
            console.error(err);
            // Wrap the errors in response objects.
            return new Response('Unknown error', 500);
        });
});
```

### How do I control the order of my middleware?

Within your middleware function you can add logic that happens before you continue down the request chain, and after the request chain has finished executing.

```JavaScript
road.use(function (method, path, body, headers, next) {
    console.log('This happens at the start of a request, before we continue down the request chain');
    return next()
        .then((response) => {
            console.log('This happens later, after the request chain resolves');
            return response;
        });
});
```

You can picture the logic path like a U. The following example assumes two functions have been added to the request chain.

```
Start of request for                End of request for
the first middleware                the first middleware
          |                                 / \
         \ /                                 |
Start of request for      ____ \    End of request for
the second middleware          /    the second middleware
```

As you add more functions to the request chain, it lengthens each arm of the U.


### Context
Each middleware function has access to a request context through `this`. This context will be different for each request, but identical for each middleware in a *request chain*.

**Note:** Do not use arrow functions if you want to interact with `this`. You will not have access to the context if you use arrow functions, and it may have unintended side effects.

```JavaScript
road.use(function (method, path, body, headers, next) {
    this.extraInfo = 'hello!';
    return next();
});

road.use(function (method, path, body, headers) {
    return new Response(this.extraInfo, 200);
});

road.request('GET', '/me').then((response) => {
    // This will log "hello!"
    console.log(response.body);
});
```

Middleware is encouraged to add variables to this context to simplify development. Make sure to namespace your variables to ensure there are no conflicts with other librares.

eg:
```JavaScript
var road = new Road();
road.use(function (method, path, body, headers) {
    this.myProject_requireAuthentication = true;
});
```

You can also use the [StoreValsMiddleware](#storevalsmiddleware) to ensure you don't have conflicts with other middleware.

#### Typing your context
In Typescript you can define your context type with a generic.

```TypeScript
road.use<{ hello: string }>(function (method, path, body, headers) {
	console.log(this.hello);
});
```

Many of the bundled middleware include their contexts, and you can merge them together with `&`.

```TypeScript
import { StoreValsMiddleware, CookieMiddleware } from 'roads';

road.use<StoreValsMiddleware.StoreValsContext & CookieMiddleware.CookieContext>(function (method, path, body, headers) {
	console.log(this.getCookies());
	console.log(this.getAllVals());
});
```

## request(method: *string*, url: *string*, body?: *string*, headers?: *object*)
**Locate and execute the resource method associated with the request parameters.**

This function will execute the *request chain* in the order they were assigned via  [use](#roadusefunction-fn) and return a Promise that resolves to a [Response](#response)

The parameters are all the standard HTTP request parameters.

Make sure to catch any errors in the promise!


```JavaScript
let promise = road.request('GET', '/users/dashron');

promise.then((response) => {
    console.log(response);
});

promise.catch((error) => {
    // handle errors
});
```

# Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers.


## new Response(body: *string | Buffer*, status?: *number*, headers?: *object*)
**Constructor**
Create a response object.

| name    | type           | description                                                       |
| ------- | -------------- | ----------------------------------------------------------------- |
| body    | string \| Buffer | The body of the response.                                         |
| status  | number         | The HTTP Status code.                                             |
| headers | object         | All the headers. The value may be a string or an array of strings |


```JavaScript
new Response("Hello!", 200, {"last-modified":"2014-04-27 00:00:00"});
```

## Body
**The raw JavaScript object returned by the request**

```JavaScript
console.log(response.body);
```

## Status
**The HTTP status returned by the request**

```JavaScript
console.log(response.status);
```

## Headers
**A JavaScript object of all response headers. The value might be a string or an array of strings**

```JavaScript
console.log(response.headers);
```

# Bundled Middleware

Roads includes several useful middleware to handle common web development tasks. Here are the ones you'll use most:

## Common Middleware Setup

Roads includes an `attachCommonMiddleware` function that sets up frequently used middleware:

```javascript
import { Road, attachCommonMiddleware } from 'roads';

const road = new Road();

// Adds: RemoveTrailingSlash, StoreVals, ParseBody, and ModifiedSince middleware
attachCommonMiddleware(road);
```

## Cookies

Need to read and set cookies? Roads makes it simple:

```javascript
import { Road, CookieMiddleware } from 'roads';

const road = new Road();

// Server-side: automatically handles Set-Cookie headers
road.use(CookieMiddleware.serverMiddleware);

// Now you can read and write cookies in your routes
road.use(function (method, path, body, headers) {
    // Read cookies
    const userToken = this.getCookies().auth;
    
    // Set a cookie
    this.setCookie('lastVisit', new Date().toISOString());
    
    return 'Cookie set!';
});
```

### buildClientMiddleware(pageDocument: *Document*)
Creates a middleware function to attach to your road via `road.use`. This middleware will add the cookie to document.cookie, so it's most useful to be used client side

```JavaScript
import { CookieMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(CookieMiddleware.buildClientMiddleware(document));
```

### Cookie Context
The Cookie Context represents the request context when either the server or client middleware are used. This context includes two functions.

When you're using typescript you can pass this context to one of the middleware or route's generics to get proper typing on the request context.

#### setCookie(name: *string*, value?: *string*, options?: *object*)
Calling this function will store your new cookies. The parameters directly map to the [cookie](https://github.com/jshttp/cookie) module.

To remove a cookie, set the value to null.

These cookies will be automatically applied to the response after your request

```TypeScript
import { CookieMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(CookieMiddleware.serverMiddleware);

road.use<CookieMiddleware.CookieContext>(function (method, path, body, headers, next) {
    console.log(this.getCookies());

    this.setCookie('auth', '12345', {
        domain: 'dashron.com'
    });

    // The cookie middleware will automatically apply the Set-Cookies header to this response
    return new Response('Hello!', 200);
});
```


#### getCookies()
Returns an object with all the cookies. It defaults to all the request cookies, but merges anything applied via setCookie on top (i.e. setCookie will override the request cookie)

```TypeScript
import { CookieMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(CookieMiddleware.serverMiddleware);

road.use<CookieMiddleware.CookieContext>(function (method, path, body, headers, next) {
    console.log(this.getCookies());
});
```

## CORS
**Middleware to Apply proper cors headers**

This middleware sets up everything you need for your server to properly respond to CORS requests.

The options object supports the following properties.

| name                | type    | description                                                  |
| ------------------- | ------- | ------------------------------------------------------------ |
| validOrigins        | array   | An array of origin urls that can send requests to this API   |
| supportsCredentials | boolean | A boolean, true if you want this endpoint to receive cookies |
| responseHeaders     | array   | An array of valid HTTP response headers                      |
| requestHeaders      | array   | An array of valid HTTP request headers                       |
| validMethods        | array   | An array of valid HTTP methods                               |
| cacheMaxAge         | number  | The maximum age to cache the cors information                |

```JavaScript
import { CorsMiddleware, Road } from 'roads';

var road = new Road();
road.use(CorsMiddleware.build({
    validOrigins: ['http://localhost:8080'],
    responseHeaders: ['content-type']
}));
```

## Parsing request bodies
**Middleware to parse the request body**

This middleware looks at the Content-Type header and uses that information to attempt to parse the incoming request body string. The body will be applied to the context field `body`.

```JavaScript
import { ParseBodyMiddleware, Road } from 'roads';

var road = new Road();
road.use(ParseBodyMiddleware.middleware);
```


### Parse Body Context

`ParseBodyContext<BodyType>`
When using typescript you can pass this when adding middleware or routes to see proper typing on `this`.

This context specifically adds one variable `body` which will match the structure passed to the `ParseBodyContext` via the `BodyType` generic.

```TypeScript
import { ParseBodyMiddleware, Road } from 'roads';

var road = new Road();
road.use(ParseBodyMiddleware.middleware);

road.use<ParseBodyMiddleware.ParseBodyContext<{
    name: string,
    description?: string
}>>(function (method, path, body, headers) {
    // body === string representation of the input. In this example, '{"name":"dashron"}'
    // this.body === parsed version of that representation. In this example, {"name": "dashron"}
    // this.body.name will be properly identified by typescript due to the generic BodyType passed to ParseBodyContext. In this example, "dashron"
});

road.request('POST', '/users', '{"name":"dashron"}', {"content-type": "application/json"});
```

## Remove trailing slash
**Middleware to kill the trailing slash on http requests**

Exposes a single middleware function to remove trailing slashes in HTTP requests. This is done by redirecting the end user to the same route without the trailing slash.

When used, any url that ends with a trailing slash will immediately return a response object redirecting the client to the same url without the trailing slash (302 redirect with Location: [url_without_slash])

```JavaScript
import { RemoveTrailingSlashMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(RemoveTrailingSlashMiddleware.middleware);
```

## Router
This is a Router middleware for roads. It allows you to easily attach functionality to HTTP methods and paths.

Here's how you use it.

1. Create your road (see [Getting Started](#getting-started))
2. Create your Router

```JavaScript
    import { RouterMiddleware, Road } from 'roads';
    const road = new Road();
    const router = new RouterMiddleware.Router(road);
```

3. Assign routes to the router

```JavaScript
    // This is a simple route with no path variables
    router.addRoute('GET', '/posts', function (method, url, body, headers, next) {
        // url is a parsed URL object, body and headers are the request data
        return 'All posts';
    });

    // This route supports numeric variables
    router.addRoute('GET', '/posts/#post_id', function (method, url, body, headers, next) {
        // url.args.post_id will contain the integer from the URL.
        // e.g. GET /posts/12345 will have url.args.post_id === 12345
        return `Post ${url.args.post_id}`;
    });

    // This route supports any variable
    router.addRoute('GET', '/posts/$post_slug', function (method, url, body, headers, next) {
        // url.args.post_slug will contain the value from the URL.
        // e.g. GET /posts/my-post will have url.args.post_slug === 'my-post'
        return `Post: ${url.args.post_slug}`;
    });
```

**Note:** This router supports the `x-http-method-override` header and `_method` query parameter on `POST` requests, which allow you to route to a different HTTP method than `POST`.

### applyMiddleware(road: *Road*)
If you don't provide a road to the SimpleRouter constructor, your routes will not be executed. If you have reason not to assign the road off the bat, you can assign it later with this function.

### addRoute(method: *string*, path: *string*, fn: *function*)

This is where you want to write the majority of your webservice. The `fn` parameter should contain the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object.

**Note:** The function must not be an arrow function! If you use an arrow function you will not have access to the request context.


The path supports a very basic templating system. The values inbetween each slash can be interpreted in one of three ways
 - If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 - If a path part starts with a $, it is considered to be an alphanumeric variabe. All non-slash values will match this route.
 - If a path starts with anything but a # or a $, it is assumed to be a literal. Only that value will match this route.

e.g. /users/#userId will match /users/12345, not /users/abcde. If a request is made to /users/12345 the route's requestUrl object will include the key value pair of `args: { userId: 12345 }`

Any variables will be added to the route's request url object under the "args" object.

```JavaScript
    // This is a simple route with no URI variables
    router.addRoute('GET', '/posts', function (method, url, body, headers, next) {
        // url is a parsed URL object with pathname, query, etc.
        return 'All posts';
    });

    // This route supports numeric variables
    router.addRoute('GET', '/posts/#postId', function (method, url, body, headers, next) {
        // url.args.postId will contain the integer from the URL.
        // e.g. GET /posts/12345 will have url.args.postId === 12345
        return `Single Post`;
    });

    // This route supports any variable
    router.addRoute('GET', '/posts/$postSlug', function (method, url, body, headers, next) {
        // url.args.postSlug will contain the value from the URL.
        // e.g. GET /posts/my-post will have url.args.postSlug === 'my-post'
        return `Single Post`;
    });
```

Add route also supports the same context generics as `road.use`.

```TypeScript
	router.addRoute<CookieMiddleware.CookieContext>('GET', '/posts/$postSlug', function (method, url, body, headers, next) {
		console.log(this.getCookies());
		return `Single Post`;
	});
```

### Multiple Handlers Per Route

The Router supports passing multiple functions as an array for a single route, creating a request chain for that specific route:

```JavaScript
// Multiple functions can be passed as an array for a single route
router.addRoute('GET', '/protected', [
    function (method, url, body, headers, next) {
        // First middleware - authentication
        if (!this.isAuthenticated()) {
            return new Response('Unauthorized', 401);
        }
        return next();
    },
    function (method, url, body, headers, next) {
        // Second middleware - main logic
        return 'Authenticated user content';
    }
]);
```


### addRouteFile(filePath: *string*, prefix?: *string*)
Add an entire file worth of routes.

| Parameter | Type   | Description                                               |
| --------- | ------ | --------------------------------------------------------- |
| filePath  | string | the path of the file to load                              |
| prefix    | string | the URL path prefix that these routes will be attached to |

- The file should be a node module that exposes an object.
- Each key should be an HTTP path, each value should be an object.
- In that object, each key should be an HTTP method, and the value should be your route function.

Example File:
```JavaScript
{
    '/posts/#post_id': {
        'GET': function (method, url, body, headers, next) {
            return `Post ${url.args.post_id}`;
        }
    }
}
```

```JavaScript
import { RouterMiddleware, Road } from 'roads';
const road = new Road();
const router = new RouterMiddleware.Router(road);
router.addRouteFile('routes.js', '/users/');
```

## If-Modified-Since caching
**Middleware to easily manage caching via if-modified-since headers**

Browsers automatically support a conditional caching mechanism via the `if-modified-since` header. It works as follows.

1. When a browser loads a page the server has the option to send a `last-modified` header indicating the last time this page changed.
2. If the `last-modified` header exists, the browser stores the contents of the page alongside the value of `last-modified`.
3. The next time the browser loads that page it sends the `last-modified` time via the `if-modified-since` header.
4. The server then compares the provided `if-modified-since`  header to the time this page was last changed.
5. If the `if-modified-since` header is newer than the last time the page was changed, the server returns a `304` status code with no body. This tells the browser to load the same contents it loaded last time.
6. If the `if-modified-since` header is older than the last time the page was schanged, the server returns the page as expected.

You can read more on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since).

This style of caching is most useful for static files such as your JavaScript or CSS files.

To use this middleware, add the following code.

```JavaScript
import { ModifiedSinceMiddleware, Road } from 'roads';

var road = new Road();
road.use(ModifiedSinceMiddleware.middleware);

```

To get it working in your route, add the `ModifiedSinceContext` and the following couple of lines to your middleware or route.

```JavaScript
road.use<ModifiedSinceMiddleware.ModifiedSinceContext>(function (method, path, body, headers) {
	const date = ...// `date` is the last time the page changed. For a file on the filesystem this means fs.statSync(filePath).mtime.
	if (this.shouldReturnNotModifiedResponse(date)) {
		return this.buildNotModifiedResponse();
	}
	// Continue with normal response
	return 'Your content here';
});
```

The middleware will automatically return a `last-modified` header equal to the `date` value passed to `shouldReturnNotModifiedResponse`.

### shouldReturnNotModifiedResponse(date: string | Date)
This function returns true if the date provided is less than or equal to the date in the `if-modified-since` header, indicating that a 304 Not Modified response should be returned. False otherwise.

If `date` is a string, it should be a value that can be passed to the `Date(string)` constructor. See [If-Modified-Since caching](#if-modified-since-caching) for an example of how to use this function.

### buildNotModifiedResponse()
This function returns a `304` Response with no body. This is the proper response when the document has not been modified since the `if-modified-since` header. See [If-Modified-Since caching](#if-modified-since-caching) for an example of how to use this function.

# Middleware helpers

The documentation below covers additional generic middleware that are useful when creating new middleware, or other advanced topics.

## Apply To Context
**Middleware to apply a predefined value to the request context**

This middleware is a one liner to assign a value to the context. It's useful for making values easily available to each request, such as an api library.

In the future I hope to have automatic typing for this context, but I'm still thinking through how to pull that off. In the meanwhile you should create your own Context types.

```JavaScript
import { ApplyToContextMiddleware } from 'roads';
road.use(ApplyToContextMiddleware.build('example', 'test'));

road.use<{ example: 'test' }>(function (method, path, body, headers) {
    console.log(this.example); // test
});
```

## Reroute
**Middleware that offers a function in the request context that allows you to easily interact with a road**

In the following example, road and APIRoad are two different Road objects.

```JavaScript
import { RerouteMiddleware, Road } from 'roads';
road.use(RerouteMiddleware.build('api', APIRoad));

road.use<{ api: Road['request'] }>(function (method, path, body, headers) {
    this.api('GET', '/users')
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
});
```

## Store Values
**Middleware that helps you save arbitrary data inside of a request context**

This middleware adds three functions, `storeVal(key, val)`, `getVal(key)`, and `getAllVals()` for storing and retrieving arbitrary values.

```JavaScript
import { StoreValsMiddleware } from 'roads';
road.use(StoreValsMiddleware.middleware);

road.use(function (method, path, body, headers, next) {
    this.storeVal('page-title', 'My Page');
    return next().then((response) => {
        console.log(this.getVal('page-title'));
        console.log(this.getAllVals());
        return response;
    });
});

### storeVal(field: *string*, value: *unknown*)
Stores a value in the context that can be retrieved later in the middleware chain.

### getVal(field: *string*)
Retrieves a previously stored value from the context.

### getAllVals()
Retrieves all stored values as an object.
```


# RoadsPJAX(road: *Road*, containerElement: *HTMLElement*, window: *Window*)
**A helper object to easily enable PJAX on your website using roads**

PJAX is a technique for speeding up webpages by automatically replacing links or form submission with AJAX calls. This allows for clean, quick page refreshes via JavaScript, with a simple fallback if JavaScript is disabled.

PJAX looks in the containerElement at each anchor tag with the  `data-roads-pjax="link"` attribute and changes it from a normal link into a link that uses the road.

| Name             | Type        | Description                                                     |
| ---------------- | ----------- | --------------------------------------------------------------- |
| road             | Road        | The road that will be used when clicking links                  |
| containerElement | HTMLElement | The element that will be filled with your roads output          |
| window           | Window      | The page's window object to help set page title and url |

```HTML
<div id="container"></div>
```

```JavaScript
import { RoadsPJAX, Road } from 'roads';
const road = new Road();
// Add your routes here...

const pjax = new RoadsPJAX(road, document.getElementById('container'), window);
pjax.register();
```

## PJAX.register()

This function call enables PJAX on the current page.

```JavaScript
pjax.register();
```

## PJAX.registerAdditionalElement(element: *HTMLAnchorElement*)

If you would like PJAX to work on links that are not within the container you must call this function. Additionally this function must be called before `register`

```HTML
<div id="container"></div>
<a id="external-link" href="...">link</a>
```

```JavaScript
import { RoadsPJAX, Road } from 'roads';
const road = new Road();
// Add your routes here...

const pjax = new RoadsPJAX(road, document.getElementById('container'), window);
pjax.registerAdditionalElement(document.getElementById("external-link"));
pjax.register();
```


## PJAX Link Format

If you would like a link to run via PJAX instead of a new page load, add the following data attribute to that link.

`data-roads-pjax="link"`

e.g.

`<a href="/home" data-roads-pjax="link">Home</a>`

Note: The link must be within the container for this to work. If you want links outside the container to work you should use [registerAdditionalElement](#pjaxregisteradditionalelementelement-htmlanchorelement)

## PJAX Form Format

If you would like a form to run via PJAX instead of a new page load, add the following data attributes to the relevant elements.

Form attributes
- `data-roads-pjax="form"`

Submit button attributes
- `data-roads-pjax="submit"`

e.g.

```html
    <form method="POST" action="/users/12345" data-roads-pjax="form">
        <!-- your form elements go here -->
        <input type="submit" value="Send message" data-roads-pjax="submit">
    </form>
```

## PJAX Page titles

There are a couple of steps required to get page titles working properly with PJAX.

First you must use the `storeVals` middleware to manage your page title. In the following example we are storing a page title of `"Homepage"`.

```JavaScript
this.storeVal('page-title', 'Homepage');
```

Second you should have your server-side rendering put this value into the `<title>` element of your layout. Check the typescript example for how that could work with the Handlebars templating engine.

Third you need to create your `RoadsPJAX` object and configure it to look for your `page-title` value.


### PJAX Page Title Example
```JavaScript
import { Road, RoadsPJAX, attachCommonMiddleware } from 'roads';

const road = new Road();
attachCommonMiddleware(road); // Adds StoreVals middleware for page titles

// Your routes here...
road.use(function (method, path, body, headers) {
    this.storeVal('page-title', 'Homepage');
    return '<h1>Homepage</h1><p>Welcome!</p>';
});

const pjax = new RoadsPJAX(road, document.getElementById('container'), window);
pjax.addTitleMiddleware('page-title');
pjax.register();
```


# Isomorphic PJAX tips

There's a very easy pattern to follow to ensure sharing client and server code works successfully via PJAX. You can see this pattern in more detail in the examples folder

1. Any route that is unsafe to be run in the browser should be kept in separate files from the rest.
2. Create two initalization scripts. One for starting the server, and one that will be compiled and loaded in the browser.
3. Compile the browser script to be run in the browser. Currently I recommend esbuild, and that's how the typescript example works.
4. Load the browser script on any server side page that should enable PJAX.

# SPA's
Check out roads-spa for an example of how to use roads to build a single page application

# Islands Pattern
Check out roads-ssr for an example of how to use roads with the islands pattern.

