# Changelog

## 9.0.0

9.0.0 requires Node 22.23.4 or later. Most apps need only a few changes. Work through the "Breaking changes" list below, then check the "Behaviour changes" list for anything your app relies on.

### Breaking changes

#### Router
- **The url passed to routes is no longer a `url-parse` object.** It has `pathname`, `search`, `hash`, `query`, `searchParams` and `args`. `url.query` still holds the decoded query string, but a repeated key now holds its first value; use `url.searchParams.getAll(key)` to read every value. `url.query` has no prototype, so use `Object.hasOwn`. Properties such as `url.href`, `url.host` and `url.protocol` are gone.
- **Path variables are percent-decoded.** `/users/a%20b` matches `/users/$name` with `url.args.name === 'a b'`, where it used to be `'a%20b'`. Decoded values can contain any character, including `/`, `<` and `"`, so escape them before putting them in HTML. Paths with invalid percent-encoding no longer match any route.
- **`#` variables only match digits, and `$` variables no longer match an empty segment.** URLs that used to match these routes now continue down the road.
- **A request whose path matches but whose method doesn't continues down the road.** Another router or middleware can now handle that method. If nothing does (the rest of the road responds with a 404), the router responds with a 405 and an `Allow` header. Previously the router always responded with a 405 straight away, without an `Allow` header. If your road ends with a catch-all that returns a 200, method mismatches now reach it.
- **`HEAD` requests are answered by the `GET` route** when there is no `HEAD` route, with the body removed, as RFC 9110 requires. Previously they got a 405.
- **The router no longer honours `_method` or `x-http-method-override`.** Add `MethodOverrideMiddleware` before the router. It requires `CSRFMiddleware`, because it lets plain HTML forms reach `PUT`, `PATCH` and `DELETE` routes.
- **`addRouteFile` takes a module, a file URL or an absolute path.** Paths starting with `.` are rejected, because they were resolved relative to roads instead of your code. Route files should `export default` their routes. Use `new URL('./routes.js', import.meta.url)`, or import the file yourself and pass the module.
- **Array routes:** when the last function of an array route calls `next()`, the request continues down the road (as single-function routes already did) instead of returning a 404.

#### Requests and responses
- **Header names are lower-cased** on the way into and out of `road.request()` (e.g. `set-cookie`, not `Set-Cookie`). Headers that only differ by case are merged. Nothing changes on the wire.
- **`road.request()` rejects with a `TypeError` if the request chain resolves to `undefined` or `null`.** This is usually a middleware that forgot to `return next()`. Previously the response was a 200 with an `undefined` body.
- **Middleware receive an empty object** instead of `undefined` when `road.request()` is called without headers. The `headers` parameter of `Middleware` is now typed as `IncomingHeaders` instead of `IncomingHeaders | undefined`, so a middleware called directly (such as in a test) needs to be passed `{}`.
- **Middleware and routes must return a Promise.** The `Middleware` and `Route` types no longer allow returning a `Response` or string directly. Make the function `async`, or wrap the value in `Promise.resolve()`. Roads still resolves plain return values at runtime, so this only affects type checking.

#### Middleware
- **Parse body:** the middleware passes the parsed body on with `next({ body })`, so every middleware and route after it receives the parsed body as its `body` parameter (middleware before it still receive the string). `this.body` is gone. `this.rawBody` keeps the original string, for things like checking a webhook signature. Form bodies with a repeated key now hold an array of every value.
- **CORS:**
  - `validOrigins: '*'` sends a literal `Access-Control-Allow-Origin: *`.
  - `build` throws if `'*'` is combined with other origins or with `supportsCredentials: true`, or if a `supportsCredentials` array contains `'*'`. `supportsCredentials` also accepts a list of origins, or a function, to choose which origins can send credentials.
  - Successful preflights respond with a 204 instead of a 200.
- **Trailing slash:** `RemoveTrailingSlashMiddleware` redirects with a 308 instead of a 302, so clients resend POSTs and other requests with their method and body instead of switching to a GET.
- **Store values:** the object returned by `getAllVals()` has no prototype, so use `Object.hasOwn` instead of `vals.hasOwnProperty`.
- **Cookies:** `setCookie(name, null)` removes the cookie: it sends an empty, expired cookie, and `getCookies` stops returning it. It used to set an empty value.

#### Client
- **The `Request` HTTP client is removed.** Use `fetch` directly.
- **PJAX:**
  - GET forms send their fields as the query string instead of a body.
  - Forms are handled on the `submit` event instead of the submit button's `click`, so browser validation runs first and the submit button's name and value are sent.
  - `register` uses `addEventListener` instead of assigning `window.onpopstate`.
  - `multipart/form-data` forms are left to the browser to submit normally.

### Behaviour changes

- **CORS:**
  - Preflights send `Vary: Access-Control-Request-Method, Access-Control-Request-Headers`.
  - `cacheMaxAge: 0` sends `Access-Control-Max-Age: 0` instead of nothing.
  - Responses to requests without an `Origin` header, and responses to rejected origins, send `Vary: Origin` (or `Access-Control-Allow-Origin: *` in wildcard mode). This stops a cache from reusing them for a CORS request.
  - CORS error responses send `Vary: Origin` (or `Access-Control-Allow-Origin: *` in wildcard mode).
- **Parse body:** `+json` media types (e.g. `application/vnd.api+json`) are parsed as JSON. Malformed bodies are no longer logged with `console.error`.
- **Modified since:** `shouldReturnNotModifiedResponse` returns false for methods other than GET and HEAD, and when the request has an `If-None-Match` header. String responses are turned into a `Response`, so they get the `last-modified` header too.
- **Cookies:** `setCookie` can be destructured from the context.
- **PJAX:**
  - Ctrl, Cmd, Shift and Alt clicks, middle clicks, `target="_blank"`, `download` and cross-origin links are left to the browser.
  - Link clicks follow redirects, and a failed road request falls back to a normal page load.
  - The page title is no longer blanked when a route doesn't set one, and a response from an older navigation can no longer set the title of a newer one.
  - File inputs in urlencoded forms send the file's name, as browsers do, instead of `[object File]`.

### New

- `MethodOverrideMiddleware` and `CSRFMiddleware`.
- `next()` accepts `{ method, body }` to change the method or body that the rest of the chain receives.
- The `NextOverrides` and `ParsedURL` types are exported.
- `RoadsPJAX.unregister()`. `registerAdditionalElement` accepts any `HTMLElement`, handles forms as well as links, and can be called after `register`.
- `RoadResponse` is exported as an alias of `Response`, for files that also use the fetch API's `Response`.
- The package includes its TypeScript sources, so "go to definition" opens the source instead of a declaration file.

### Security

- `RemoveTrailingSlashMiddleware` (part of `attachCommonMiddleware`) could redirect a request for a path such as `//evil.com/` to another site. Redirects now always stay on the same host.

### Dependencies

- Removed `url-parse`, `@types/url-parse` and `fast-querystring`. URLs and form bodies are parsed with the built-in `URL` and `URLSearchParams`.
