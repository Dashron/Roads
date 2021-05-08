-1. Continue experimenting with the ts example, and building and serving via typescript. If that doesn't work then try having no build in roads at all but make it clear that it can be compiled to client side just fine via the browser, check the examples, and fix the examples to have a browserify script
-1. Remove as many "as {type}" hacks as you can
1. Look into the bootstrap article you found for module etc.
2. Improve test coverage (cors, simple router, probably much more)
3. The current system doesn't properly handle bad http methods. If the route exists, but the method doesn't, we don't 405. If the method is something we know nothing about (e.g. "BanAnANanN"), it should 501
4. Scan for todos and mark them in this file!
