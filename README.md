# The Roads.js isomorphic web framework

Roads is a simple web framework. It's similar to Express.js, but has some very intentional design differences.

# Why should I use Roads?

1. Roads is isomorphic, which means your code can trivially be run server side or in the browser with the exact same code.
2. Roads can be attached to any node HTTP server, including the standard node HTTP server or Express.js.
3. Roads can be run without being attaching to an HTTP server. This is great for writing tests, working with web sockets, or writing API first websites.


# Build Status
![Build status](https://travis-ci.org/Dashron/roads.svg?branch=master)

# Table of Contents
- [Getting Started](#getting-started)
- [Road](#road)
  - [new Road()](#new-road)
  - [use(fn *Function*)](#usefn-function)
    - [Middleware](#middleware)
    - [How do I control the order of my middleware?](#how-do-i-control-the-order-of-my-middleware)
  - [request(method: *string*, url: *string*, body?: *string*, headers?: *object*)](#requestmethod-string-url-string-body-string-headers-object)
    - [Context](#context)
- [Response](#response)
  - [new Response(body: *string*, status?: *number*, headers?: *object*)](#new-responsebody-string-status-number-headers-object)
  - [Body](#body)
  - [Status](#status)
  - [Headers](#headers)
- [Bundled Middleware](#bundled-middleware)
  - [Cookies](#cookies)
  - [CORS](#cors)
  - [Parsing request bodies](#parsing-request-bodies)
  - [Remove trailing slash](#remove-trailing-slash)
  - [Simple router](#simple-router)
    - [applyMiddleware(road: *Road*)](#applymiddlewareroad-road)
    - [addRoute(method: *string*, path: *string*, fn: *function*)](#addroutemethod-string-path-string-fn-function)
    - [addRouteFile(filePath: *string*)](#addroutefilefilepath-string)
- [Middleware helpers](#middleware-helpers)
  - [Apply To Context](#apply-to-context)
  - [Reroute](#reroute)
  - [Store Values](#store-values)
- [PJAX(road: *Road*, containerElement: *DomElement*, window: *Window*)](#pjaxroad-road-containerelement-domelement-window-window)
  - [PJAX.register()](#pjaxregister)
  - [PJAX.registerAdditionalElement(element: *HTMLAnchorElement*)](#pjaxregisteradditionalelementelement-htmlanchorelement)
  - [PJAX Link Format](#pjax-link-format)
  - [PJAX Form Format](#pjax-form-format)
  - [PJAX Page titles](#pjax-page-titles)
    - [PJAX Page Title Example](#pjax-page-title-example)
- [Isomorphic PJAX tips](#isomorphic-pjax-tips)
- [FAQ](#faq)


# Getting Started

Building a project with roads is very straightforward.

1. Create your Road object

    **TypeScript**
    ```TypeScript
    import { Road } from 'roads';
    let road = new Road();
    ```

    **JavaScript**
    ```JavaScript
    const { Road } = require('roads');
    let road = new Road();
    ```

2. Add code to the road

    **TypeScript**
    ```TypeScript
    import { Road } from 'roads';
    let road = new Road();

    road.use(function (method, path, body, headers) {
        console.log('A ' + method + ' request was made to ' + path);
    });
    ```

    **JavaScript**
    ```JavaScript
    const { Road } = require('roads');
    let road = new Road();

    road.use(function (method, path, body, headers) {
        console.log('A ' + method + ' request was made to ' + path);
    });
    ```

3. Run your code.
    - **HTTP**: The following examples show how easy it is to hook up an HTTP server with roads and roads-server, but you can also connect it to express.js or any other http server.

     **TypeScript**
    ```TypeScript
    import { Server } from 'roads-server';

    const road = ...; // See steps 1 and 2 for road construction
    const server = new Server(road);
    server.listen(8080);
    ```

    **JavaScript**
    ```JavaScript
    const { Server } = require('roads-server');

    const road = ...; // See steps 1 and 2 for road construction
    const server = new Server(road);
    server.listen(8080);
    ```

 - **Direct requests**: The following examples show how you can manually trigger roads.

     **TypeScript**
    ```TypeScript
    const road = ...; // See steps 1 and 2 for road construction
    // Call directly
    road.request('GET', '/users', {page: 2})
        .then(function (response) {
            console.log(response);
        });
    ```

    **JavaScript**
    ```JavaScript
    const road = ...; // See steps 1 and 2 for road construction
    // Call directly
    road.request('GET', '/users', {page: 2})
        .then(function (response) {
            console.log(response);
        });
    ```

 - You can also use browserify to compile everything for use in the browser. Check out the file example/ts/build.ts for more details.


Now that you can interact with your ROad, continue reading the docs below for more information on [routers](#simplerouter), [error handling](#roadusefn-function), [PJAX support](#pjaxroad-road) and more!



# Road

A Road is a container that holds an array of functions called the *request chain*. The *request chain* generally holds your routing logic and any pre or post processing instructions. You add to the *request chain* via the [use](#roadusefn-function) method, and execute the request chain with the [request](#requestmethod-string-url-string-body-string-headers-object) method.

## new Road()
**Create a Road.**

Creates your Road object.

**TypeScript**
```TypeScript
import { Road }from 'roads';
let road = new Road();
```

**JavaScript**
```JavaScript
const { Road } = require('roads');
let road = new Road();
```


## use(fn *Function*)
**Add a custom function that will be executed with every request.**

The use function can be called one or more times. Each time it is called, the function provided via the `fn` parameter will be added to the end of the *request chain* which is executed when you call `request`.

 name | type                                                                  | required | description
 -----|-----------------------------------------------------------------------|----------|---------------
 fn   | Function(method: *string*, url: *string*, body: *string*, headers: *object*, next: *function*) | yes      | This is the function that will be added to the end of the *request chain*. See the [Middleware](#middleware) below for more details on the function parameters.

### Middleware

Each function in the request chain is called middleware. Each middleware function must match the following function signature.

**function (method: *string*, url: *string*, body: *string*, headers: *object*, next: *next*): Promise<Response | string>**

Parameters
name     | type                                   | description
 --------|----------------------------------------|---------------
 method  | string                                 | The request's HTTP method
 url     | string                                 | The request's URL. The `SimpleRouter` is included to help run different code for different URLs.
 body    | string                                 | The request's body (as a string). To parse this check out the `parseBodyMiddleware`
 headers | object                                 | The request's headers. This is an object of strings or arrays of strings.
 next    | function(): Promise<Response | String> | The next step of the *request chain*. If there are no more steps in the *request chain* this does nothing. This method will always return a promise, which resolves to a `Response` object, or a string.

Each middleware function must return a promise that resolves to a [Response](#response) object or a string. If you return a string it will be transformed into a response object using the default status code (200) and no headers.


```JavaScript
// Simple example that sends a JSON response and doesn't continue through the request chain
road.use(function (method, url, body, headers, next) {
    return JSON.stringify({
        method: method,
        url: url,
        body: body,
        headers: headers
    });
});

// Simple async example that sends a JSON response and doesn't continue through the request chain
road.use(async function (method, url, body, headers, next) {
    let db_record = await myPromiseReturningDBCall();

    return JSON.stringify(db_record);
})


// Example of middleware that redirects the user if their url has a trailing slash, otherwise it
//	continues through the request chain
road.use(function (method, url, body, headers, next) {
    if (url.path != '/' && url.path[url.path.length - 1] === '/') {
        return new roads.Response(null, 302, {
            location: url.path.substring(0, url.path.length - 1)
        });
    }

    return next();
});

// Example of middleware that catches errors and returns a 500 status code
road.use(function (method, url, body, headers, next) {
    // Continue down the request chain, and only execute this middleware logic afterwards
    return next()
        // Catch any errors that are thrown by the resources
        .catch ((err) => {
            console.err(err);
            // Wrap the errors in response objects.
            return new roads.Response('Unknown error', 500);
        });
});
```

### How do I control the order of my middleware?

Within your middleware function you can add logic that happens before you continue down the request chain, and after the request chain has finished executing.

```JavaScript
road.use(function (method, url, body, params, next) {
    console.log('This happens at the start of a request, before we continue down the request chain');
    return next()
        .then((response) => {
            console.log('This happens later, after the request chain resolves');
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

## request(method: *string*, url: *string*, body?: *string*, headers?: *object*)
**Locate and execute the resource method associated with the request parameters.**


This function will execute the *request chain* in the order they were assigned via  [use](#roadusefunction-fn) and return a Promise that resolves to a [Response](#response)

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

### Context
Each middleware function has access to a request context through `this`. This context will be different for each request, but identical for each middleware in a *request chain*.

**Note:** Do not use arrow functions if you want to interact with `this`. You will not have access to the context if you use arrow functions, and it may have unintended side effects.

```JavaScript
road.use(function (method, url, body, headers, next) {
    this.extraInfo = 'hello!';
    return next();
});

road.use(function (method, url, body, headers) {
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
road.use(function (method, url, body, headers) {
    this.myProject_requireAuthentication = true;
});
```

You can also use the [StoreValsMiddleware](#storevalsmiddleware) to ensure you don't have conflicts with other middleware.

# Response

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers.


## new Response(body: *string*, status?: *number*, headers?: *object*)
**Constructor**
Create a response object.

name        | type    | description
 -----------|---------|---------------
 body       | string  | The body of the response.
 status     | number  | The HTTP Status code.
 headers    | object  | All the headers. The value may be a string or an array of strings


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

Roads comes bundled with a handfull of middleware functions.

## Cookies
**Middleware to add some cookie management functions**

When you use the cookie middleware it adds two methods to the request context.

`this.setCookie(name, value, options)`
Calling this function will store your new cookies. The parameters directly map to the [cookie](https://github.com/jshttp/cookie) module.

To remove a cookie, set the value to null.

These cookies will be automatically applied to the response after your request

`this.getCookies()`
Returns an object with all the cookies. It defaults to all the request cookies, but merges anything applied via setCookie on top (i.e. setCookie will override the request cookie)

`CookieContext`
If you use the CookieContext (as shown in the example below) it will ensure that typescript is aware of the `setCookie` and `getCookie` methods on the request context.

```JavaScript
import { CookieContext } from 'roads/types/middleware/cookieMiddleware';
import { CookieMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(CookieMiddleware.serverMiddleware);

road.use<CookieContext>(function (method, path, body, headers, next) {
    console.log(this.getCookies());

    this.setCookie('auth', 12345, {
        domain: 'dashron.com'
    });

    console.log(this.getCookies());

    // The cookie middleware will automatically apply the Set-Cookies header to this response
    return new Response('Hello!', 200);
});
```

## CORS
**Middleware to Apply proper cors headers**

Sets up everything you need for your server to properly respond to CORS requests.

The options object supports the following properties.

name                 | type                               | description
---------------------|------------------------------------|---------------
validOrigins         | array                              | An array of origin urls that can send requests to this API
supportsCredentials  | boolean                            | A boolean, true if you want this endpoint to receive cookies
responseHeaders      | array                              | An array of valid HTTP response headers
requestHeaders       | array                              | An array of valid HTTP request headers
validMethods         | array                              | An array of valid HTTP methods
cacheMaxAge          | number                             | The maximum age to cache the cors information

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

This middleware looks at the Content-Type header, and uses that information to attempt to parse the incoming request body string. The body will be applied to the context field `body`

`ParseBodyContext<BodyType>`
This context ensures that

```JavaScript
import { ParseBodyContext } from 'roads/types/middleware/parseBody';
import { ParseBodyMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(ParseBodyMiddleware.middleware);

road.use<ParseBodyContext<{
    name: string,
    description?: string
}>>(function (method, url, body, headers) {
    // body === string representation of the input. In this example, '{"name":"dashron"}'
    // this.body === parsed version of that representation. In this example, {"name": "dashron"}
    // this.body.name will be properly identified by typescript due to the generic BodyType passed to ParseBodyContext. In this example, "dashron"
});

road.request('POST', '/users', '{"name":"dashron"}', {"content-type": "application/json"});
```

## Remove trailing slash
**Middleware to kill the trailing slash on http requests**

If used, any url that ends with a trailing slash will return a response object redirecting the client to the same url without the trailing slash (302 redirect with Location: [url_without_slash])

```JavaScript
import { RemoveTrailingSlashMiddleware, Response, Road } from 'roads';

var road = new Road();
road.use(RemoveTrailingSlashMiddleware.middleware);
```

## Simple router
This is a simple router middleware for roads. It allows you to easily attach functionality to HTTP methods and paths.

Here's how you use it.

1. Create your road (see [Getting Started](#getting-started) step 1)
2. Create your Router

```JavaScript
    import { SimpleRouterMiddleware } from 'roads';
    let router = new SimpleRouterMiddleware.SimpleRouter(road);
```

3. Assign routes to the router

```JavaScript
    // This is a simple route with no path variables
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

### applyMiddleware(road: *Road*)
If you don't provide a road to the SimpleRouter constructor, your routes will not be executed. If you have reason not to assign the road off the bat, you can assign it later with this function.

### addRoute(method: *string*, path: *string*, fn: *function*)

This is where you want to write the majority of your webservice. The `fn` parameter should contain the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object.

The path supports a very basic templating system. The values inbetween each slash can be interpreted in one of three ways
 - If a path part starts with a #, it is assumed to be a numeric variable. Non-numbers will not match this route
 - If a path part starts with a $, it is considered to be an alphanumeric variabe. All non-slash values will match this route.
 - If a path starts with anything but a # or a $, it is assumed to be a literal. Only that value will match this route.

e.g. /users/#userId will match /users/12345, not /users/abcde. If a request is made to /users/12345 the route's requestUrl object will include the key value pair of `args: { userId: 12345 }`

Any variables will be added to the route's request url object under the "args" object.

```JavaScript
    // This is a simple route with no URI variables
    router.addRoute('GET', '/posts', (url, body, headers) => {
        // url, body and headers are all identical to the values sent to functions in roads.use
    });

    // This route supports numeric variables
    router.addRoute('GET', '/posts/#postId', (url, body, headers) => {
        // url.args.postId will contain the integer from the URL.
        // e.g. GET /posts/12345 will have url.args.postId === 12345
    });

    // This route supports any variable
    router.addRoute('GET', '/posts/$postSlug', (url, body, headers) => {
        // url.args.postSlug will contain the value from the URL.
        // e.g. GET /posts/my-post will have url.args.postSlug === 'my-ost'
    });
```

TODO: More details on typescript request context. In the meanwhile check out example/ts/src/routes/applyPublicRoutes.ts for an example.

### addRouteFile(filePath: *string*)
Add an entire file worth of routes.

- The file should be a node module that exposes an object.
- Each key should be an HTTP path, each value should be an object.
- In that object, each key should be an HTTP method, and the value should be your route function.

Example File:
```JavaScript
{
    '/posts/#post_id': {
        'GET': (url, body, headers) => {

        }
    }
}
```

# Middleware helpers

The documentation below covers additional generic middleware that are useful when creating new middleware, or other advanced topics.

## Apply To Context
**Middleware to apply a predefined value to the request context**

```JavaScript
import { ApplyToContext } from 'roads';
road.use(ApplyToContext.build('example', 'test'));

road.use(function (method, url, body, headers) {
    console.log(this.example); // test
});
```

## Reroute
**Middleware that offers a function in the request context that allows you to easily interact with a road**

In the following example, road and APIRoad are two different Road objects.
```JavaScript
import { RerouteMiddleware } from 'roads';
road.use(RerouteMiddleware.build('api', APIRoad));

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

## Store Values
**Middleware that helps you save arbitrary data inside of a request context**

This middleware adds two functions, `setVal(key, val)` and `getVal(key)` for storing and retrieving arbitrary values.
The middleware also exposes a `TITLE_KEY` value for use with PJAX for assigning a page title.

```JavaScript
import { TITLE_KEY }, StoreValsMiddleware from 'roads/middleware/storeVals';

road.use(function (method, url, body, headers, next) {
    return next().then((response) => {
        console.log(this.getVal(TITLE_KEY));
    });
});

road.use(StoreValsMiddleware.middleware);
```


# PJAX(road: *Road*, containerElement: *DomElement*, window: *Window*)
**A helper object to easily enable PJAX on your website using roads**

PJAX is a technique for speeding up webpages by automatically replacing links or form submission with AJAX calls. This allows for clean, quick page refreshes via JavaScript, with a simple fallback if JavaScript is disabled.

PJAX looks at the href of any link with the `data-roads-pjax="link"` attribute and turns it from a link that navigates to a new page into a link that checks a Road object and renders the response into a container.

```HTML
<div id="container"></div>
```

```JavaScript
var road = ...; // Incomplete. See the getting started section for more information about creating a road
var pjax = new require('roads').PJAX(road, document.getElementById('container'), window);
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
var road = ...; // Incomplete. See the getting started section for more information about creating a road
var pjax = new require('roads').PJAX(road, document.getElementById('container'), window);
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
        {{your form elements}{}
        <input type="submit" value="Send message" data-roads-pjax="submit">
    </form>
```

## PJAX Page titles

There are a couple of steps required to get page titles working properly with PJAX.

First you must use the `storeVals` middleware to manage your page title. In the following example we are storing a page title of `"Homepage"`.

```JavaScript
this.setVal('page-title', 'Homepage');
```

Second you should have your server-side rendering put this value into the `<title>` element of your layout. Check the typescript example for how that could work with the Handlebars templating engine.

Third you need to create your `RoadsPJAX` object and configure it to look for your `page-title` value.


### PJAX Page Title Example
```JavaScript
import { Road, RoadsPJAX } from 'roads';

const road = ...; // Incomplete. See the getting started section for more information about creating a road

const pjax = new RoadsPJAX(road);
pjax.addTitleMiddleware('page-title');
pjax.register(window, document.getElementById('container'));
```


# Isomorphic PJAX tips

There's a very easy pattern to follow to ensure sharing client and server code works successfully via PJAX. You can see this pattern in more detail in the examples folder

1. Any route that is unsafe to be run in the browser should be kept in separate files from the rest.
2. Create two initalization scripts. One for starting the server, and one that will be compiled and loaded in the browser.
3. Compile the browser script to be run in the browser. Currently I recommend Browserify, and that's how the typescript example works.
4. Load the browser script on any server side page that should enable PJAX.

# FAQ

**Why is this called roads?**
The name Roads fit well with some of the earlier architectural decisions and some of the more advanced ways of using this feature. Over time those features have become less prominent but we kept the name.

Not good enough for you? Fine, I'll make an awkward backronym. How about Requests Organized And Dispatched Simply. Ugh.