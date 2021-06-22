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
import Road from '../core/road';
import Response from '../core/response';
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
     * Creates a new RoadsPjax instance. PJAX looks in the containerElement at each
     * anchor tag with the  `data-roads-pjax="link"` attribute and changes it from a
     * normal link into a link that uses the road.
     *
     * @param {Road} road - The road that will be used when clicking links
     * @param {HTMLElement} containerElement - The element that will be filled with your roads output
     * @param {Window} window - The page's window object to help set page title url
     */
    constructor(road: Road, containerElement: HTMLElement, window: Window);
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
    addTitleMiddleware(titleKey: string): RoadsPjax;
    /**
     * This function call enables PJAX on the current page.
     */
    register(): void;
    /**
     * If you would like PJAX to work on links that are not within the container
     * 	you must call this function. Additionally this function must be called
     * 	before `register`
     *
     * @param {HTMLAnchorElement} element
     */
    registerAdditionalElement(element: HTMLAnchorElement): void;
    /**
     * Renders the response into the container
     *
     * @param {Response} response_object
     */
    render(response_object: Response): void;
    /**
     * Handles all click events, and directs
     *
     * @param {MouseEvent} event
     */
    protected _pjaxEventMonitor(event: MouseEvent): void;
    /**
     * Follows the link and renders the UI
     *
     * @param  {HTMLAnchorElement} link
     */
    protected _roadsLinkEvent(link: HTMLAnchorElement): void;
    /**
     * Submits the form and re-renders the UI
     *
     * @param {HTMLFormElement} form
     */
    protected _roadsFormEvent(form: HTMLFormElement): void;
}
