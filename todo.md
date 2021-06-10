
-1.2 Ensure the docs are correct (I left off at SimpleRouter)
-1.3 Ensure the doc blocks match the readme
-1.4 Explain how the typescript context works
-1.5 Document the build script thoroughly since the docs tell you to look at that. (Also link to the right file!!)
-1.6 Add javascript examples for every typescript example
1. See if we should pull anything over from this bootstrap (https://www.matuzo.at/blog/html-boilerplate/) or this boilerplate (https://html5boilerplate.com/) or vitejs.com
2. Improve the client-build docs
3. Fix server.ts "as {type}" by testing peer dependencies in roads server
4. Improve test coverage (cors, simple router, probably much more)
5. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
6. Scan for todos and mark them in this file!
