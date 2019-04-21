"use strict";
/**
 * pjax.js
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 * 
 * This file exposes a PJAX class to help with client side rendering
 */

 /**
  * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
  * by progressively turning standard HTML links into AJAX requests for portions of a web page.
  * 
  * @todo Form support
  * @todo tests
  */
module.exports = class RoadsPjax {
	/**
	 * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
	 * 
	 * @param {Road} road - The road that will turn your pjax requests into HTML
	 * @param {DomElement} container_element - The element that will be filled with your roads output
	 * @param {Window} window - The pages window object to help set page title and other items
	 */
	constructor(road, container_element, window) {
		this._road = road;
		this._page_title = null;
		this._window = window;
		this._container_element = container_element;
	}

	/**
	 * Adds middleware to the assigned road whcih will adds setTitle to the request context. This allows you to easily update the page title.
	 *
	 * @returns {RoadsPjax} this, useful for chaining
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
	 * Assigns the cookie middlware to the road to properly handle cookies
	 * 
	 * @param {Document} document - The pages document object to properly parse and set cookies
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
	 * Hooks up the PJAX functionality to the information provided via the constructor.
	 */
	register () {
		// Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
		// TODO: If a request is in process during the popstate, we should kill it and use the new url
		this._window.onpopstate = (event) => {
			if (event.state.pjax) {
				// if the popped state was generated  via pjax, execute the appropriate route
				this._road.request('GET', this._window.location.pathname)
				.then((response) => {
					this.render(response);
					this._window.document.title = this._page_title;
				})
				.catch((err) => {
					console.log('road err');
					console.log(err);
				});
			} else {
				// reload the page if the popped state wasn't generated via an pjax call
				this._window.location.pathname = this._window.location.pathname;
			}
		};

		// Trigger the pjax on any click event for roads links
		this._container_element.addEventListener('click', this._roadsLinkEvent.bind(this));

		// initial state
		this._window.history.replaceState({
			page_title: this._window.document.title, 
			pjax: false
		}, this._page_title);
	}

	/**
	 * The response from the roads request
	 * 
	 * @param {Response} response_object 
	 */
	render (response_object) {
		this._container_element.innerHTML = response_object.body;
	}

	/**
	 * Handles the link click event. If the link has the right data attribute we will execute and render the appropriate controller
	 * 
	 * @param  {Object} event             [description]
	 */
	_roadsLinkEvent (event) {
		if (event.target.tagName === 'A' && event.target.dataset['roadsPjax'] === "link" && !event.ctrlKey) {
			event.preventDefault();

			this._road.request('GET', event.target.href)
			.then((response) => {
				this._window.history.pushState({
					page_title: this._page_title, 
					pjax: true
				}, this._page_title, event.target.href);
				this.render(response);
				this._window.document.title = this._page_title;
			})
			.catch((err) => {
				console.log('road err');
				console.log(err);
				return;
			});
		}
	}
};