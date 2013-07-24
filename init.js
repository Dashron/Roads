"use strict";
var mode = 'dev';

var Models = require('roads-models');
require('./libs/roadsmodelpromise.js').mixin(Models.ModelRequest.prototype);

var Config = require('./base/config');
var http_server = require('roads-httpserver');
var Project = require('./base/project');
var bifocals_module = require('bifocals');

/**
 * [ description]
 * @return {[type]} [description]
 */
module.exports.bifocals = function () {
      var file_renderer = require('./libs/renderers/file_renderer');
      // move into a config somehow
      bifocals_module.addRenderer('text/css', file_renderer.get('text/css'));
      bifocals_module.addRenderer('text/javascript', file_renderer.get('text/javascript'));
      bifocals_module.addRenderer('text/html', require('./libs/renderers/handlebars_renderer'));
};

/**
 * [ description]
 * @return {[type]} [description]
 */
module.exports.config = function () {
      Config.load('server', require('./config/' + mode + '/server.json'));
      Config.load('web', require('./config/' + mode + '/web.json'));
};

/**
 * [ description]
 * @param  {[type]} onReady [description]
 * @return {[type]}         [description]
 */
module.exports.db = function (onReady) {
      return Models.Connection.connect(Config.get('server.connections'))
            .error(function (err) {
                        //TODO: can we put this into the models and config somehow?
                  console.log(err);
                  console.log(Config.get('server.connections'));
                  console.log('create database roads;');
                  console.log('create user roads;');
                  console.log("grant all on roads.* to roads@'localhost';");
                  console.log("create table user (id int(10) unsigned not null primary key auto_increment, email varchar(256) not null, name varchar(128), password varchar (64) not null)");
                  throw new Error('An error has occured when connecting to the database');
            });
};

/**
 * [assignRoute description]
 * @param  {[type]} route    [description]
 * @param  {[type]} project [description]
 * @param  {[type]} server   [description]
 * @return {[type]}          [description]
 */
function assignRoute(route, project, server) {
      console.log('assigning route ' + route);
      server.onRequest(route, function (request, view, next) {
            project.route(request, view, next);
      });
}

/**
 * [ description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
module.exports.webserver = function (fn) {
      console.log('setting up web server');

      var server = new http_server.Server({
            hostname : Config.get('server.hostname'),
            port : Config.get('server.port')          
      });

      server.onRequest('*', function (request, response, next) {
            var view = new bifocals_module.Bifocals(response);
            view.default500Template = Project.get(Config.get('web.projects./')).dir + '/templates/' + Config.get('web.templates.500');

            view.error(view.statusError.bind(view));
            view.dir = __dirname + '/projects';

            //view.error(view.statusError.bind(view));
            console.log(request.method + ' ' + request.url.path);

            // maybe move this into server
            if (Config.get('web.cookie.domain')) {
                  request.cookie.setDomain(Config.get('web.cookie.domain'));
            }

            // we don't want the url to ever end with a slash
            if (request.url.path !== '/' && request.url.path.charAt(request.url.path.length - 1) === '/') {
                  return view.statusRedirect(request.url.path.slice(0, -1), 301);
            }

            // TODO: move to http server
            if (request.method !== "GET" && typeof request.POST === "object" && typeof request.POST._method === "string") {
                  request.method = request.url.query._method;
                  delete request.url._method;
            }
            
            next(request, view);
      });

      var projects = Config.get('web.projects');

      for (var key in projects) {
            assignRoute(key, Project.get(projects[key]), server);
      }

      return server;
};