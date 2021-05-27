-1. Fix server.ts "as {type}" by testing peer dependencies in roads server
-1. Ensure the docs are correct
1. See if we should pull anything over from this bootstrap (https://www.matuzo.at/blog/html-boilerplate/) or this boilerplate (https://html5boilerplate.com/)
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
