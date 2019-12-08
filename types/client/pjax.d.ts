import Road from '../road';
import Response from '../response';
/**
 * This is a helper class to make PJAX easier. PJAX is a clean way of improving the performance of webpages
 * by progressively turning standard HTML links into AJAX requests for portions of a web page.
 *
 * @todo Form support
 * @todo tests
 */
export declare class RoadsPjax {
    _road: Road;
    _page_title: string | null;
    _window: Window;
    _container_element: HTMLElement;
    /**
     * Creates a new RoadsPjax instance. The road provided to this constructor will be the backbone of your PJAX requests.
     *
     * @param {Road} road - The road that will turn your pjax requests into HTML
     * @param {HTMLElement} container_element - The element that will be filled with your roads output
     * @param {Window} window - The pages window object to help set page title and other items
     */
    constructor(road: Road, container_element: HTMLElement, window: Window);
    /**
     * Adds middleware to the assigned road whcih will adds setTitle to the PJAX object (as opposed to the request object like the setTitle middlweare does).
     * This allows you to easily update the page title.
     *
     * @returns {RoadsPjax} this, useful for chaining
     */
    addTitleMiddleware(): this;
    /**
     * Assigns the cookie middlware to the road to properly handle cookies
     *
     * @param {Document} document - The pages document object to properly parse and set cookies
     */
    addCookieMiddleware(document: Document): void;
    /**
     * Hooks up the PJAX functionality to the information provided via the constructor.
     */
    register(): void;
    registerAdditionalElement(element: HTMLAnchorElement): void;
    /**
     * The response from the roads request
     *
     * @param {Response} response_object
     */
    render(response_object: Response): void;
    /**
     * Handles all click events, and directs
     * @param {Object} event
     */
    _pjaxEventMonitor(event: MouseEvent): void;
    /**
     * Follows the link and renders the UI
     *
     * @param  {Element} link
     */
    _roadsLinkEvent(link: HTMLAnchorElement): void;
    /**
     * Submits the form and re-renders the UI
     *
     * @param {HTMLFormElement} form
     */
    _roadsFormEvent(form: HTMLFormElement): void;
}
