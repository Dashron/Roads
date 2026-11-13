# Future
1. In pjax window.onpopstate (where we manage fake page navigation), if there's an existing navigation in progress, we should cancel it (and the http request) and then execute the following one.
2. reroute middleware probably can just use applyToContext
3. parseRequestBody should respect more of the content type parameter values, such as charset
4. in client request, we accept host and port params. I think port would be better as part of the host... or we could accept either option
5. It would be cool if the router could fork a route off of a query param