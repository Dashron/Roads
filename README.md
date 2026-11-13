# Roads.js - Write once, run everywhere

Roads is a web framework that lets your server and the browser share the same routes. The same code that handles requests on your Node.js server can power client-side navigation and be tested without any HTTP overhead.

```typescript
import { Road } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers) {
    return `Hello from ${path}!`;
});

// Call the road directly, with no server running
const response = await road.request('GET', '/users');
console.log(response.body); // Hello from /users!
```

A Node.js server and a browser can call the same road, so you only write your routes once. Code that runs in both places like this is often called isomorphic.

```typescript
// On a Node.js server, Express passes each incoming request to the road
app.use(expressConnector(road));

// In the browser, RoadsPJAX runs the road when someone clicks a link
const container = document.getElementById('container');

if (container) {
    new RoadsPJAX(road, container, window).register();
}
```

The [example/readme](example/readme) folder has a runnable version of this example. It holds the finished code from [Getting Started](#getting-started), written in TypeScript.

## What Roads gives you

- **Shared routes:** The same routes run on Node.js servers and in browsers, so you don't write them twice.
- **Any server:** A road only needs a method, a URL, a body and headers, so you can call it from Express, Node's `http` module or a serverless function.
- **Tests without a server:** Your tests call `road.request` directly, so they don't start a server or send anything over the network.
- **Async functions and TypeScript types:** Middleware and routes can be async functions, and Roads includes its TypeScript types.


## Quick Navigation

**Getting Started**
- [Install Roads](#install-roads) - Set up a project and create your first Road
- [Core concepts](#pass-the-request-along-with-next) - Middleware, `next()` and routes
- [Run on a server and in the browser](#serve-your-routes-with-express) - Express and PJAX

**API Reference**
- [Road](#road) and [RoadsResponse](#roadsresponse) - Method signatures and options
- [Router](#router) - Routes, path variables and the `url` object
- [Bundled Middleware](#bundled-middleware) - Cookies, CORS, body parsing, and more
- [expressConnector](#expressconnectorroad-road-options-object) - Serve a road with Express
- [RoadsPJAX](#roadspjaxroad-road-containerelement-htmlelement-window-window) - Links, forms and page titles in the browser

[![Node CI](https://github.com/Dashron/roads/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Dashron/roads/actions/workflows/nodejs.yml)

# Getting Started

By the end of this guide you'll have one piece of code that handles requests in three places: a plain Node.js script, an Express server, and the browser.

## Requirements

- Node.js 22.18 or later. This guide runs TypeScript files directly with `node`, which needs 22.18. If you compile with `tsc` first, any Node.js 22 works.

## Install Roads

If you don't have a project, use these commands to get started. 

```bash
mkdir my-road
cd my-road
npm init -y
npm pkg set type=module
npm install roads@beta
```

To add Roads to an existing project, run this command:

```bash
npm install roads@beta
```

## Create your first Road

A **Road** takes in requests and gives back responses. To produce a response, it runs functions that you give it, called **middleware**. The middleware in this example returns the same response for every request. [Add routes with the Router](#add-routes-with-the-router), later in this guide, shows how to respond differently to each path.

First, create a file named `hello.ts`. This code creates a road, adds one middleware to it, and sends it a request.

```typescript
// hello.ts
import { Road } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers) {
    return 'Hello, Roads!';
});

const response = await road.request('GET', '/hello');
console.log(response.status, response.body);
```

Next, run `node hello.ts`. You should see this output:

```
200 Hello, Roads!
```

Here's what happened. First, `road.use` added your function to the road's list of middleware. Next, `road.request` processed your request directly, without a server, and called your middleware with the request's method, path, body and headers. Finally, your middleware returned a string, so Roads turned it into a [RoadsResponse](#roadsresponse) with a status of 200.

Because `road.request` doesn't need a server, you can also use it for automated testing.

## Pass the request along with `next()`

A road can hold several middleware functions, which lets you keep separate tasks in separate functions. This next example adds a middleware before the middleware from the previous example, and it logs each request. All middleware functions receive a fifth parameter, `next`, which progresses the request chain to the next function.

```typescript
// hello.ts
import { Road } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

road.use(async function (method, path, body, headers) {
    return 'Hello, Roads!';
});

const response = await road.request('GET', '/hello');
console.log(response.status, response.body);
```

Run `node hello.ts` again, and you should see this output:

```
GET /hello
200 Hello, Roads!
```

The logging middleware ran first and printed the first line, because middleware run in the order you added them with `road.use`. This ordered list of middleware is called the **request chain**. The call to `next()` then ran the second middleware, and the response from the second middleware came back through `next()` to `road.request`.

What a middleware returns or throws decides whether the request continues to the next middleware:

- **To continue**, `return next()`. The next middleware runs, and `next()` gives you the response it produced. If there is no middleware left, `next()` gives you a 404 response.
- **To stop**, return a string or a [RoadsResponse](#roadsresponse) without calling `next`. The remaining middleware don't run, and the value you returned becomes the response.
- **If it throws an error**, the remaining middleware won't run, and the error can be caught by one of the previously assigned middleware.

If you write `next();` without the `return`, your middleware returns nothing, so the road has no response to give you. `road.request` then rejects with `The request chain resolved to undefined`. The [Middleware](#middleware) reference has an example that catches errors, and covers the rest of what middleware can do.

## Add routes with the Router

So far every URL gets the same response, but an application usually needs to run different code for each method and path. The **Router** does this. It is a middleware that holds a list of **routes**, and each route is a function that runs for one method and path.

Replace the second middleware with a router and two routes.

```typescript
// hello.ts
import { Road, RouterMiddleware } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

const router = new RouterMiddleware.Router(road);

router.addRoute('GET', '/hello', async function (method, url, body, headers, next) {
    return 'Hello, Roads!';
});

router.addRoute('GET', '/users/$name', async function (method, url, body, headers, next) {
    return `Hello, ${url.args?.name}!`;
});

for (const path of ['/hello?from=readme', '/users/dashron', '/nope']) {
    const response = await road.request('GET', path);
    console.log(response.status, response.body);
}
```

Run `node hello.ts` again, and you should see three responses:

```
GET /hello?from=readme
200 Hello, Roads!
GET /users/dashron
200 Hello, dashron!
GET /nope
404 Page not found
```

`new RouterMiddleware.Router(road)` created the router and added it to the road. A route receives the same parameters as a middleware, except that the second one is a `url` object instead of a path string. Here's how the router handled each request.

First, `/hello?from=readme` matched the `/hello` route, because the router ignores the query string. Next, `/users/dashron` matched the second route. The `$name` part of that route is a **path variable**, which matches any value in that part of the path, so the router put `dashron` in `url.args.name`. Routes without path variables have no `url.args`, so TypeScript asks you to write `url.args?.name`. The `?.` reads `name` only if `url.args` exists. Finally, no route matched `/nope`. The router called `next()`, no middleware was left, and the response was a 404.

Always make sure to add the router after your other middleware. These routes return without calling `next`, so the request stops there, and middleware added after the router doesn't run. The [Router](#router) reference covers the other kinds of path variable.

## Serve your routes with Express

So far, all of your code is in `hello.ts`. The server in this section and the browser code in the next section both need the logging middleware and the routes from `hello.ts`, so first copy them into a new file named `road.ts`. 

```typescript
// road.ts
import { Road, RouterMiddleware, attachCommonMiddleware } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

attachCommonMiddleware(road);

const router = new RouterMiddleware.Router(road);

router.addRoute('GET', '/hello', async function (method, url, body, headers, next) {
    return 'Hello, Roads!';
});

router.addRoute('GET', '/users/$name', async function (method, url, body, headers, next) {
    return `Hello, ${url.args?.name}!`;
});

export default road;
```

This file has two changes from `hello.ts`. First, `attachCommonMiddleware` adds four middleware that most sites want, such as one that reads form data. [Common Middleware Setup](#common-middleware-setup) lists them. Next, `export default road` lets other files import the road.

Roads doesn't include a web server, so install Express.

```bash
npm install express
```

Next, create `server.ts`. Express has its own middleware, which is separate from the middleware in your road. We offer [expressConnector](#expressconnectorroad-road-options-object) to create an Express middleware that passes every request to `road.request`.

```typescript
// server.ts
import express from 'express';
import { expressConnector } from 'roads';
import road from './road.ts';

const app = express();

app.use(expressConnector(road));

app.listen(3000);
console.log('Server running at http://localhost:3000/hello');
```

Run `node server.ts` and visit `http://localhost:3000/hello`. The page shows `Hello, Roads!`, and your terminal prints `GET /hello`. Your terminal may also print `GET /favicon.ico`, because browsers request that file on their own.

## Run the same routes in the browser

Right now, every page comes from the server. When someone clicks a link, the browser throws away the current page and asks the server for a whole new one. In this section, your routes run in the browser instead, and only the part of the page that changed is replaced. This technique is called **PJAX**, and Roads does it with the `RoadsPJAX` class.

This section has four steps:

1. Turn the response into a full HTML page.
2. Write the code that runs in the browser.
3. Bundle that code into one file.
4. Have Express send that file to the browser.

### Step 1: Turn the response into a full HTML page

Right now, `/hello` returns only the text `Hello, Roads!`. To use PJAX, the page needs three more things:

- **A container.** The container is a `div` with `id="container"` that holds the page's content. When someone clicks a link, `RoadsPJAX` replaces whatever is inside the container.
- **A link to click.** `RoadsPJAX` only handles links that have the `data-roads-pjax="link"` attribute. Other links still load a whole new page.
- **A script tag.** The script tag loads `/client.js`, which holds the code that runs in the browser. You'll write that code in step 2 and turn it into `client.js` in step 3.

Replace `road.ts` with this version.

```typescript
// road.ts
import { Road, RouterMiddleware, LayoutMiddleware, attachCommonMiddleware } from 'roads';

const road = new Road();

road.use(async function (method, path, body, headers, next) {
    console.log(`${method} ${path}`);
    return next();
});

attachCommonMiddleware(road);

// Wrap each response in a full page, but only on the server, because the browser already has the page
if (typeof window === 'undefined') {
    road.use(LayoutMiddleware.build(function (body) {
        return `<!doctype html><body><div id="container">${body}</div><script src="/client.js"></script></body>`;
    }));
}

const router = new RouterMiddleware.Router(road);

router.addRoute('GET', '/hello', async function (method, url, body, headers, next) {
    return '<h1>Hello, Roads!</h1><a href="/users/dashron" data-roads-pjax="link">Say hello to dashron</a>';
});

router.addRoute('GET', '/users/$name', async function (method, url, body, headers, next) {
    // CAREFUL: This isn't safe! This works for an example but you need to escape the name.
    return `Hello, ${url.args?.name}!`;
});

export default road;
```

Here's what changed. First, the [layout middleware](#layout) wraps each response in the parts that every page shares: the container and the script tag. Your routes now only return what goes inside the container. Next, the `/hello` route returns a heading and the link.

A path variable can contain `<`, `"` and other HTML characters, because the router decodes it. Returning it unescaped lets a link like `/users/%3Cscript%3E...` run a script on your page. Escape any value from the request before you put it in HTML.

Stop the server with Ctrl+C, run `node server.ts` again, and visit `http://localhost:3000/hello`. You should see the heading and the link. If you click the link now, the browser loads a whole new page, because the browser code doesn't exist yet.

### Step 2: Write the code that runs in the browser

Create `client.ts`. This file runs in the browser. It imports the same road as `server.ts`, so the browser has the same routes as the server.

```typescript
// client.ts
import { RoadsPJAX } from 'roads';
import road from './road.ts';

const container = document.getElementById('container');

if (!container) {
    throw new Error('The page has no element with id="container"');
}

const pjax = new RoadsPJAX(road, container, window);
pjax.register();
```

First, `document.getElementById` finds the container. It returns `null` if the page has no element with that id, so the `if` stops with a clear error instead. Next, `new RoadsPJAX` takes three things: your road, the container to put each response into, and the browser's `window`. Finally, `pjax.register()` starts watching for clicks on PJAX links inside the container.

### Step 3: Bundle the browser code

The browser can't load `client.ts` as it is, for two reasons. First, browsers don't run TypeScript. Second, `client.ts` imports `roads`, and Node knows to look for `roads` in your `node_modules` folder, but the browser doesn't. A **bundler** fixes both. It reads `client.ts`, follows every import, removes the types, and combines all of that code into one JavaScript file that the browser can load. This guide uses a bundler called esbuild.

Install esbuild, then run it.

```bash
npm install --save-dev esbuild
npx esbuild client.ts --bundle --outfile=public/client.js
```

esbuild creates `public/client.js`. Run the second command again whenever you change `client.ts` or `road.ts`, so the bundle has your latest code.

### Step 4: Send the bundle to the browser

The script tag asks the server for `/client.js`, but so far your server only answers with your road's routes. Express can also send files straight from a folder. In `server.ts`, add this line above the `expressConnector` line.

```typescript
app.use(express.static('public'));
```

Now Express checks the `public` folder first. If the requested file is there, as `client.js` is, Express sends it. Otherwise, the request goes on to your road.

### Try it

Stop the server with Ctrl+C, run `node server.ts` again, and visit `http://localhost:3000/hello`. Click the link. The page shows `Hello, dashron!` and the address bar changes to `/users/dashron`, but the page doesn't reload.

To check that the route ran in the browser, compare two places:

- **Your terminal** doesn't print `GET /users/dashron`, because the server never received that request.
- **The browser's console** prints `GET /users/dashron`, because your logging middleware ran in the browser.

If your terminal prints `GET /users/dashron`, the browser loaded a whole new page instead. Check two things:

- The link has the `data-roads-pjax="link"` attribute.
- `http://localhost:3000/client.js` shows JavaScript code. If it shows `Page not found`, make sure you ran the esbuild command, and that the `express.static` line is above the `expressConnector` line.

## Keep server-only code out of the browser

The bundle contains everything that `client.ts` imports, and everything those files import. `client.ts` imports `road.ts`, so every route in `road.ts` ends up in the browser, where anyone can read it. That's fine for the routes in this guide. A real project usually also has code that must stay on the server, such as code that reads a database or uses a password.

To keep that code on the server, put it in a file that only `server.ts` imports. Create `serverRoutes.ts`, which adds a second router to the same road.

```typescript
// serverRoutes.ts
import { Road, RouterMiddleware } from 'roads';

export default function addServerRoutes(road: Road) {
    const router = new RouterMiddleware.Router(road);

    router.addRoute('GET', '/secret', async function (method, url, body, headers, next) {
        return 'Only the server has this route.';
    });
}
```

Then, in `server.ts`, import the file and add the routes above the `app.use` lines.

```typescript
import addServerRoutes from './serverRoutes.ts';

addServerRoutes(road);
```

Restart the server and visit `http://localhost:3000/secret`. The page shows `Only the server has this route.`

The browser's road doesn't have these routes, so links to them must not have the `data-roads-pjax="link"` attribute. Without it, the browser asks the server for the page, as it normally would. The [example/ts](example/ts) folder shows a larger version of this setup.

## What's next?

You now have one road that answers requests in a script, on a server and in the browser, and you know how middleware and routes fit together. Next, choose what your project needs.

- Read the [Router](#router) reference to build out your routes, including numeric path variables and route files.
- Add [cookies, CORS and CSRF protection](#bundled-middleware) with the bundled middleware.
- See [roads-spa](https://github.com/Dashron/roads-spa) to build a single page application, or [roads-ssr](https://github.com/Dashron/roads-ssr) to use the islands pattern.

---

# API Reference

## Road

A Road is a container that holds an array of functions called the *request chain*. The *request chain* generally holds your routing logic and any pre or post processing instructions. You add to the *request chain* via the [use](#usefn-function) method, and execute the request chain with the [request](#requestmethod-string-url-string-body-string-headers-object) method.

### new Road()
**Create a Road.**

```typescript
import { Road } from 'roads';
const road = new Road();
```


### use(fn *Function*)
**Add a custom function that will be executed with every request.**

The use function can be called one or more times. Each time it is called, the function provided via the `fn` parameter will be added to the end of the *request chain* which is executed when you call `request`.

 | name | type                                                                                           | required | description                                                                                                                                                     |
 | ---- | ---------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 | fn   | Function(method: *string*, path: *string*, body: *string \| undefined*, headers: *object*, next: *function*) | yes      | This is the function that will be added to the end of the *request chain*. See the [Middleware](#middleware) below for more details on the function parameters. |

#### Middleware

Each function in the request chain is called middleware. Each middleware function must match the following function signature.

**function (method: *string*, path: *string*, body: *string*, headers: *object*, next: *next*): Promise<RoadsResponse | string>**

Parameters
| name    | type                         | description                                                                                      |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| method  | string                       | The request's HTTP method                                                                        |
| path    | string                       | The request's URL, exactly as it was passed to `road.request`. This includes any query string, so `/users?page=2` is not equal to `/users`. The [Router](#router) splits the URL into its parts for you. |
| body    | string \| undefined          | The request's body (as a string). If the ParseBodyMiddleware runs earlier in the request chain, this is the parsed JSON/form data instead. |
| headers | object                       | The request's headers. This is an object of strings or arrays of strings. It is an empty object if the request has no headers. |
| next    | function(overrides?: object): Promise<RoadsResponse \| string> | The next step of the *request chain*. If there are no more steps in the *request chain* this returns a 404. This method will always return a promise, which resolves to a `RoadsResponse` object, or a string. Pass `{ method: 'DELETE' }` or `{ body: newBody }` to change the method or body that the rest of the request chain receives. |

Each middleware function returns a [RoadsResponse](#roadsresponse) object or a string, or a promise that resolves to one. TypeScript requires the promise, so the TypeScript examples use `async function`. If you return a string it will be transformed into a response object using the default status code (200) and no headers. If the chain resolves to `undefined` or `null` (usually a middleware that forgot to `return next()`), `road.request` rejects with a `TypeError`.


```typescript
import { RoadsResponse } from 'roads';

// Example that sends a JSON response and doesn't continue through the request chain
road.use(async function (method, path, body, headers, next) {
    return JSON.stringify({
        method: method,
        path: path,
        body: body,
        headers: headers
    });
});

// Async example that sends a JSON response and doesn't continue through the request chain
road.use(async function (method, path, body, headers, next) {
    const db_record = await myPromiseReturningDBCall();

    return JSON.stringify(db_record);
});


// Example of middleware that redirects the user if their path has a trailing slash, otherwise it
//	continues through the request chain
road.use(async function (method, path, body, headers, next) {
    if (path != '/' && path[path.length - 1] === '/') {
        return new RoadsResponse('', 302, {
            location: path.substring(0, path.length - 1)
        });
    }

    return next();
});

// Example of middleware that catches errors and returns a 500 status code
road.use(async function (method, path, body, headers, next) {
    // Continue down the request chain, and only execute this middleware logic afterwards
    return next()
        // Catch any errors that are thrown by later middleware
        .catch ((err) => {
            console.error(err);
            // Wrap the errors in response objects.
            return new RoadsResponse('Unknown error', 500);
        });
});
```

#### Running code before and after `next()`

Middleware run in the order you add them with `use`. Within your middleware function you can add logic that happens before you continue down the request chain, and after the request chain has finished executing.

```typescript
road.use(async function (method, path, body, headers, next) {
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


#### Context
Each middleware function has access to a request context through `this`. This context will be different for each request, but identical for each middleware in a *request chain*.

**Note:** Do not use arrow functions if you want to interact with `this`. You will not have access to the context if you use arrow functions, and it may have unintended side effects.

```typescript
import { RoadsResponse } from 'roads';

road.use<{ extraInfo: string }>(async function (method, path, body, headers, next) {
    this.extraInfo = 'hello!';
    return next();
});

road.use<{ extraInfo: string }>(async function (method, path, body, headers) {
    return new RoadsResponse(this.extraInfo, 200);
});

road.request('GET', '/me').then((response) => {
    // This will log "hello!"
    console.log(response.body);
});
```

Middleware is encouraged to add variables to this context to simplify development. Make sure to namespace your variables to ensure there are no conflicts with other libraries.

eg:
```typescript
const road = new Road();
road.use<{ myProject_requireAuthentication: boolean }>(async function (method, path, body, headers, next) {
    this.myProject_requireAuthentication = true;
    return next();
});
```

You can also use the [StoreValsMiddleware](#store-values) to ensure you don't have conflicts with other middleware.

##### Typing your context
In TypeScript you can define your context type with a generic.

```typescript
road.use<{ hello: string }>(async function (method, path, body, headers, next) {
	console.log(this.hello);
	return next();
});
```

Many of the bundled middleware include their contexts, and you can merge them together with `&`.

```typescript
import { StoreValsMiddleware, CookieMiddleware } from 'roads';

road.use<StoreValsMiddleware.StoreValsContext & CookieMiddleware.CookieContext>(async function (method, path, body, headers, next) {
	console.log(this.getCookies());
	console.log(this.getAllVals());
	return next();
});
```

### request(method: *string*, url: *string*, body?: *string*, headers?: *object*)
**Run a request through the request chain.**

This function will execute the *request chain* in the order they were assigned via  [use](#usefn-function) and return a Promise that resolves to a [RoadsResponse](#roadsresponse)

The parameters are all the standard HTTP request parameters.

Header names are case-insensitive, so `request` lower-cases them before your middleware runs. Always look request headers up by their lower-case name (e.g. `headers['content-type']`). If you leave `headers` out, middleware receive an empty object.

Make sure to catch any errors in the promise!


```typescript
road.request('GET', '/users/dashron')
    .then((response) => {
        console.log(response);
    })
    .catch((error) => {
        // handle errors
    });
```

## RoadsResponse

The response object contains all of the information you want to send to the client. This includes the body, status code and all applicable headers.

### new RoadsResponse(body: *string | Buffer*, status?: *number*, headers?: *object*)
**Create a response object.**

| name    | type           | description                                                       |
| ------- | -------------- | ----------------------------------------------------------------- |
| body    | string \| Buffer | The body of the response.                                     |
| status  | number         | The HTTP Status code. Defaults to 200.                            |
| headers | object         | All the headers. The value may be a string or an array of strings |


```typescript
new RoadsResponse("Hello!", 200, {"last-modified": "Sun, 27 Apr 2014 00:00:00 GMT"});
```

### Body
**The response body, as a string or Buffer**

```typescript
console.log(response.body);
```

### Status
**The HTTP status returned by the request**

```typescript
console.log(response.status);
```

### Headers
**A JavaScript object of all response headers. The value might be a string or an array of strings**

```typescript
console.log(response.headers);
```

The response returned by `road.request` always has lower-case header names (e.g. `response.headers['set-cookie']`), no matter how your middleware wrote them. If two names only differ by case, such as `Set-Cookie` and `set-cookie`, they are merged into one header that holds an array of every value.

## Bundled Middleware

Roads includes middleware for common tasks, such as cookies, CORS and parsing request bodies.

### Common Middleware Setup

Roads includes an `attachCommonMiddleware` function that sets up frequently used middleware:

```typescript
import { Road, attachCommonMiddleware } from 'roads';

const road = new Road();

// Adds: RemoveTrailingSlash, StoreVals, ParseBody, and ModifiedSince middleware
attachCommonMiddleware(road);
```

### Cookies

The cookie middleware reads the cookies from each request, and adds any new cookies to the response.

#### serverMiddleware
A middleware function to attach to your road via `road.use`. It adds any new cookies to the response's `set-cookie` header, so it's most useful server side.

```typescript
import { Road, CookieMiddleware } from 'roads';

const road = new Road();

road.use(CookieMiddleware.serverMiddleware);

// Now you can read and write cookies in your routes
road.use<CookieMiddleware.CookieContext>(async function (method, path, body, headers) {
    // Read cookies
    const userToken = this.getCookies().auth;
    
    // Set a cookie
    this.setCookie('lastVisit', new Date().toISOString());
    
    return 'Cookie set!';
});
```

#### buildClientMiddleware(pageDocument: *Document*)
Creates a middleware function to attach to your road via `road.use`. This middleware adds new cookies to `document.cookie`, so it's most useful in the browser.

```typescript
import { CookieMiddleware, RoadsResponse, Road } from 'roads';

const road = new Road();
road.use(CookieMiddleware.buildClientMiddleware(document));
```

#### Cookie Context
The Cookie Context represents the request context when either the server or client middleware are used. This context includes two functions.

When you're using TypeScript you can pass this context to one of the middleware or route's generics to get proper typing on the request context.

##### setCookie(name: *string*, value?: *string | null*, options?: *object*)
Calling this function will store your new cookies. The parameters directly map to the [cookie](https://github.com/jshttp/cookie) module.

To remove a cookie, set the value to null. The cookie is sent back empty and already expired, and `getCookies` stops returning it. Browsers only remove it if the path and domain match the ones it was set with, so pass those in `options`.

These cookies will be automatically applied to the response after your request.

```typescript
import { CookieMiddleware, RoadsResponse, Road } from 'roads';

const road = new Road();
road.use(CookieMiddleware.serverMiddleware);

road.use<CookieMiddleware.CookieContext>(async function (method, path, body, headers, next) {
    console.log(this.getCookies());

    this.setCookie('auth', '12345', {
        domain: 'dashron.com'
    });

    // The cookie middleware will automatically apply the Set-Cookies header to this response
    return new RoadsResponse('Hello!', 200);
});
```


##### getCookies()
Returns an object with all the cookies. It defaults to all the request cookies, but merges anything applied via setCookie on top (i.e. setCookie will override the request cookie)

```typescript
import { CookieMiddleware, RoadsResponse, Road } from 'roads';

const road = new Road();
road.use(CookieMiddleware.serverMiddleware);

road.use<CookieMiddleware.CookieContext>(async function (method, path, body, headers, next) {
    console.log(this.getCookies());
    return next();
});
```

### CORS
**Middleware to apply the CORS headers**

This middleware sets up everything you need for your server to properly respond to CORS requests.

The options object supports the following properties.

| name                   | type                       | required | description                                                                                                                                              |
| ---------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| validOrigins           | array or `'*'`             | no       | An array of origin URLs that can send requests to this API, or the string `'*'` to allow every origin. Defaults to an empty array, which rejects every request that has an `Origin` header with a 403. |
| supportsCredentials    | boolean, array or function | no       | True if every valid origin can send cookies to this endpoint. An array of origin URLs, or a function `(origin) => boolean`, limits cookies to those origins. Defaults to false. |
| allowedResponseHeaders | array                      | no       | Response headers the browser can expose to the page, sent as `Access-Control-Expose-Headers`. Defaults to an empty array, and the header is not sent.    |
| allowedRequestHeaders  | array                      | no       | Request headers the browser can send, sent as `Access-Control-Allow-Headers` on preflight responses. Defaults to an empty array, which rejects any preflight request that asks for a header with a 403. |
| allowedMethods         | array                      | no       | HTTP methods the browser can send, sent as `Access-Control-Allow-Methods` on preflight responses. Defaults to an empty array, which rejects every preflight request with a 405. |
| cacheMaxAge            | number                     | no       | How long, in seconds, the browser can cache a preflight response. By default the header is not sent.                                                     |
| logger                 | object                     | no       | An object with a `log(key, data)` function, called for every CORS error. By default errors are not logged.                                               |
| returnCorsErrors       | boolean                    | no       | Defaults to true, which responds to a CORS error with a 400, 403 or 405 explaining the problem. When false, the request continues down the road without CORS headers |

```typescript
import { CorsMiddleware, Road } from 'roads';

const road = new Road();
road.use(CorsMiddleware.build({
    validOrigins: ['http://localhost:8080'],
    allowedRequestHeaders: ['content-type'],
    allowedMethods: ['GET', 'POST', 'DELETE']
}));
```

`validOrigins: '*'` sends the header `Access-Control-Allow-Origin: *`. `build` throws if `'*'` is combined with other origins or with `supportsCredentials: true`, because browsers will not share credentialed responses with every origin. It also throws if a `supportsCredentials` array contains `'*'`.

Successful preflight requests (an `OPTIONS` request with an `Access-Control-Request-Method` header) are answered with a 204 straight away, and don't continue down the road.

To allow every origin but only accept cookies from some of them, set `supportsCredentials` to an array or a function. Every response then names the request's origin and sends `Vary: Origin`, and only the origins you chose receive `Access-Control-Allow-Credentials: true`.

```typescript
road.use(CorsMiddleware.build({
    validOrigins: '*',
    supportsCredentials: ['https://app.example.com']
}));
```

`supportsCredentials` only decides who can send cookies. An origin still has to pass `validOrigins` first.

Responses to requests without an `Origin` header also get `Vary: Origin` (or `Access-Control-Allow-Origin: *` when every origin is allowed), so a cache never hands a non-CORS response to a CORS request.

### CSRF
**Middleware to protect against cross-site request forgery**

This middleware rejects every `POST`, `PUT`, `PATCH` and `DELETE` request with a 403 unless both of these are true:

- The request came from your own origin. Browsers report this in the `Sec-Fetch-Site` and `Origin` headers. Requests with neither header, such as non-browser clients, skip this check.
- The request body contains a `csrf_token` field that matches the CSRF cookie.

It must be added after the cookie middleware and the parse body middleware, and it only runs on the server. For roads that run in the browser, see [buildClientMiddleware](#buildclientmiddlewarepagedocument-document-cookiename-string).

Roads does not ship any signing logic, so you provide the `sign` and `verify` functions. This keeps your secret and your signing library on the server. The example below uses [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

```typescript
import { CookieMiddleware, CSRFMiddleware, ParseBodyMiddleware, Road } from 'roads';
import jwt from 'jsonwebtoken';

const road = new Road();
road.use(CookieMiddleware.serverMiddleware);
road.use(ParseBodyMiddleware.middleware);
road.use(CSRFMiddleware.build({
    sign: (payload) => jwt.sign(payload, process.env.CSRF_SECRET),
    verify: (token) => jwt.verify(token, process.env.CSRF_SECRET),
    // Optional. Ties each token to the logged in user
    getUserId: (context) => context.userID
}));
```

| name           | type                              | required | description                                                                                                   |
| -------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| sign           | function(payload: object): string | yes      | Turns the token data into a signed string.                                                                    |
| verify         | function(token: string): object   | yes      | Checks the signature and returns the token data. Throw, or return a non-object, if the token is invalid.      |
| cookieName     | string                            | no       | The name of the cookie that holds the token. Defaults to `__Host-csrf`, and must start with `__Host-`.        |
| insecureCookie | boolean                           | no       | Local development over plain http only. See below.                                                            |
| trustedOrigins | string[]                          | no       | Other origins that may send forms to this one, e.g. `['https://www.example.com']`. Also needed if a proxy changes the `Host` header. These requests still need a valid token. |
| expiresIn      | number                            | no       | How long a token is valid for, in seconds. Defaults to one day. Roads adds an `exp` field to the token data.  |
| getUserId      | function(context: object)         | no       | Returns the ID of the logged in user. A token created for one user (or while logged out) won't work for another. |

#### Safety checks

`CSRFMiddleware.build` throws an error straight away, before any request is handled, if it is set up in a way that would weaken the protection.

- **The cookie is locked to your host.** The cookie is set with `Secure`, `SameSite=Strict` and `Path=/`, and its name must start with `__Host-`. Browsers only accept that prefix on a cookie that belongs to one exact host, so another subdomain of your site can't replace it. This means your site must be served over https.
- **The signer is tested.** `verify` must accept a token made by `sign`, and must reject that token after one character is changed. This catches a `verify` that only decodes the token (such as `jwt.decode`), which would turn the protection off.
- **It can't be built in the browser.** If a `document` exists the build throws, because your signing secret must never be part of your client code.

For local development over plain http, set `insecureCookie: true`. This removes the `Secure` flag and the `__Host-` prefix. Never set it in production.

A few things can't be checked for you:

- Serve your site over https, and consider HSTS with `includeSubDomains`.
- Use `getUserId` if your site has logins.
- Never change data in a `GET` route. `GET` requests are not checked.

#### buildClientMiddleware(pageDocument: *Document*, cookieName?: *string*)

If your routes also run in the browser (for example with [PJAX](#roadspjaxroad-road-containerelement-htmlelement-window-window)), add this to the browser's road so routes that call `getCSRFFormElement` work there too. It reads the token from the cookie that the server set. It has no secret, and it does not check anything, because requests on a browser road never leave the page. Requests that reach your server are still checked there.

```typescript
import { CSRFMiddleware, Road } from 'roads';

const road = new Road();
road.use(CSRFMiddleware.buildClientMiddleware(document));
```

Only pass `cookieName` if you changed it on the server. If the server uses `insecureCookie`, pass `CSRFMiddleware.CSRF_INSECURE_COOKIE_NAME`.

#### CSRF Context

##### getCSRFFormElement(data?: *object*)
Returns a hidden `<input>` containing the token. Put this inside every form that isn't a `GET`. On the server, if the Store Values middleware is in use, the element is also stored under `csrfElement`.

```typescript
router.addRoute<CSRFMiddleware.CSRFContext>('GET', '/posts/new', async function () {
    return `<form method="POST" action="/posts">
        ${this.getCSRFFormElement()}
        <input type="text" name="title">
        <input type="submit" value="Save">
    </form>`;
});
```

##### getCSRFToken(data?: *object*)
Returns the token on its own, creating it and its cookie if the user doesn't have a usable one yet. `data` is added to the token only when a new one is created.

##### isValidCSRFToken()
Returns true if the request came from your own origin, and the request body's token matches the cookie, has a valid signature, has not expired and belongs to the current user. The middleware calls this for you on unsafe methods, and logs the reason for each failure with `console.error`. The browser version always returns true.

##### csrfProtected
Always `true` once this middleware has run. Other middleware can check this to require CSRF protection.

### Layout
**Middleware to wrap each HTML response in a layout, such as a full HTML page**

Most pages on a site share the same outer HTML: the doctype, the `<head>`, the scripts. The layout middleware keeps that HTML in one place. Each route returns only its own content, and every page stays consistent.

#### Add a layout to every page

`LayoutMiddleware.build` takes a function, called the **layout function**, and returns a middleware that you add to roads with `road.use`. The middleware calls the layout function with the HTML that the route returned.

Here's a road with one route and a layout.

```typescript
import { Road, RouterMiddleware, LayoutMiddleware } from 'roads';

const road = new Road();

road.use(LayoutMiddleware.build(function (body) {
    // This is the layout function.
    // We apply the layout wrapper here and return it up the request chain
    return `<!doctype html><html><body><div id="container">${body}</div></body></html>`;
}));

const router = new RouterMiddleware.Router(road);

router.addRoute('GET', '/', async function () {
    return '<h1>Home</h1>';
});
```

A request for `/` now returns this body:

```html
<!doctype html><html><body><div id="container"><h1>Home</h1></div></body></html>
```

The layout changes only the body. The status and headers stay as the route set them.

#### Add the layout before your router

The layout middleware wraps only what runs after it in the request chain. If you add it after the router, the layout middleware never runs, and the browser receives `<h1>Home</h1>` with no page around it.

#### Include variables in your layout

The layout above gives every page the same markup, but most sites need part of it to change on each page, such as the `<title>`. For that, the layout function receives a second argument: the request [context](#context). The context is the same object your routes use as `this`, so a route can save a value on it, and the layout function can read that value after the route returns.

This example adds [Store Values](#store-values), which gives the context `storeVal` and `getVal`.

```typescript
import { Road, RouterMiddleware, LayoutMiddleware, StoreValsMiddleware } from 'roads';

const road = new Road();
road.use(StoreValsMiddleware.middleware);

road.use(LayoutMiddleware.build<StoreValsMiddleware.StoreValsContext>(function (body, context) {
    const title = context.getVal('page-title') ?? 'My site';
    // Escape the title if it can contain anything from the request
    return `<!doctype html><html><head><title>${title}</title></head><body><div id="container">${body}</div></body></html>`;
}));

const router = new RouterMiddleware.Router<StoreValsMiddleware.StoreValsContext>(road);

router.addRoute('GET', '/', async function () {
    this.storeVal('page-title', 'Home');
    return '<h1>Home</h1>';
});
```

Three things changed from the first example. First, Store Values is added before the layout. Next, the layout function takes `context` and reads the title. Finally, the route saves the title with `this.storeVal`. The layout function runs after the route returns, so it can read that title and put it in the `<title>` tag.

#### Show errors inside the layout

Error responses get the layout like any other page. A route that returns a `RoadsResponse` with a `404` status gets the layout, and the response keeps its `404` status.

A thrown error is different. When a route throws, there's no response to wrap, so the error passes through the layout middleware. To show an error page inside the layout, pass a second function to `LayoutMiddleware.build`, called `onError`. `onError` receives the error and the request context, and returns what to send instead.

```typescript
road.use(LayoutMiddleware.build(
    function (body) {
        return `<!doctype html><html><body><div id="container">${body}</div></body></html>`;
    },
    function (error) {
        console.error(error);
        return '<h1>Something went wrong</h1>';
    }
));
```

When a route throws, the layout middleware passes the error to `onError`. The string that `onError` returns becomes the body of a `500` response, and the layout function wraps it like any other page. Roads doesn't log the error for you, so log it in `onError`.

To send a different status, return a `RoadsResponse` from `onError`. The layout uses the same rules for this response as for any other, so a JSON response skips the layout. If your road also serves JSON, have those routes save a value on the context, and check it in `onError`:

```typescript
function (error, context) {
    console.error(error);

    if (context.getVal('json')) {
        return new RoadsResponse('{"error":"Something went wrong"}', 500, { 'content-type': 'application/json' });
    }

    return '<h1>Something went wrong</h1>';
}
```

#### Send some responses without the layout

Some responses shouldn't be wrapped in an HTML layout. The layout middleware returns these responses as they are, without calling your layout function:

- Responses with a `3xx` status. This covers redirects, where the browser follows the `location` header and doesn't show the body, and `304 Not Modified`, which must not have a body.
- Responses with a `content-type` header other than `text/html`, such as `application/json`. A JSON response wrapped in HTML would no longer be valid JSON.

A response without a `content-type` header is treated as HTML, so a route that returns a plain string gets the layout.

To skip the layout for any other response, return `body` unchanged from your layout function. For example, a route can save a `no-layout` value, and the layout function can check for it:

```typescript
road.use(LayoutMiddleware.build<StoreValsMiddleware.StoreValsContext>(function (body, context) {
    if (context.getVal('no-layout')) {
        return body;
    }

    return `<!doctype html><html><body><div id="container">${body}</div></body></html>`;
}));
```

#### Use the layout only on the server

In the browser, [RoadsPJAX](#roadspjaxroad-road-containerelement-htmlelement-window-window) swaps each new page into the container that's already on screen. The server sent that page with the layout already around it, so the browser needs only what goes inside the container. If the browser's road added the layout too, every click would put a full copy of the page, layout and all, inside the container, nested over and over again.

Add the layout middleware only to the road that runs on your server. [Run the same routes in the browser](#run-the-same-routes-in-the-browser) shows how to do that.

| name    | type                                                                                                    | required | description |
| ------- | ------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| layout  | function(body: *string*, context: *object*): *string \| Promise<string>*                                 | yes      | The layout function. It receives the response body and the request context, and returns the new body. It can return a promise, so you can render the page with an async template engine. |
| onError | function(error: *unknown*, context: *object*): *string \| RoadsResponse \| Promise<string \| RoadsResponse>* | no       | Receives an error thrown by middleware added after the layout, and the request context. It returns the response to send instead. A string becomes the body of a `500` response. Without `onError`, errors pass through the layout middleware. |

### Method override
**Middleware to let HTML forms reach PUT, PATCH and DELETE routes**

HTML forms can only send `GET` and `POST`. With this middleware, a `POST` request can ask to be treated as a different method. Every middleware after it, including the router, receives the new method.

On `POST` requests it looks in these places, in order:

1. The `x-http-method-override` header
2. The `_method` field of the parsed request body
3. The `_method` query parameter

```html
<form method="POST" action="/posts/12345">
    <input type="hidden" name="_method" value="DELETE">
    <!-- this.getCSRFFormElement() goes here -->
    <input type="submit" value="Delete">
</form>
```

Because this lets a plain form reach routes that browsers would otherwise protect, every request rejects with an error unless the [CSRF middleware](#csrf) has been added to the road before it. There is no option to turn this off. The order must be: cookies, parse body, CSRF, method override, router.

On a road that runs in the browser, add `CSRFMiddleware.buildClientMiddleware(document)` in place of the server CSRF middleware.

```typescript
import { CookieMiddleware, CSRFMiddleware, MethodOverrideMiddleware, ParseBodyMiddleware, RouterMiddleware, Road } from 'roads';

const road = new Road();
road.use(CookieMiddleware.serverMiddleware);
road.use(ParseBodyMiddleware.middleware);
road.use(CSRFMiddleware.build({ /* see above */ }));
road.use(MethodOverrideMiddleware.build());

const router = new RouterMiddleware.Router(road);
```

| name        | type     | required | description                                                                                                  |
| ----------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| methods     | string[] | no       | The methods a `POST` is allowed to become. Defaults to `PUT`, `PATCH` and `DELETE`. Any other override gets a 400. |

### Parsing request bodies
**Middleware to parse the request body**

This middleware looks at the Content-Type header and uses that information to attempt to parse the incoming request body string. Every middleware and route that runs after it receives the parsed body as its `body` parameter, in place of the string.

- `application/json` bodies, and any `+json` type such as `application/vnd.api+json`, are parsed as JSON
- `application/x-www-form-urlencoded` bodies are parsed as form data. If a key is repeated, it holds an array of every value. The object has no prototype, so use `Object.hasOwn`.
- Anything else is passed along as the original string

If the `content-type` header is not a valid media type, or the body can't be parsed, the middleware responds with a 400 and the request does not continue down the road.

Middleware added before this one still receives the string.

```typescript
import { ParseBodyMiddleware, Road } from 'roads';

const road = new Road();
road.use(ParseBodyMiddleware.middleware);

road.use<ParseBodyMiddleware.ParseBodyContext, { name: string }>(async function (method, path, body, headers) {
    // body is {name: "dashron"}
    // this.rawBody is '{"name":"dashron"}'
    return 'Hello ' + body.name;
});

road.request('POST', '/users', '{"name":"dashron"}', {"content-type": "application/json"});
```

#### Typing the body

When using TypeScript, the `body` parameter is `unknown` by default. You can pass the structure you expect as the second generic of `road.use` or `router.addRoute`.

```typescript
import { ParseBodyMiddleware, Road } from 'roads';

const road = new Road();
road.use(ParseBodyMiddleware.middleware);

road.use<ParseBodyMiddleware.ParseBodyContext, {
    name: string,
    description?: string
}>(async function (method, path, body, headers) {
    // body.name will be properly identified by TypeScript. In this example, "dashron"
    return `Hello ${body.name}`;
});
```

Roads does not check that the request matches this structure, so validate anything you rely on.

#### Parse Body Context

`ParseBodyContext`
When using TypeScript you can pass this when adding middleware or routes to see proper typing on `this`.

This context adds one variable, `rawBody`, which is the request body string exactly as it was received. This is useful when you need the original text, such as when checking a webhook signature.

### Remove trailing slash
**Middleware to redirect URLs that end with a slash to the same URL without it**

Exposes a single middleware function to remove trailing slashes in HTTP requests. This is done by redirecting the end user to the same route without the trailing slash.

When used, any URL that ends with a trailing slash will immediately return a response object redirecting the client to the same URL without the trailing slash (308 redirect with Location: [url_without_slash]). A 308 keeps the method and body, so a POST to `/users/` is resent as a POST to `/users`.

```typescript
import { RemoveTrailingSlashMiddleware, RoadsResponse, Road } from 'roads';

const road = new Road();
road.use(RemoveTrailingSlashMiddleware.middleware);
```

### Router
The Router is a middleware that runs different code for each HTTP method and path.

For a walkthrough, see [Add routes with the Router](#add-routes-with-the-router).

Add the router after your other middleware. Nothing added to the chain after the router will run. If you want to run something after the router, add the middleware before the router and run the code after `await next()`.

If you need HTML forms to reach `PUT`, `PATCH` or `DELETE` routes, add the [method override middleware](#method-override) before the router.

#### new Router(road?: *Road*)
Creates a Router, and adds it to the end of the road's request chain.

```typescript
import { RouterMiddleware, Road } from 'roads';

const road = new Road();
const router = new RouterMiddleware.Router(road);
```

#### applyMiddleware(road: *Road*)
If you create the Router without a road, add it to one later with `applyMiddleware`. Until then, its routes don't run.

#### addRoute(method: *string*, path: *string | string[]*, fn: *function | function[]*)

This is where you want to write the majority of your webservice. The `fn` parameter should contain the actions you want to perform when a certain `path` and HTTP `method` are accessed via the `road` object. Pass an array of paths to attach the same `fn` to each of them.

**Note:** Do not use an arrow function if you want to interact with `this`. An arrow function does not have access to the request context.


Each part of the path between slashes is one of three types. Variables are added to `url.args`.
 - `#name` is a numeric variable. It only matches digits, and the value is converted to a number. `/users/#userId` matches `/users/12345` with `url.args.userId === 12345`, but not `/users/abcde`.
 - `$name` is a string variable. It matches any non-empty part. `/posts/$postSlug` matches `/posts/my-post` with `url.args.postSlug === 'my-post'`.
 - Anything else is a literal, and only matches that exact text. `/posts` only matches `/posts`.

If more than one route matches a request, the route you added first runs. If you add `/posts/$postSlug` before `/posts/#postId`, the `$postSlug` route handles `/posts/12345`, so add the more specific route first.

Variables are percent-decoded, so `/posts/my%20post` matches `/posts/$postSlug` with `url.args.postSlug === 'my post'`. Decoded values can contain any character, including `/`, `<`, line breaks and `../`, so check or escape them before putting them in HTML, a `Location` or other header, or a file path. Paths with invalid percent-encoding don't match any route.

The `url` object has these properties:

| name         | type            | description                                                                                                 |
| ------------ | --------------- | ----------------------------------------------------------------------------------------------------------- |
| pathname     | string          | The path, without the query string or hash. It is not percent-decoded.                                      |
| search       | string          | The query string including the leading `?`, or an empty string                                              |
| hash         | string          | The hash including the leading `#`, or an empty string                                                      |
| query        | object          | The decoded query string. If a key is repeated this holds the first value. The object has no prototype.     |
| searchParams | URLSearchParams | The query string, for reading every value of a repeated key (`url.searchParams.getAll('tag')`)              |
| args         | object          | The path variables, if the route has any                                                                    |

If a path matches but the method doesn't, and nothing later in the road handles the request, the router responds with `405 Method Not Allowed`.

If a path has a `GET` route but no `HEAD` route, `HEAD` requests run the `GET` route and drop the body. If your `GET` route has side effects, add a `HEAD` route.

```typescript
// This route has no URI variables
router.addRoute('GET', '/posts', async function (method, url, body, headers, next) {
    // url is a parsed URL object with pathname, query, etc.
    return 'All posts';
});

// This route supports numeric variables
router.addRoute('GET', '/posts/#postId', async function (method, url, body, headers, next) {
    // url.args.postId will contain the integer from the URL.
    // e.g. GET /posts/12345 will have url.args.postId === 12345
    return `Single Post`;
});

// This route supports any variable
router.addRoute('GET', '/posts/$postSlug', async function (method, url, body, headers, next) {
    // url.args.postSlug will contain the value from the URL.
    // e.g. GET /posts/my-post will have url.args.postSlug === 'my-post'
    return `Single Post`;
});
```

`addRoute` also supports the same context generics as `road.use`.

```typescript
router.addRoute<CookieMiddleware.CookieContext>('GET', '/posts/$postSlug', async function (method, url, body, headers, next) {
    console.log(this.getCookies());
    return `Single Post`;
});
```

#### Multiple Handlers Per Route

The Router supports passing multiple functions as an array for a single route, creating a request chain for that specific route:

```typescript
import { RoadsResponse } from 'roads';

// Multiple functions can be passed as an array for a single route
router.addRoute<{ isAuthenticated: () => boolean }>('GET', '/protected', [
    async function (method, url, body, headers, next) {
        // First middleware - authentication
        if (!this.isAuthenticated()) {
            return new RoadsResponse('Unauthorized', 401);
        }
        return next();
    },
    async function (method, url, body, headers, next) {
        // Second middleware - main logic
        return 'Authenticated user content';
    }
]);
```

If the last function in the array calls `next()`, the request continues down the road's request chain, just like a route with a single function. Any method or body overrides made inside the array are carried along.


#### addRouteFile(file: *string | URL | object*, prefix?: *string*)
Add an entire file worth of routes. Returns a promise that resolves once the routes are added.

| Parameter | Type                  | Description                                               |
| --------- | --------------------- | --------------------------------------------------------- |
| file      | string, URL or object | The routes module itself, a file URL, or an absolute path. Paths starting with `.` are rejected, because they would be resolved relative to roads instead of your code. Any other string is passed to `import()` as-is, so a bare name such as `routes.ts` is looked up as a package. |
| prefix    | string                | the URL path prefix that these routes will be attached to |

- The file should be a module whose default export is an object.
- Each key should be an HTTP path, each value should be an object.
- In that object, each key should be an HTTP method, and the value should be your route function.

Example File (`routes.ts`):
```typescript
import { RouterMiddleware } from 'roads';

const routes: RouterMiddleware.RouteFile = {
    '/posts/#post_id': {
        GET: async function (method, url, body, headers, next) {
            return `Post ${url.args?.post_id}`;
        }
    }
};

export default routes;
```

```typescript
import { RouterMiddleware, Road } from 'roads';
import routes from './routes.ts';

const road = new Road();
const router = new RouterMiddleware.Router(road);

// Load the file relative to this one
await router.addRouteFile(new URL('./routes.ts', import.meta.url), '/users');

// Or pass the module you already imported
await router.addRouteFile(routes, '/users');
```

### If-Modified-Since caching
**Middleware to manage caching via if-modified-since headers**

Browsers automatically support a conditional caching mechanism via the `if-modified-since` header. It works as follows.

1. When a browser loads a page the server has the option to send a `last-modified` header indicating the last time this page changed.
2. If the `last-modified` header exists, the browser stores the contents of the page alongside the value of `last-modified`.
3. The next time the browser loads that page it sends the `last-modified` time via the `if-modified-since` header.
4. The server then compares the provided `if-modified-since`  header to the time this page was last changed.
5. If the `if-modified-since` header is the same as, or newer than, the last time the page was changed, the server returns a `304` status code with no body. This tells the browser to load the same contents it loaded last time.
6. If the `if-modified-since` header is older than the last time the page was changed, the server returns the page as expected.

You can read more on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since).

This style of caching is most useful for static files such as your JavaScript or CSS files.

To use this middleware, add the following code.

```typescript
import { ModifiedSinceMiddleware, Road } from 'roads';

const road = new Road();
road.use(ModifiedSinceMiddleware.middleware);

```

To get it working in your route, add the `ModifiedSinceContext` and the following couple of lines to your middleware or route.

```typescript
import fs from 'node:fs';

road.use<ModifiedSinceMiddleware.ModifiedSinceContext>(async function (method, path, body, headers) {
    // The last time the page changed. For a file, that's the time the file was last modified
    const date = fs.statSync('public/client.js').mtime;

    if (this.shouldReturnNotModifiedResponse(date)) {
        return this.buildNotModifiedResponse();
    }

    // Continue with normal response
    return 'Your content here';
});
```

The middleware will automatically return a `last-modified` header equal to the `date` value passed to `shouldReturnNotModifiedResponse`. If the route returns a string, it is turned into a RoadsResponse so the header can be added. If `date` is not a valid date, no header is sent.

#### shouldReturnNotModifiedResponse(date: string | Date)
This function returns true if the date provided is less than or equal to the date in the `if-modified-since` header, indicating that a 304 Not Modified response should be returned. False otherwise.

Following [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#section-13.1.3), this function always returns false when:
- the request method is not `GET` or `HEAD`
- the request also has an `if-none-match` header
- the `if-modified-since` header, or `date`, is not a valid date

If `date` is a string, it should be a value that can be passed to the `Date(string)` constructor. See [If-Modified-Since caching](#if-modified-since-caching) for an example of how to use this function.

#### buildNotModifiedResponse()
This function returns a `304` RoadsResponse with no body. This is the proper response when the document has not been modified since the `if-modified-since` header. See [If-Modified-Since caching](#if-modified-since-caching) for an example of how to use this function.

## Middleware helpers

The documentation below covers additional generic middleware that are useful when creating new middleware, or other advanced topics.

### Apply To Context
**Middleware to apply a predefined value to the request context**

This middleware assigns a value to the context. It's useful for making a value available to each request, such as an api library.

Roads can't infer the type of this value, so create your own Context type for it.

```typescript
import { ApplyToContextMiddleware } from 'roads';
road.use(ApplyToContextMiddleware.build('example', 'test'));

road.use<{ example: 'test' }>(async function (method, path, body, headers) {
    return this.example; // test
});
```

### Reroute
**Middleware that adds a function to the request context, which sends requests to another road**

In the following example, road and APIRoad are two different Road objects.

```typescript
import { RerouteMiddleware, Road } from 'roads';
road.use(RerouteMiddleware.build('api', APIRoad));

road.use<{ api: Road['request'] }>(async function (method, path, body, headers) {
    const response = await this.api('GET', '/users');
    return response.body.toString();
});
```

### Store Values
**Middleware that helps you save arbitrary data inside of a request context**

This middleware adds three functions, `storeVal(key, val)`, `getVal(key)`, and `getAllVals()` for storing and retrieving arbitrary values.

```typescript
import { StoreValsMiddleware } from 'roads';
road.use(StoreValsMiddleware.middleware);

road.use<StoreValsMiddleware.StoreValsContext>(async function (method, path, body, headers, next) {
    this.storeVal('page-title', 'My Page');
    return next().then((response) => {
        console.log(this.getVal('page-title'));
        console.log(this.getAllVals());
        return response;
    });
});
```

#### storeVal(field: *string*, value: *unknown*)
Stores a value in the context that can be retrieved later in the request chain.

#### getVal(field: *string*)
Retrieves a previously stored value from the context.

#### getAllVals()
Retrieves all stored values as an object.


## expressConnector(road: *Road*, options?: *object*)
**Creates an Express middleware that sends each request through a road's request chain**

A road doesn't listen for HTTP requests on its own. It's a function that takes a method, a URL, a body and headers, and returns a response. To put your road on the web, something has to turn each incoming HTTP request into a call to `road.request`, then turn the result back into an HTTP response. `expressConnector` does that work for you, so you don't have to read request bodies, copy headers or handle errors yourself. Because it's ordinary Express middleware, you can also use it alongside other Express middleware, such as `express.static`, or add your road to an existing Express app.

```typescript
import express from 'express';
import { expressConnector, Road } from 'roads';

const road = new Road();
// Add your routes here...

const app = express();
app.use(expressConnector(road));
app.listen(3000);
```

| name          | type   | required | description                                                                                                  |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| road          | Road   | yes      | The road that handles each request                                                                           |
| options.limit | number | no       | The largest request body, in bytes. Defaults to 100kb, the same as Express's body parsers. A larger body is passed to Express as an error with a status of 413, so Express responds with a 413 |

When you mount the middleware on a path, Express removes that path from the url. With `app.use('/api', expressConnector(road))`, a request for `/api/posts` reaches the road as `/posts`.

## RoadsPJAX(road: *Road*, containerElement: *HTMLElement*, window: *Window*)
**A helper object to enable PJAX on your website using roads**

PJAX updates part of a page without a full page load. `RoadsPJAX` runs your road in the browser when someone clicks a link or submits a form, then puts the response in the container. If JavaScript is turned off, links and forms load a whole new page, as they normally would.

`RoadsPJAX` handles links inside `containerElement` that have the `data-roads-pjax="link"` attribute. Other links work normally.

| Name             | Type        | Description                                                     |
| ---------------- | ----------- | --------------------------------------------------------------- |
| road             | Road        | The road that will be used when clicking links                  |
| containerElement | HTMLElement | The element that will be filled with your roads output          |
| window           | Window      | The page's window object to help set the page title and URL |

```HTML
<div id="container"></div>
```

```typescript
import { RoadsPJAX, Road } from 'roads';
const road = new Road();
// Add your routes here...

const container = document.getElementById('container');

if (!container) {
    throw new Error('The page has no element with id="container"');
}

const pjax = new RoadsPJAX(road, container, window);
pjax.register();
```

### PJAX.register()

This function call enables PJAX on the current page.

```typescript
pjax.register();
```

### PJAX.unregister()

Removes every listener added by `register` and `registerAdditionalElement`, so links, forms and the back and forward buttons go back to normal browser behavior.

```typescript
pjax.unregister();
```

### PJAX.addTitleMiddleware(titleKey: *string*)

Adds the `storeVals` middleware and a title middleware to the end of the road, so call this before you add your routes. `titleKey` is the key your routes store the page title under. This returns the `RoadsPJAX` object. See [PJAX Page titles](#pjax-page-titles) for the full setup.

### PJAX.render(response: *RoadsResponse*)

Replaces the contents of the container with the response body. PJAX calls this for you after each navigation.

### PJAX.registerAdditionalElement(element: *HTMLElement*)

If you would like PJAX to work on links or forms that are not within the container, pass an element that holds them to this function. The links and forms still need their `data-roads-pjax` attributes. It can be called before or after `register`.

```HTML
<nav id="menu">
    <a href="/hello" data-roads-pjax="link">Home</a>
</nav>
<div id="container"></div>
```

```typescript
import { RoadsPJAX, Road } from 'roads';
const road = new Road();
// Add your routes here...

const container = document.getElementById('container');

if (!container) {
    throw new Error('The page has no element with id="container"');
}

const pjax = new RoadsPJAX(road, container, window);
const menu = document.getElementById('menu');

if (menu) {
    pjax.registerAdditionalElement(menu);
}

pjax.register();
```


### PJAX Link Format

If you would like a link to run via PJAX instead of a new page load, add the following data attribute to that link.

`data-roads-pjax="link"`

e.g.

`<a href="/home" data-roads-pjax="link">Home</a>`

Note: The link must be within the container for this to work. If you want links outside the container to work you should use [registerAdditionalElement](#pjaxregisteradditionalelementelement-htmlelement)

Clicks anywhere inside the link, such as on an icon or a `<span>`, are handled. The browser handles the click itself, without PJAX, when:
- Ctrl, Cmd, Shift or Alt is held, or a button other than the main one is used
- the link has a `target` other than `_self`, or a `download` attribute
- the link points to another origin

PJAX follows redirects returned by your road (up to five) and puts the final URL in the address bar. A redirect to another origin sends the browser there. If the road throws, the browser loads the link normally.

If links are clicked quickly, only the response for the most recent click is rendered.

### PJAX Form Format

If you would like a form to run via PJAX instead of a new page load, add the following data attributes to the relevant elements.

Form attributes
- `data-roads-pjax="form"`

Submit button attributes
- `data-roads-pjax="submit"`

PJAX listens for the form's `submit` event, so the browser's validation (`required` and so on) runs first, and pressing enter in a field works too. Submit buttons without `data-roads-pjax="submit"` submit the form normally. A form with a `target` other than `_self`, or that submits to another origin, is also left to the browser.

- The submit button's `name` and `value` are sent with the form, and its `formmethod` and `formaction` attributes are honored.
- `GET` forms send their fields as the query string and put the new URL in the address bar. If the road throws, the browser loads that URL normally.
- Other methods send the fields as an `application/x-www-form-urlencoded` body. Redirects are followed as with links, and the address bar only changes if the response redirects. If the road throws the error is logged and the form is not submitted again, so it is never sent twice.
- Road request bodies are strings, so forms with `enctype="multipart/form-data"` (or a submit button with `formenctype="multipart/form-data"`) are left to the browser. Use this for file uploads. File inputs in other forms send the file's name, as browsers do.

e.g.

```html
    <form method="POST" action="/users/12345" data-roads-pjax="form">
        <!-- your form elements go here -->
        <input type="submit" value="Send message" data-roads-pjax="submit">
    </form>
```

### PJAX Page titles

There are a couple of steps required to get page titles working properly with PJAX.

First create your `RoadsPJAX` object and call `addTitleMiddleware` with the key you will store your page title under. This adds the `storeVals` middleware and a title middleware, so call it **before** you add your routes.

Second, store the page title in your routes using `storeVal`. In the following example we are storing a page title of `"Homepage"`.

```typescript
this.storeVal('page-title', 'Homepage');
```

Third you should have your server-side rendering put this value into the `<title>` element of your layout. See [example/ts/src/middleware/addLayout.ts](example/ts/src/middleware/addLayout.ts) for one way to do that.

If a route doesn't store a page title, the current title is left alone.


#### PJAX Page Title Example
```typescript
import { Road, RoadsPJAX, StoreValsMiddleware } from 'roads';

const road = new Road();

// This must come before your routes. It also adds the StoreVals middleware
const container = document.getElementById('container');

if (!container) {
    throw new Error('The page has no element with id="container"');
}

const pjax = new RoadsPJAX(road, container, window);
pjax.addTitleMiddleware('page-title');

// Your routes here...
road.use<StoreValsMiddleware.StoreValsContext>(async function (method, path, body, headers) {
    this.storeVal('page-title', 'Homepage');
    return '<h1>Homepage</h1><p>Welcome!</p>';
});

pjax.register();
```


