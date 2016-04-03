"use strict";

var cookie = require('cookie');

/**
 * pjax.js
 * Copyright(c) 2016 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 */
module.exports = class RoadsPJax {
	constructor(road, container_element) {
		this._road = road;
		this._container_element = container_element;
	}

	/**
	 * [register description]
	 * @return {[type]} [description]
	 */
	register () {
		var _self = this;

		if (document.cookie) {
			this.cookies = cookie.parse(document.cookie);
		} else {
			this.cookies = {};
		}

		// Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
		window.onpopstate = function() {
			_self._handleRoute(window.location.pathname);
		};

		// Trigger the pjax on any click event for roads links
		this._container_element.addEventListener('click', _self._roadsLinkEvent.bind(_self));

		// initial state
		history.pushState({}, '');
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
	_roadsLinkEvent (event) {
		if (event.target.tagName === 'A' && event.target.dataset.roads === "link" && !event.ctrlKey) {
			var _self = this;

			event.preventDefault();
			_self._handleRoute(event.target.href, function (err, response) {
				if (err) {
					console.log('road err');
					console.log(err);
					return;
				}

				history.pushState({}, '', event.target.href);
				_self._container_element.innerHTML = response.body;
			});
		}
	}
};