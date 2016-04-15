"use strict";

var cookie = require('cookie');

/**
 * pjax.js
 * Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */
module.exports = class RoadsPjax {
	/**
	 * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
	 * 
	 * @param  {Road} road
	 */
	constructor(road) {
		this._road = road;
		this._page_title = null;
	}

	/**
	 * Adds middleware to the assigned road whcih will adds setTitle to the request context. This allows you to easily update the page title.
	 */
	addTitleMiddleware () {
		var _self = this;

		this._road.use(function (method, url, body, headers, next) {
			this.setTitle = function (title) {
				_self._page_title = title;
			};

			return next();
		});

		return this;
	}

	/**
	 * [addCookieMiddleware description]
	 */
	addCookieMiddleware (document) {
		var cookie = require('cookie');

		this._road.use(function (method, url, body, headers, next) {
			if (document.cookie) {
				this.cookies = cookie.parse(document.cookie);
			} else {
				this.cookies = {};
			}

			return next();
		});
	}

	/**
	 * Registers the PJAX workflow to the provided window and container element. The container element will receive the contents
	 * of the rendered HTML, and the window will be the source for all all history, redirection and dom interactions
	 * 
	 * @param  {Object} window
	 * @param  {DomElement} container_element
	 */
	register (window, container_element) {
		var _self = this;

		// Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
		window.onpopstate = function(event) {
			if (event.state.pjax) {
				// if the popped state was generated  via pjax, execute the appropriate route
				_self._handleRoute(window.location.pathname, function (err, response) {
					if (err) {
						console.log('road err');
						console.log(err);
						return;
					}

					container_element.innerHTML = response.body;
					window.document.title = _self._page_title;
				});
			} else {
				// reload the page if the popped state wasn't generated via an pjax call
				window.location.pathname = window.location.pathname;
			}
		};

		// Trigger the pjax on any click event for roads links
		container_element.addEventListener('click', _self._roadsLinkEvent.bind(_self, window, container_element));

		// initial state
		window.history.replaceState({page_title: window.document.title, pjax: false}, this._page_title);
	}

	/**
	 * Make a client side roads request and render it to the page
	 * @param  {string}   url
	 * @param  {Function} callback
	 * @return {Promise}
	 */
	_handleRoute (url, callback) {
		return this._road.request('GET', url)
			.then(function (response) {
				if (callback) {
					callback(null, response);
				}
			}, callback);
	}

	/**
	 * Handles the link click event. If the link has the right data attribute we will execute and render the appropriate controller
	 * 
	 * @param  {Object} window            [description]
	 * @param  {DomElement} container_element [description]
	 * @param  {Object} event             [description]
	 */
	_roadsLinkEvent (window, container_element, event) {
		if (event.target.tagName === 'A' && event.target.dataset.roads === "link" && !event.ctrlKey) {
			var _self = this;

			event.preventDefault();
			_self._handleRoute(event.target.href, function (err, response) {
				if (err) {
					console.log('road err');
					console.log(err);
					return;
				}

				window.history.pushState({page_title: _self._page_title, pjax: true}, _self._page_title, event.target.href);
				container_element.innerHTML = response.body;
				window.document.title = _self._page_title;
			});
		}
	}
};