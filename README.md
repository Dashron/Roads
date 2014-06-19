The Roads.js API Framework

This is an organizational framework for developing API's in node.js. It requires generator support, so you should be using node 0.11.13 or higher with the `--harmony` flag enabled.

At the moment, your best bet is to check out the example project.

server.js registers some representations to the api service, and then connects an http server to the api service.

the resources all tie to endpoints. You must start with a root resource, which connects to the rest of the sub resources via the routes object. Route keys can be a literal value (users), a string variable ($user_name) or a numeric variable (#user_id). Any variables are assigned to the args key of the url parameter provided to every route. Each resource contains a list of methods, which is a key value pairing of HTTP_METHOD : ROUTE_FUNCTION. The route function should be a generator, and `this` will be bound to the API object. You can reference this.representations to find specific representations

the representations should all be generator functions. They take one or more values, and return a json representation of those values. Some representations are required for the base API functionality. These are `server.unknown`,`server.notFound`,`server.notAllowed`,`server.options`.
todo: find a better way to keep track of representations.