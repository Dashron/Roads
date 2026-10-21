/**
 * pjax.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
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

import Road, { Middleware } from '../core/road.js';
import Response from '../core/response.js';
import { StoreValsContext, middleware as storeValsMiddleware} from '../middleware/storeVals.js';

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];
const MAX_REDIRECTS = 5;

interface PjaxRequest {
	method: string,
	path: string,
	body?: string,
	headers?: Record<string, string>
}

/**
  * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
  * by progressively turning standard HTML links into AJAX requests for portions of a web page.
  */
export default class RoadsPjax {
	protected _road: Road;
	protected _page_title?: string;
	protected _window: Window;
	protected _container_element: HTMLElement;

	/**
	 * Incremented on every navigation, so responses from older navigations can be ignored
	 */
	protected _navigation = 0;

	/**
	 * Every listener added by this object, so `unregister` can remove them
	 */
	protected _listeners: Array<{ target: EventTarget, type: string, listener: EventListener }> = [];

	/**
	 * Creates a new RoadsPjax instance. PJAX looks in the containerElement at each
	 * anchor tag with the  `data-roads-pjax="link"` attribute and changes it from a
	 * normal link into a link that uses the road.
	 *
	 * @param {Road} road - The road that will be used when clicking links
	 * @param {HTMLElement} containerElement - The element that will be filled with your roads output
	 * @param {Window} window - The page's window object to help set page title url
	 */
	constructor(road: Road, containerElement: HTMLElement, window: Window) {
		this._road = road;
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
	addTitleMiddleware (titleKey: string): RoadsPjax {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const pjaxObj = this;

		const titleMiddleware: Middleware<StoreValsContext> = function (method, url, body, headers, next) {

			return next().then((response) => {
				if (this.getVal) {
					pjaxObj._page_title = this.getVal(titleKey) as string;
				}

				return response;
			});
		};

		this._road.use(storeValsMiddleware);
		this._road.use(titleMiddleware);

		return this;
	}

	/**
	 * This function call enables PJAX on the current page.
	 */
	register (): void {
		// Handle navigation changes besides pushState.
		this._listen(this._window, 'popstate', (event) => this._popstateEvent(event as PopStateEvent));

		// Trigger the pjax on any click or submit event for roads links and forms
		this._listenForNavigation(this._container_element);

		// initial state
		this._window.history.replaceState({
			page_title: this._window.document.title,
			pjax: false
		}, '');
	}

	/**
	 * Removes every listener added by `register` and `registerAdditionalElement`.
	 */
	unregister (): void {
		for (const { target, type, listener } of this._listeners) {
			target.removeEventListener(type, listener);
		}

		this._listeners = [];
	}

	/**
	 * If you would like PJAX to work on links or forms that are not within the container
	 * 	you must call this function.
	 *
	 * @param {HTMLElement} element
	 */
	registerAdditionalElement (element: HTMLElement): void {
		this._listenForNavigation(element);
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

	protected _listen (target: EventTarget, type: string, listener: EventListener): void {
		target.addEventListener(type, listener);
		this._listeners.push({ target, type, listener });
	}

	protected _listenForNavigation (element: HTMLElement): void {
		this._listen(element, 'click', (event) => this._pjaxEventMonitor(event as MouseEvent));
		this._listen(element, 'submit', (event) => this._pjaxSubmitMonitor(event as SubmitEvent));
	}

	/**
	 * Handles back and forward navigation
	 *
	 * @param {PopStateEvent} event
	 */
	protected _popstateEvent (event: PopStateEvent): void {
		if (event.state?.pjax) {
			// if the popped state was generated via pjax, execute the appropriate route
			const location = this._window.location;

			this._navigate({ method: 'GET', path: location.pathname + location.search + location.hash }, {
				push: false,
				fallbackTitle: event.state.page_title,
				fallback: () => this._window.location.reload()
			});
		} else {
			// reload the page if the popped state wasn't generated via an pjax call
			// eslint-disable-next-line no-self-assign
			this._window.location.pathname = this._window.location.pathname;
		}
	}

	/**
	 * Handles click events on PJAX links. Clicks the browser should handle itself, such as
	 * 	opening in a new tab, are left alone.
	 *
	 * @param {MouseEvent} event
	 */
	protected _pjaxEventMonitor (event: MouseEvent): void {
		if (event.defaultPrevented || event.button !== 0
			|| event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
			return;
		}

		if (!(event.target instanceof Element)) {
			return;
		}

		// The click may be on an element inside the link
		const link = event.target.closest('a[data-roads-pjax="link"]');

		if (!(link instanceof HTMLAnchorElement)) {
			return;
		}

		const target = link.getAttribute('target');

		if ((target && target !== '_self') || link.hasAttribute('download')
			|| link.origin !== this._window.location.origin) {
			return;
		}

		event.preventDefault();
		this._roadsLinkEvent(link);
	}

	/**
	 * Handles submit events on PJAX forms. Listening for submit, not click, means the browser has
	 * 	already run its validation, and forms submitted with the enter key are handled too.
	 *
	 * @param {SubmitEvent} event
	 */
	protected _pjaxSubmitMonitor (event: SubmitEvent): void {
		const form = event.target;

		if (event.defaultPrevented || !(form instanceof HTMLFormElement) || form.dataset['roadsPjax'] !== 'form') {
			return;
		}

		// A submit button must opt in. A form submitted without one (e.g. requestSubmit()) is handled
		const submitter = event.submitter;

		if (submitter && submitter.dataset['roadsPjax'] !== 'submit') {
			return;
		}

		const target = submitter?.getAttribute('formtarget') ?? form.getAttribute('target');
		const { method, url } = this._formTarget(form, submitter);

		if ((target && target !== '_self') || method === 'DIALOG' || url.origin !== this._window.location.origin) {
			return;
		}

		event.preventDefault();
		this._roadsFormEvent(form, submitter);
	}

	/**
	 * Follows the link and renders the UI
	 *
	 * @param  {HTMLAnchorElement} link
	 */
	protected _roadsLinkEvent (link: HTMLAnchorElement): Promise<void> {
		return this._navigate({ method: 'GET', path: link.pathname + link.search + link.hash }, {
			push: true,
			// preventDefault has already run, so send the browser to the link if the road fails
			fallback: () => { this._window.location.href = link.href; }
		});
	}

	/**
	 * Submits the form and re-renders the UI
	 *
	 * @param {HTMLFormElement} form
	 * @param {HTMLElement} [submitter] - The button that submitted the form
	 */
	protected _roadsFormEvent (form: HTMLFormElement, submitter?: HTMLElement | null): Promise<void> {
		const { method, url } = this._formTarget(form, submitter);

		// Typescript wants urlsearchparams to take a string, but if we .toString() formdata it doesn't come out in a
		// way url search params understands.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const params = new URLSearchParams(new FormData(form, submitter) as any);

		if (method === 'GET') {
			// Like the browser, GET forms replace the action's query string with the form fields
			url.search = params.toString();

			return this._navigate({ method, path: url.pathname + url.search + url.hash }, {
				push: true,
				fallback: () => { this._window.location.href = url.href; }
			});
		}

		// Other methods are not retried on failure, so a submission is never sent twice. The url only
		//	changes if the response redirects, since the result of a POST can't be reloaded with a GET.
		return this._navigate({
			method,
			path: url.pathname + url.search + url.hash,
			body: params.toString(),
			headers: {'content-type': 'application/x-www-form-urlencoded'}
		}, { push: 'redirect' });
	}

	/**
	 * Works out where a form submits to, taking the submit button's formmethod and formaction into account
	 *
	 * @param {HTMLFormElement} form
	 * @param {HTMLElement} [submitter]
	 */
	protected _formTarget (form: HTMLFormElement, submitter?: HTMLElement | null): { method: string, url: URL } {
		// note: while HTTP methods are case sensitive, HTML forms lowercase their methods, so we uppercase here
		const method = (submitter?.getAttribute('formmethod') || form.getAttribute('method') || 'GET').toUpperCase();
		const action = submitter?.getAttribute('formaction') ?? form.getAttribute('action') ?? '';

		return { method, url: new URL(action, this._window.location.href) };
	}

	/**
	 * Runs a request through the road, follows any redirects, renders the response and updates the url.
	 *
	 * @param request - The request to send through the road
	 * @param options.push - Whether to add a history entry: always, never, or only when the request redirected
	 * @param options.fallback - Called if the road fails. Without it the error is logged
	 * @param options.fallbackTitle - The page title to use if the road doesn't provide one
	 */
	protected _navigate (request: PjaxRequest, options: {
		push: boolean | 'redirect',
		fallback?: () => void,
		fallbackTitle?: string
	}): Promise<void> {
		const navigation = ++this._navigation;

		return this._requestFollowingRedirects(request)
			.then(({ response, path, redirected }) => {
				// A newer navigation started while this one was running
				if (navigation !== this._navigation) {
					return;
				}

				// The redirect left this site, so let the browser follow it
				if (!response) {
					this._window.location.href = path;
					return;
				}

				this.render(response);

				const title = this._page_title ?? options.fallbackTitle;

				if (title) {
					this._window.document.title = title;
				}

				if (options.push === true || (options.push === 'redirect' && redirected)) {
					this._window.history.pushState({
						page_title: this._window.document.title,
						pjax: true
					}, '', path);
				}
			})
			.catch((err: Error) => {
				if (navigation !== this._navigation) {
					return;
				}

				if (options.fallback) {
					options.fallback();
				} else {
					console.log('road err');
					console.log(err);
				}
			});
	}

	/**
	 * Sends a request through the road and follows same-origin redirects
	 *
	 * @param request - The request to send through the road
	 * @returns The final response and path. The response is null if a redirect points to another origin,
	 * 	and the path is then the absolute url to send the browser to.
	 */
	protected async _requestFollowingRedirects (request: PjaxRequest): Promise<{
		response: Response | null, path: string, redirected: boolean
	}> {
		let { method, path, body, headers } = request;
		let response = await this._road.request(method, path, body, headers);
		let redirects = 0;

		while (REDIRECT_STATUSES.includes(response.status) && typeof response.headers['location'] === 'string') {
			if (redirects === MAX_REDIRECTS) {
				throw new Error(`Too many redirects when requesting ${request.path}`);
			}

			redirects += 1;

			const nextUrl = new URL(response.headers['location'], new URL(path, this._window.location.href));

			if (nextUrl.origin !== this._window.location.origin) {
				return { response: null, path: nextUrl.href, redirected: true };
			}

			// 307 and 308 keep the method and body, every other redirect becomes a GET
			if (response.status !== 307 && response.status !== 308) {
				method = 'GET';
				body = undefined;
				headers = undefined;
			}

			path = nextUrl.pathname + nextUrl.search + nextUrl.hash;
			response = await this._road.request(method, path, body, headers);
		}

		return { response, path, redirected: redirects > 0 };
	}
}
