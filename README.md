"For people who have places to be, and things to do"

This framework has been designed to make the development of websites and resource oriented web services easier.

Provided is an example project. It is a basic blog system. To learn more about the system, read the documentation below and explore the contents of the resources directory.

The example uses mysql as a db backend, and I have provided a model system for it. You do not have to use mysql, or my models. The core framework does not depend on either.


# Resource

## Definition

### construct
Function, no parameters.

Called after all of the standard initalization code is run, allows for startup operations.
This is the best place to add additional view renderers, or perform resource specific startup steps.

### onRequest
Function, passed four parameters. uri_bundle, view, route, route_resource.
	
This will be called in place of any route function. Here you can create standard templates, or alter how routes are handled. 

If the route's resource has an onRequest function it will run that.
If the route's resource does not have an onRequest function, and the root resource has an onRequest function, that will be run.
If no onRequest function was located earlier, the route will be called directly.

A route is normally handled as route.call(route_resource, uri_bundle, view);
The route is not called for you if onRequest is provided, you must call it on your own.

### router
Object, a router
	
Used to handle any resource.request() calls. See the router definition for more info.
	
Resource expects the router to have two functions, getRoute(uri_bundle) and getDefaultRoute(uri_bundle). If uri_bundle.public = false, the request was internal and not from the server. The current router looks at a wider pool of routes if the request was internal.

### dependencies
Array of resources
	
Directly added to the resource in the "resources" property.
Any routes which are not found in the root resource will be attempted within these resources too.

### properties
Object name:value pairing.

Becomes directly assigned to the resource. 
	
	properties : models {
		'user' : new UserModule()
	}

becomes

	resource.models = {
		'user' : new UserModule()
	}


### config
Object

assigned directly to the resource as resource.config.


# Route

## match

## GET/POST/PUT/PATCH/DELETE

## options

### modes

### keys

The general concept is to create a new folder in the resources directory, one for each conceptual chunk of content (a user resource, a blog post resource, a comment resource)
Each resource contains a set of routes and a set of models.

You should then make one master resource, (I name it after the site I'm working on) which is configured to depend on all the other resources you need.
Routing requests through the master resource will automatically check all child resources if the master fails.
Private routes are only checked when a request is made internally. 

todo: 
Documentation
Website
Front End Framework
See Issues for more
