"use strict";
/**
 * Adds two simple functions to get and set a page title on the request context. This is very helpful for isomorphic js, since on the client, page titles aren't part of the rendered view data.
 */
let setTitle;
setTitle = function (method, path, body, headers, next) {
    this._page_title = null;
    this.setTitle = (title) => {
        this._page_title = title ? title : '';
    };
    return next();
};
export default setTitle;
