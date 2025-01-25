1. Fix documentation
   1. Method is now part of the route function
   2. Ensure browserify is entirely gone from all examples
   3. Document the router request chain
   4. Document the new context typing

# Future
1. Figure out a way to have better typing on headers
2. Ensure we have JS and Typescript examples for everything.
3. Improve test coverage (cors, simple router, pjax, client request class, probably much more)
4. In pjax window.onpopstate (where we manage fake page navigation), if there's an existing navigation in progress, we should cancel it (and the http request) and then execute the following one.
5. reroute middleware probably can just use applyToContext
6. parseRequestBody should respect more of the content type parameter values, such as charset6. in client request, we accept host and port params. I think port would be better as part of the host... or we could accept either option
7.  It would be cool if the router could fork a route off of a query param