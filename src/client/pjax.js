"use strict";

var cookie = require('cookie');

/**
 * pjax.js
 * Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */
module.exports = class RoadsPjax {
	/**
	 * Creates a new RoadsPjax instance. You will still need to register the PJAX handler to your window if you 
	 * 
	 * @param  {[type]} road [description]
	 * @return {[type]}      [description]
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
	 * [register description]
	 * @param  {[type]} window            [description]
	 * @param  {[type]} history           [description]
	 * @param  {[type]} container_element [description]
	 * @return {[type]}                   [description]
	 */
	register (window, container_element) {
		var _self = this;

		if (window.document.cookie) {
			this.cookies = cookie.parse(window.document.cookie);
		} else {
			this.cookies = {};
		}

		// Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
		window.onpopstate = function(event) {
			_self._handleRoute(window.location.pathname, function (err, response) {
				if (err) {
					console.log('road err');
					console.log(err);
					return;
				}

				container_element.innerHTML = response.body;
				window.document.title = _self._page_title;
			});
		};

		// Trigger the pjax on any click event for roads links
		container_element.addEventListener('click', _self._roadsLinkEvent.bind(_self, window, container_element));

		// initial state
		window.history.pushState({page_title: window.document.title}, this._page_title);
	}

	/**
	 * Make a client side roads request and render it to the page
	 * @param  {[type]}   url      [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
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
	 * [_roadsLinkEvent description]
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
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

				window.history.pushState({page_title: _self._page_title}, _self._page_title, event.target.href);
				container_element.innerHTML = response.body;
				window.document.title = _self._page_title;
			});
		}
	}
};