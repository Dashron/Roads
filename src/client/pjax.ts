/**
 * pjax.ts
 * Copyright(c) 2025 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * PJAX is a technique for speeding up webpages by automatically replacing links or
 * form submission with AJAX calls. This allows for clean, quick page refreshes via
 * JavaScript, with a simple fallback if JavaScript is disabled.
 *
 * PJAX looks at the href of any link with the `data-roads-pjax="link"` attribute and
 * turns it from a link that navigates to a new page into a link that checks a Road
 * object and renders the response into a container.
 *
 * See the readme for examples and more documentation
 *
 */

import Road, { Context } from '../core/road';
import Response from '../core/response';
import { StoreValsContext, middleware as storeValsMiddleware} from '../middleware/storeVals';
import { Route } from '../core/router';

/**
  * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
  * by progressively turning standard HTML links into AJAX requests for portions of a web page.
  */
export default class RoadsPjax<PjaxContext extends Context & StoreValsContext> {
	protected _road: Road<PjaxContext>;
	protected _page_title?: string;
	protected _window: Window;
	protected _container_element: HTMLElement;

	/**
	 * Creates a new RoadsPjax instance. PJAX looks in the containerElement at each
	 * anchor tag with the  `data-roads-pjax="link"` attribute and changes it from a
	 * normal link into a link that uses the road.
	 *
	 * @param {Road} road - The road that will be used when clicking links
	 * @param {HTMLElement} containerElement - The element that will be filled with your roads output
	 * @param {Window} window - The page's window object to help set page title url
	 */
	constructor(road: Road<PjaxContext>, containerElement: HTMLElement, window: Window) {
		this._road = road;
		this._page_title = undefined;
		this._window = window;
		this._container_element = containerElement;
	}

	/**
	 * There are a couple of steps required to get page titles working properly with
	 * 	PJAX.
	 *
	 * First you must use the `storeVals` middleware to manage your page title. In
	 * 	the following example we are storing a page title of `"Homepage"`.
	 *
	 * Second you should have your server-side rendering put this value into the
	 * 	`<title>` element of your layout. Check the typescript example for how that
	 * 	could work with the Handlebars templating engine.
	 *
	 * Third you need to create your `RoadsPJAX` object and configure it to look for
	 *  your `page-title` value.
	 *
	 * @param {titleKey} string - The key of the title as stored in the "storeVals" middleware.
	 * @returns {RoadsPjax} Returns the PJAX object. This is provided to allow for easy function chaining.
	 */
	addTitleMiddleware (titleKey: string): RoadsPjax<PjaxContext> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const pjaxObj = this;

		const titleMiddleware: Route<StoreValsContext> = function (method, url, body, headers, next) {

			return next().then((response) => {
				if (this.getVal) {
					pjaxObj._page_title = this.getVal(titleKey) as string;
				}

				return response;
			});
		};

		this._road.beforeRoute(storeValsMiddleware);
		this._road.beforeRoute(titleMiddleware);

		return this;
	}

	/**
	 * This function call enables PJAX on the current page.
	 */
	register (): void {
		// Handle navigation changes besides pushState.
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
	 * If you would like PJAX to work on links that are not within the container
	 * 	you must call this function. Additionally this function must be called
	 * 	before `register`
	 *
	 * @param {HTMLAnchorElement} element
	 */
	registerAdditionalElement (element: HTMLAnchorElement): void {
		element.addEventListener('click', this._pjaxEventMonitor.bind(this));
	}

	/**
	 * Renders the response into the container
	 *
	 * @param {Response} response_object
	 */
	render (response_object: Response): void {
		if (response_object.body !== undefined) {
			// response.body will never be a buffer here, because it's on the client
			this._container_element.innerHTML = response_object.body as string;
		} else {
			this._container_element.innerHTML = '';
		}
	}

	/**
	 * Handles all click events, and directs
	 *
	 * @param {MouseEvent} event
	 */
	protected _pjaxEventMonitor (event: MouseEvent): void {
		if (event.target instanceof HTMLAnchorElement && event.target.dataset['roadsPjax'] === 'link' && !event.ctrlKey) {
			event.preventDefault();
			this._roadsLinkEvent(event.target as HTMLAnchorElement);
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