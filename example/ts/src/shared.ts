/**
 * shared.ts
 * Copyright(c) 2026 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * Values and types used by both the server and the browser code
 */

import { RoadModule } from 'roads';

/**
 * The storeVals key that holds the page title. The layout reads it on the server, and RoadsPJAX reads it
 * 	in the browser (see buildClientRoad.ts), so both must use the same key
 */
export const TITLE_KEY = 'page-title';

/**
 * The storeVals key that tells addLayout to return the response body without the HTML layout
 */
export const IGNORE_LAYOUT_KEY = 'ignoreLayout';

/**
 * The context added by ApplyToContextMiddleware in both roads. See buildServerRoad.ts
 */
export interface SiteContext extends RoadModule.Context {
	siteName: string
}

export const SITE_NAME = 'Roads Example';
