// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import RoadsPjax from '../../../src/client/pjax.js';
import Road from '../../../src/core/road.js';
import Response from '../../../src/core/response.js';
import { StoreValsContext } from '../../../src/middleware/storeVals.js';

interface RecordedRequest {
	method: string,
	path: string,
	body: unknown,
	headers: unknown
}

// Lets every pending promise in the road and pjax settle
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('RoadsPjax Tests', () => {
	let container: HTMLElement;
	let road: Road;
	let pjax: RoadsPjax;
	let requests: RecordedRequest[];
	let routes: Record<string, () => Response | Promise<Response>>;

	// Records whether the browser's default action would have run for link clicks and form submits.
	//	Document listeners run after the container's, so this sees pjax's decision, then stops jsdom
	//	from navigating. Other clicks are left alone, since cancelling a submit button's click would
	//	also cancel the submit.
	let defaultAllowed: boolean[];
	const recordDefault = (event: Event) => {
		if (event.type === 'click' && !(event.target as Element).closest('a')) {
			return;
		}

		defaultAllowed.push(!event.defaultPrevented);
		event.preventDefault();
	};

	beforeEach(() => {
		window.history.replaceState(null, '', '/');
		document.title = 'Original Title';
		document.body.innerHTML = '<div id="container"></div>';
		container = document.getElementById('container') as HTMLElement;

		requests = [];
		routes = {};
		defaultAllowed = [];
		document.addEventListener('click', recordDefault);
		document.addEventListener('submit', recordDefault);

		road = new Road();
		road.use((method, path, body, headers) => {
			requests.push({ method, path, body, headers });
			const route = routes[`${method} ${path}`];
			return Promise.resolve(route ? route() : new Response('Not found', 404));
		});

		pjax = new RoadsPjax(road, container, window);
	});

	afterEach(() => {
		pjax.unregister();
		document.removeEventListener('click', recordDefault);
		document.removeEventListener('submit', recordDefault);
		vi.restoreAllMocks();
	});

	const click = (element: Element, init: MouseEventInit = {}) => {
		element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
	};

	const popstate = (state: unknown) => {
		window.dispatchEvent(new PopStateEvent('popstate', { state }));
	};

	// jsdom, like browsers, doesn't let location's setters or reload be replaced, so tests that check
	//	navigation give pjax a window whose location records them. Everything else is the real window.
	const recordNavigation = () => {
		const navigations = { href: [] as string[], pathname: [] as string[], reload: vi.fn() };
		const location = {
			get origin () { return window.location.origin; },
			get href () { return window.location.href; },
			set href (value: string) { navigations.href.push(value); },
			get pathname () { return window.location.pathname; },
			set pathname (value: string) { navigations.pathname.push(value); },
			get search () { return window.location.search; },
			get hash () { return window.location.hash; },
			reload: navigations.reload
		};

		pjax = new RoadsPjax(road, container, {
			location,
			history: window.history,
			document: window.document,
			addEventListener: window.addEventListener.bind(window),
			removeEventListener: window.removeEventListener.bind(window)
		} as unknown as Window);

		return navigations;
	};

	describe('render', () => {
		test('render updates container innerHTML', () => {
			pjax.render(new Response('Hello World', 200));
			expect(container.innerHTML).toBe('Hello World');
		});

		test('render handles undefined body', () => {
			container.innerHTML = 'existing content';
			pjax.render(new Response(undefined as unknown as string, 200));
			expect(container.innerHTML).toBe('');
		});
	});

	describe('links', () => {
		test('a pjax link is requested through the road with its path, query and hash', async () => {
			routes['GET /users/123?page=2#section'] = () => new Response('User content');
			container.innerHTML = '<a href="http://localhost:3000/users/123?page=2#section" data-roads-pjax="link">User</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(defaultAllowed).toEqual([false]);
			expect(container.innerHTML).toBe('User content');
			expect(window.location.pathname + window.location.search + window.location.hash)
				.toBe('/users/123?page=2#section');
			expect(window.history.state).toEqual({ page_title: 'Original Title', pjax: true });
		});

		test('a click on an element inside a pjax link is handled', async () => {
			routes['GET /inner'] = () => new Response('Inner content');
			container.innerHTML = '<a href="/inner" data-roads-pjax="link"><span><b>Text</b></span></a>';
			pjax.register();

			click(container.querySelector('b') as Element);
			await settle();

			expect(defaultAllowed).toEqual([false]);
			expect(container.innerHTML).toBe('Inner content');
		});

		test.each([
			['ctrl', { ctrlKey: true }],
			['meta', { metaKey: true }],
			['shift', { shiftKey: true }],
			['alt', { altKey: true }],
			['middle button', { button: 1 }]
		])('a %s click is left to the browser', async (name, init) => {
			container.innerHTML = '<a href="/page" data-roads-pjax="link">Page</a>';
			pjax.register();

			click(container.querySelector('a') as Element, init);
			await settle();

			expect(defaultAllowed).toEqual([true]);
			expect(requests).toEqual([]);
		});

		test.each([
			['target="_blank"', '<a href="/page" target="_blank" data-roads-pjax="link">Page</a>'],
			['download', '<a href="/page" download data-roads-pjax="link">Page</a>'],
			['another origin', '<a href="https://example.com/page" data-roads-pjax="link">Page</a>'],
			['no pjax attribute', '<a href="/page">Page</a>']
		])('a link with %s is left to the browser', async (name, html) => {
			container.innerHTML = html;
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(defaultAllowed).toEqual([true]);
			expect(requests).toEqual([]);
		});

		test('a link with target="_self" is handled', async () => {
			routes['GET /page'] = () => new Response('Page');
			container.innerHTML = '<a href="/page" target="_self" data-roads-pjax="link">Page</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(container.innerHTML).toBe('Page');
		});

		test('a link follows redirects and puts the final url in the url bar', async () => {
			routes['GET /old'] = () => new Response('', 302, { location: '/middle?x=1' });
			routes['GET /middle?x=1'] = () => new Response('', 301, { location: 'http://localhost:3000/new' });
			routes['GET /new'] = () => new Response('New content');
			container.innerHTML = '<a href="/old" data-roads-pjax="link">Old</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(requests.map(request => request.path)).toEqual(['/old', '/middle?x=1', '/new']);
			expect(container.innerHTML).toBe('New content');
			expect(window.location.pathname).toBe('/new');
		});

		test('a redirect to another origin sends the browser there', async () => {
			const navigations = recordNavigation();
			routes['GET /out'] = () => new Response('', 302, { location: 'https://example.com/landing' });
			container.innerHTML = '<a href="/out" data-roads-pjax="link">Out</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(navigations.href).toEqual(['https://example.com/landing']);
			// Nothing was rendered
			expect(container.querySelector('a')).not.toBeNull();
		});

		test('a redirect loop falls back to a normal page load', async () => {
			const navigations = recordNavigation();
			routes['GET /loop'] = () => new Response('', 302, { location: '/loop' });
			container.innerHTML = '<a href="/loop" data-roads-pjax="link">Loop</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(requests.length).toBe(6);
			expect(navigations.href).toEqual(['http://localhost:3000/loop']);
		});

		test('a failed road request falls back to a normal page load', async () => {
			const navigations = recordNavigation();
			routes['GET /broken'] = () => { throw new Error('route failed'); };
			container.innerHTML = '<a href="/broken" data-roads-pjax="link">Broken</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(navigations.href).toEqual(['http://localhost:3000/broken']);
		});

		test('a slow response does not replace a newer one', async () => {
			let finishSlow: (response: Response) => void = () => undefined;
			routes['GET /slow'] = () => new Promise<Response>(resolve => { finishSlow = resolve; });
			routes['GET /fast'] = () => new Response('Fast content');
			container.innerHTML = '<a id="slow" href="/slow" data-roads-pjax="link">Slow</a>'
				+ '<a id="fast" href="/fast" data-roads-pjax="link">Fast</a>';
			pjax.register();

			click(container.querySelector('#slow') as Element);
			await settle();
			click(container.querySelector('#fast') as Element);
			await settle();
			finishSlow(new Response('Slow content'));
			await settle();

			expect(container.innerHTML).toBe('Fast content');
			expect(window.location.pathname).toBe('/fast');
		});
	});

	describe('page titles', () => {
		test('the title is left alone when the route does not set one', async () => {
			routes['GET /untitled'] = () => new Response('Untitled');
			container.innerHTML = '<a href="/untitled" data-roads-pjax="link">Untitled</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(container.innerHTML).toBe('Untitled');
			expect(document.title).toBe('Original Title');
		});

		test('the title is set when the route stores one', async () => {
			const titledRoad = new Road();
			pjax = new RoadsPjax(titledRoad, container, window);
			pjax.addTitleMiddleware('page-title');
			titledRoad.use(function (this: StoreValsContext) {
				this.storeVal('page-title', 'New Title');
				return Promise.resolve(new Response('Titled'));
			});
			container.innerHTML = '<a href="/titled" data-roads-pjax="link">Titled</a>';
			pjax.register();

			click(container.querySelector('a') as Element);
			await settle();

			expect(document.title).toBe('New Title');
			expect(window.history.state).toEqual({ page_title: 'New Title', pjax: true });
		});

		test('back and forward use the title saved in the history entry when the route has none', async () => {
			routes['GET /page'] = () => new Response('Page');
			pjax.register();
			window.history.pushState({ page_title: 'Saved Title', pjax: true }, '', '/page');

			popstate({ page_title: 'Saved Title', pjax: true });
			await settle();

			expect(document.title).toBe('Saved Title');
		});
	});

	describe('back and forward', () => {
		test('a pjax history entry is requested with its query string and hash', async () => {
			routes['GET /search?q=roads#results'] = () => new Response('Search results');
			pjax.register();
			window.history.pushState({ pjax: true }, '', '/search?q=roads#results');

			popstate({ pjax: true });
			await settle();

			expect(requests.map(request => request.path)).toEqual(['/search?q=roads#results']);
			expect(container.innerHTML).toBe('Search results');
		});

		test('back and forward do not add history entries', async () => {
			routes['GET /page'] = () => new Response('Page');
			const pushState = vi.spyOn(window.history, 'pushState');
			pjax.register();
			window.history.replaceState({ pjax: true }, '', '/page');

			popstate({ pjax: true });
			await settle();

			expect(container.innerHTML).toBe('Page');
			expect(pushState).not.toHaveBeenCalled();
		});

		test.each([
			['null state', null],
			['state without pjax', { someOtherProperty: 'value' }]
		])('a non-pjax history entry with %s reloads the page', (name, state) => {
			const navigations = recordNavigation();
			pjax.register();

			popstate(state);

			expect(navigations.pathname).toEqual(['/']);
			expect(requests).toEqual([]);
		});

		test('a failed road request on back or forward reloads the page', async () => {
			const navigations = recordNavigation();
			routes['GET /broken'] = () => { throw new Error('route failed'); };
			pjax.register();
			window.history.replaceState({ pjax: true }, '', '/broken');

			popstate({ pjax: true });
			await settle();

			expect(navigations.reload).toHaveBeenCalled();
		});
	});

	describe('forms', () => {
		test('a GET form sends its fields, including the submit button, as a query string', async () => {
			routes['GET /search?q=roads&sort=new'] = () => new Response('Results');
			container.innerHTML = `<form method="get" action="http://localhost:3000/search?old=1" data-roads-pjax="form">
				<input name="q" value="roads">
				<button name="sort" value="new" data-roads-pjax="submit">Go</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(defaultAllowed).toEqual([false]);
			expect(requests).toEqual([
				{ method: 'GET', path: '/search?q=roads&sort=new', body: undefined, headers: undefined }
			]);
			expect(container.innerHTML).toBe('Results');
			expect(window.location.pathname + window.location.search).toBe('/search?q=roads&sort=new');
		});

		test('a POST form sends its fields as a urlencoded body and leaves the url alone', async () => {
			routes['POST /messages'] = () => new Response('Sent');
			container.innerHTML = `<form method="post" action="/messages" data-roads-pjax="form">
				<input name="message" value="hello world">
				<input type="submit" name="action" value="send" data-roads-pjax="submit">
			</form>`;
			pjax.register();

			(container.querySelector('input[type="submit"]') as HTMLInputElement).click();
			await settle();

			expect(requests).toEqual([{
				method: 'POST',
				path: '/messages',
				body: 'message=hello+world&action=send',
				headers: { 'content-type': 'application/x-www-form-urlencoded' }
			}]);
			expect(container.innerHTML).toBe('Sent');
			expect(window.location.pathname).toBe('/');
		});

		test('a POST form that redirects renders the redirect target and puts it in the url bar', async () => {
			routes['POST /messages'] = () => new Response('', 303, { location: '/messages/1' });
			routes['GET /messages/1'] = () => new Response('Message 1');
			container.innerHTML = `<form method="post" action="/messages" data-roads-pjax="form">
				<button data-roads-pjax="submit">Send</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(requests.map(request => `${request.method} ${request.path}`))
				.toEqual(['POST /messages', 'GET /messages/1']);
			expect(container.innerHTML).toBe('Message 1');
			expect(window.location.pathname).toBe('/messages/1');
		});

		test('a 307 redirect keeps the method and body', async () => {
			routes['POST /old'] = () => new Response('', 307, { location: '/new' });
			routes['POST /new'] = () => new Response('Saved');
			container.innerHTML = `<form method="post" action="/old" data-roads-pjax="form">
				<input name="a" value="1">
				<button data-roads-pjax="submit">Save</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(requests[1]).toEqual({
				method: 'POST',
				path: '/new',
				body: 'a=1',
				headers: { 'content-type': 'application/x-www-form-urlencoded' }
			});
			expect(container.innerHTML).toBe('Saved');
		});

		test('the submit button\'s formmethod and formaction are used', async () => {
			routes['DELETE /posts/1'] = () => new Response('Deleted');
			container.innerHTML = `<form method="post" action="/posts" data-roads-pjax="form">
				<button formmethod="delete" formaction="/posts/1" data-roads-pjax="submit">Delete</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(requests.map(request => `${request.method} ${request.path}`)).toEqual(['DELETE /posts/1']);
		});

		test('a form submitted without a submit button is handled', async () => {
			routes['POST /save'] = () => new Response('Saved');
			container.innerHTML = `<form method="post" action="/save" data-roads-pjax="form">
				<input name="a" value="1">
			</form>`;
			pjax.register();

			(container.querySelector('form') as HTMLFormElement).requestSubmit();
			await settle();

			expect(container.innerHTML).toBe('Saved');
		});

		test.each([
			['a submit button without the pjax attribute', `<form method="post" action="/save" data-roads-pjax="form">
				<button>Save</button></form>`],
			['a form without the pjax attribute', `<form method="post" action="/save">
				<button data-roads-pjax="submit">Save</button></form>`],
			['a form posting to another origin', `<form method="post" action="https://example.com/save"
				data-roads-pjax="form">
				<button data-roads-pjax="submit">Save</button></form>`],
			['a form targeting a new window', `<form method="post" action="/save" target="_blank" data-roads-pjax="form">
				<button data-roads-pjax="submit">Save</button></form>`]
		])('%s is left to the browser', async (name, html) => {
			container.innerHTML = html;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(defaultAllowed).toEqual([true]);
			expect(requests).toEqual([]);
		});

		test('a failed GET form falls back to a normal page load', async () => {
			const navigations = recordNavigation();
			routes['GET /search?q=x'] = () => { throw new Error('route failed'); };
			container.innerHTML = `<form action="/search" data-roads-pjax="form">
				<input name="q" value="x"><button data-roads-pjax="submit">Go</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(navigations.href).toEqual(['http://localhost:3000/search?q=x']);
		});

		test('a failed POST form is not sent again', async () => {
			const navigations = recordNavigation();
			vi.spyOn(console, 'log').mockImplementation(() => undefined);
			routes['POST /save'] = () => { throw new Error('route failed'); };
			container.innerHTML = `<form method="post" action="/save" data-roads-pjax="form">
				<button data-roads-pjax="submit">Save</button>
			</form>`;
			pjax.register();

			(container.querySelector('button') as HTMLButtonElement).click();
			await settle();

			expect(requests.length).toBe(1);
			expect(navigations.href).toEqual([]);
		});
	});

	describe('registering', () => {
		test('register does not overwrite window.onpopstate', () => {
			const existing = () => undefined;
			window.onpopstate = existing;

			pjax.register();

			expect(window.onpopstate).toBe(existing);
			window.onpopstate = null;
		});

		test('register replaces the initial history entry with a non-pjax state', () => {
			pjax.register();
			expect(window.history.state).toEqual({ page_title: 'Original Title', pjax: false });
		});

		test('an additional element registered after register handles links and forms', async () => {
			routes['GET /outside'] = () => new Response('Outside link');
			routes['POST /outside-form'] = () => new Response('Outside form');
			document.body.insertAdjacentHTML('beforeend', `<nav id="nav">
				<a href="/outside" data-roads-pjax="link">Outside</a>
				<form method="post" action="/outside-form" data-roads-pjax="form">
					<button data-roads-pjax="submit">Go</button>
				</form>
			</nav>`);
			const nav = document.getElementById('nav') as HTMLElement;

			pjax.register();
			pjax.registerAdditionalElement(nav);

			click(nav.querySelector('a') as Element);
			await settle();
			expect(container.innerHTML).toBe('Outside link');

			(nav.querySelector('button') as HTMLButtonElement).click();
			await settle();
			expect(container.innerHTML).toBe('Outside form');
		});

		test('unregister stops handling links, forms and back and forward', async () => {
			const navigations = recordNavigation();
			container.innerHTML = `<a href="/page" data-roads-pjax="link">Page</a>
				<form method="post" action="/save" data-roads-pjax="form">
					<button data-roads-pjax="submit">Save</button>
				</form>`;
			pjax.register();
			pjax.unregister();

			click(container.querySelector('a') as Element);
			(container.querySelector('button') as HTMLButtonElement).click();
			popstate({ pjax: true });
			await settle();

			expect(defaultAllowed).toEqual([true, true]);
			expect(requests).toEqual([]);
			expect(navigations.pathname).toEqual([]);
		});
	});
});
