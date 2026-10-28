import { describe, expect, test, vi, beforeEach } from 'vitest';
import { Road, Response, StoreValsMiddleware, ApplyToContextMiddleware } from 'roads';
import addLayout from '../../../example/ts/src/middleware/addLayout.js';
import buildServerRoad from '../../../example/ts/src/buildServerRoad.js';
import buildApiRoad from '../../../example/ts/src/api/buildApiRoad.js';
import { escapeHtml, SITE_NAME, SiteContext, TITLE_KEY } from '../../../example/ts/src/shared.js';

// Builds a road with only the middleware the layout needs, and a route that stores the given title
const buildLayoutRoad = (title?: string) => {
	const road = new Road();
	road.use(StoreValsMiddleware.middleware);
	road.use(ApplyToContextMiddleware.build<SiteContext, 'siteName'>('siteName', SITE_NAME));
	road.use(addLayout);
	road.use(function (this: StoreValsMiddleware.StoreValsContext) {
		if (title !== undefined) {
			this.storeVal(TITLE_KEY, title);
		}

		return Promise.resolve(new Response('<p>Body</p>'));
	});

	return road;
};

describe('example escapeHtml', () => {
	test('escapes every character that is special in HTML text and attributes', () => {
		expect(escapeHtml('<a href="x" title=\'y\'>&</a>'))
			.toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
	});

	test('escapes & first, so the entities it adds are not escaped again', () => {
		expect(escapeHtml('<&')).toBe('&lt;&amp;');
	});
});

describe('example addLayout', () => {
	test('the page title is escaped', async () => {
		const response = await buildLayoutRoad('</title><script>alert(1)</script>').request('GET', '/');

		expect(response.body).toContain('<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>');
		expect(response.body).not.toContain('<script>alert(1)</script>');
	});

	test('the site name is used as the title when the route does not store one', async () => {
		const response = await buildLayoutRoad().request('GET', '/');

		expect(response.body).toContain(`<title>${SITE_NAME}</title>`);
	});

	test('the body is not escaped, because routes return HTML', async () => {
		const response = await buildLayoutRoad('Title').request('GET', '/');

		expect(response.body).toContain('<div id="container"><p>Body</p></div>');
	});
});

describe('example server road', () => {
	beforeEach(() => {
		// buildServerRoad logs every request
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	test('a decoded path variable and query value are escaped in the page and the title', async () => {
		const road = buildServerRoad(buildApiRoad([]));
		const response = await road.request('GET', '/tags/%3Cscript%3Ex%3C%2Fscript%3E?sort=%22%3E%3Cimg%3E');

		expect(response.status).toBe(200);
		expect(response.body).toContain('<title>Tag: &lt;script&gt;x&lt;/script&gt;</title>');
		expect(response.body).toContain('url.args.slug is <code>&lt;script&gt;x&lt;/script&gt;</code>');
		expect(response.body).toContain('url.query.sort is <code>&quot;&gt;&lt;img&gt;</code>');
		expect(response.body).not.toContain('<script>x');
		expect(response.body).not.toContain('<img>');
	});
});
