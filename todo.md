-1.1 Fix server.ts "as {type}" by testing peer dependencies in roads server
-1.2 Ensure the docs are correct
-1.2.1 Update the types on the function calls to match the typescript format
-1.2.2 Ensure the TOC and section headers all match the changes to index.ts
-1.2.3 Ensure that all the examples are accurate
-1.2.4 Ensure there aren't examples for any of the removed content
-1.3 Add docs on creating new middleware (and explain how the context type works)
-1.4 Add an example pointing users towards the typescript example for building for browser
1. See if we should pull anything over from this bootstrap (https://www.matuzo.at/blog/html-boilerplate/) or this boilerplate (https://html5boilerplate.com/) or vitejs.com
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
