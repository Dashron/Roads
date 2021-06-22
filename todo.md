
-1. Have the package-lock automatically updated pre-commit
1. Ensure we have JS and Typescript examples for everything.
2. See if we should pull anything over from this bootstrap (https://www.matuzo.at/blog/html-boilerplate/) or this boilerplate (https://html5boilerplate.com/) or vitejs.com
3. Improve the client-build docs
4. Fix server.ts "as {type}" by testing peer dependencies in roads server
5. Improve test coverage (cors, simple router, probably much more)
6. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
7. Scan for todos and mark them in this file!
