const roads = require('roads');

class ResourceRouter {
	constructor (root_resources) {
		if (!Array.isArray(root_resources)) {
			root_resources = [root_resources];
		}

		// Ensure everything is valid
		for (let i = 0; i < root_resources.length; i++) {
			if (!(root_resources[i] instanceof roads.Resource)) {
				throw new Error('You must configure at least one root resource when constructing your Road');
			}
		}

		// Coroutine creation should happen here or in the resource
		this.root_resources = root_resources;
	}


	route (method, parsed_url, body, headers) {
		let resource = null;
		let found_methods = [];
		let first_resource = null;
		let route = null;

		for (let i = 0; i < this.root_resources.length; i++) {
			resource = this._locateResource(this.root_resources[i], parsed_url);

			if (resource) {
				// Keep track of the first matching resource. This is used for 405's so that we have a more useful request context.
				if (!first_resource) {
					first_resource = resource;
				}

				// Found resources keeps track of all of the resource hits so we can give accurate 405 error codes.
				found_methods = found_methods.concat(resource.getValidMethods());

				if (resource[method]) {
					route = resource[method];
					break;
				}
			}
		}

				// If we could not find any appropriate resources, 404 not found
		if (found_methods.length === 0) {
			route = () => {
				// we throw this so that it lines up with how all errors are handled
				throw new roads.HttpError(parsed_url.pathname, 404);
			};
		// If we found a resource, but could find the appropriate route, 405 Method not allowed
		} else if (!route) {
			route = () => {
				// todo: this gives a really bad error message when called directly
				// we throw this so that it lines up with how all errors are handled
				throw new roads.HttpError(found_methods, 405);
			};
			// Override the resource to use the first resource since there were valid resources, but none of them had the http method
			// we needed
			resource = first_resource;
		// We allow objects instead of functions for routes. If used, it will be added to each request context
		} else if (typeof(route) === 'object') {
			route = route.fn;
		}

		// If there isn't really a route, and you let the 
		if (typeof(route) !== 'function') {
			throw new Error('Route ' + request_method + ' ' + parsed_url.path + ' does not exist. Add it, or ensure the middleware doesn\'t reach it.');
		}


		this.http_methods = found_methods;


		if (resource) {
			context.resource_context = resource.context;

			if (typeof(resource[request_method]) === 'object') {
				context.method_context = resource[request_method];
			}
		}
	}


	/**
	 * Route the pathname directly to a resource object
	 * 
	 * @param  Object parsed_url
	 * @return Resource
	 */
	_locateResource (root_resource, parsed_url) {
		let pathname = parsed_url.pathname.replace(/\/$/, '');

		// this will cause issues
		let parts = pathname.split('/');

		// the uri starts with a forward slash, so we will have an empty string at the start of the array
		let part = parts.shift();

		let resource = root_resource;
		let resource_info = null;

		// Define the object that will hold all url arguments
		if (!parsed_url.args) {
			parsed_url.args = {};
		}

		// loop through every part separated by slashes and incrementally check them against the routes
		while (parts.length) {
			part = parts.shift();
			resource_info = resource.getResourceKey(part);

			if (!resource_info) {
				return null;
			} else {
				resource = resource_info.route;
				// apply the route parts to the url arguments field
				if (resource_info.key) {
					parsed_url.args[resource_info.key] = resource_info.value;
				}
			}
		}
		
		return resource;
	}
}