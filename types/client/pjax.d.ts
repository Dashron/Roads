/**
 * pjax.ts
 * Copyright(c) 2021 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file exposes a PJAX class to help with client side rendering
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
     * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
     *
     * @param {Road} road - The road that will turn your pjax requests into HTML
     * @param {HTMLElement} containerElement - The element that will be filled with your roads output
     * @param {Window} window - The pages window object to help set page title and other items
     */
    constructor(road: Road, containerElement: HTMLElement, window: Window);
    /**
     * Adds middleware to set the page title.
     *
     * This adds the storeVal middleware, and after the middleware chain is complete sets the page title to
     * 	the value of titleKey
     *
     * @param {titleKey} string - The key of the title as stored in the "storeVals" middleware.
     * @returns {RoadsPjax} Returns the PJAX object. This is provided to allow for easy function chaining.
     */
    addTitleMiddleware(titleKey: string): RoadsPjax;
    /**
     * Hooks up the PJAX functionality to the information provided via the constructor.
     */
    register(): void;
    /**
     *
     * @param {HTMLAnchorElement} element
     */
    registerAdditionalElement(element: HTMLAnchorElement): void;
    /**
     * The response from the roads request
     *
     * @param {Response} response_object
     */
    render(response_object: Response): void;
    /**
     * Handles all click events, and directs
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
