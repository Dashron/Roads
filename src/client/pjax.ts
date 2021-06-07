/**
 * pjax.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a PJAX class to help with client side rendering
 */

import Road, { Middleware } from '../core/road';
import Response from '../core/response';
import { StoreValsContext, TITLE_KEY, storeValsMiddleware } from '../middleware/storeVals';

/**
  * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
  * by progressively turning standard HTML links into AJAX requests for portions of a web page.
  *
  * @todo Form support
  * @todo tests
  */
export default class RoadsPjax {
	protected _road: Road;
	protected _page_title?: string;
	protected _window: Window;
	protected _container_element: HTMLElement;

	/**
	 * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
	 *
	 * @param {Road} road - The road that will turn your pjax requests into HTML
	 * @param {HTMLElement} containerElement - The element that will be filled with your roads output
	 * @param {Window} window - The pages window object to help set page title and other items
	 */
	constructor(road: Road, containerElement: HTMLElement, window: Window) {
		this._road = road;
		this._page_title = undefined;
		this._window = window;
		this._container_element = containerElement;
	}

	/**
	 * Adds middleware to set the page title.
	 *
	 * This adds the storeVal middleware, and after the middleware chain is complete sets the TITLE_KEY to the title
	 *
	 * @returns {RoadsPjax} this, useful for chaining
	 */
	addTitleMiddleware (): RoadsPjax {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const pjaxObj = this;

		const titleMiddleware: Middleware<StoreValsContext> = function (method, url, body, headers, next) {

			return next().then((response) => {
				if (this.getVal) {
					pjaxObj._page_title = this.getVal(TITLE_KEY) as string;
				}

				return response;
			});
		};

		this._road.use(storeValsMiddleware);
		this._road.use(titleMiddleware);

		return this;
	}

	/**
	 * Hooks up the PJAX functionality to the information provided via the constructor.
	 */
	register (): void {
		// Handle navigation changes besides pushState. TODO: don' blow out existing onpopstate's
		// TODO: If a request is in process during the popstate, we should kill it and use the new url
		this._window.onpopstate = (event: PopStateEvent) => {
			if (event.state.pjax) {
				// if the popped state was generated  via pjax, execute the appropriate route
				this._road.request('GET', this._window.location.pathname)
					.then((response: Response) => {
						this.render(response);
						this._window.document.title = this._page_title ? this._page_title : '';
					})
					.catch((err: Error) => {
						console.log('road err');
						console.log(err);
					});
			} else {
				// reload the page if the popped state wasn't generated via an pjax call
				// eslint-disable-next-line no-self-assign
				this._window.location.pathname = this._window.location.pathname;
			}
		};

		// Trigger the pjax on any click event for roads links
		this._container_element.addEventListener('click', this._pjaxEventMonitor.bind(this));

		// initial state
		this._window.history.replaceState({
			page_title: this._window.document.title,
			pjax: false
		}, this._page_title ? this._page_title : '');
	}

	/**
	 *
	 * @param {HTMLAnchorElement} element
	 */
	registerAdditionalElement (element: HTMLAnchorElement): void {
		element.addEventListener('click', this._pjaxEventMonitor.bind(this));
	}

	/**
	 * The response from the roads request
	 *
	 * @param {Response} response_object
	 */
	render (response_object: Response): void {
		if (response_object.body !== undefined) {
			this._container_element.innerHTML = response_object.body;
		} else {
			this._container_element.innerHTML = '';
		}
	}

	/**
	 * Handles all click events, and directs
	 * @param {MouseEvent} event
	 */
	protected _pjaxEventMonitor (event: MouseEvent): void {
		if (event.target instanceof HTMLAnchorElement && event.target.dataset['roadsPjax'] === 'link' && !event.ctrlKey) {
			event.preventDefault();
			this._roadsLinkEvent(event.target as HTMLAnchorElement);
			// TODO: Change this to a on submit event?
		} else if ((event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement)
					&& event.target.dataset['roadsPjax'] === 'submit'
					&& event.target.form && event.target.form.dataset['roadsPjax'] === 'form') {

			event.preventDefault();
			this._roadsFormEvent(event.target.form);
		}
	}

	/**
	 * Follows the link and renders the UI
	 *
	 * @param  {HTMLAnchorElement} link
	 */
	protected _roadsLinkEvent (link: HTMLAnchorElement): void {

		this._road.request('GET', link.href)
			.then((response: Response) => {
				this._window.history.pushState({
					page_title: this._page_title,
					pjax: true
				}, this._page_title ? this._page_title : '', link.href);

				this.render(response);
				this._window.document.title = this._page_title ? this._page_title : '';
			})
			.catch((err: Error) => {
				console.log('road err');
				console.log(err);
				return;
			});
	}

	/**
	 * Submits the form and re-renders the UI
	 *
	 * @param {HTMLFormElement} form
	 */
	protected _roadsFormEvent (form: HTMLFormElement): void {
		// execute the form.
		//	note: while HTTP methods are case sensitive, HTML forms seem
		//		to lowercase their methods. To fix this we uppercase here as any is a workaround.
		//		see https://github.com/Microsoft/TypeScript/issues/30584
		this._road.request(form.method.toUpperCase(), form.action, new URLSearchParams(
			new FormData(form).toString()).toString(), {'content-type': 'application/x-www-form-urlencoded'}
		)
			.then((response: Response) => {
				if ([301, 302, 303, 307, 308].includes(response.status) && typeof response.headers?.location === 'string') {
					// todo: location can be an array via code, but I don't think it's vaild to the spec?
					return this._road.request('GET', response.headers.location);
				} else {
					return response;
				}
			})
			.then((response: Response) => {
				this.render(response);
				this._window.document.title = this._page_title ? this._page_title : '';
			})
			.catch((err: Error) => {
				console.log('roads err');
				console.log(err);
				return;
			});
	}
}