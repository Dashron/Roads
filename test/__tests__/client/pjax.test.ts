import { describe, expect, test, vi, beforeEach } from 'vitest';
import RoadsPjax from '../../../src/client/pjax.js';
import Road from '../../../src/core/road.js';
import Response from '../../../src/core/response.js';

describe('RoadsPjax Tests', () => {
	let mockWindow: Window;
	let mockContainer: HTMLElement;
	let road: Road;

	beforeEach(() => {
		// Create a mock window object with the necessary properties
		mockWindow = {
			history: {
				pushState: vi.fn(),
				replaceState: vi.fn()
			},
			location: {
				pathname: '/test',
				search: '',
				hash: ''
			},
			document: {
				title: 'Test Title'
			},
			onpopstate: null
		} as unknown as Window;

		// Create a mock container element
		mockContainer = {
			innerHTML: '',
			addEventListener: vi.fn()
		} as unknown as HTMLElement;

		// Create a fresh Road instance
		road = new Road();
	});

	describe('Bug #4: Null state check', () => {
		test('handles popstate event with null state without crashing', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			pjax.register();

			// Simulate a popstate event with null state
			const event = {
				state: null
			} as PopStateEvent;

			// This should not throw an error
			expect(() => {
				if (mockWindow.onpopstate) {
					mockWindow.onpopstate(event);
				}
			}).not.toThrow();
		});

		test('handles popstate event with state missing pjax property', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			pjax.register();

			// Simulate a popstate event with state that doesn't have pjax
			const event = {
				state: { someOtherProperty: 'value' }
			} as PopStateEvent;

			// This should not throw an error
			expect(() => {
				if (mockWindow.onpopstate) {
					mockWindow.onpopstate(event);
				}
			}).not.toThrow();

			// Should trigger a page reload by self-assigning location.pathname
			// We can't easily test this, but we verified it doesn't crash
		});

		test('handles popstate event with pjax state correctly', async () => {
			road.use(() => Promise.resolve(new Response('Test content', 200)));
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			pjax.register();

			// Simulate a popstate event with valid pjax state
			const event = {
				state: { pjax: true }
			} as PopStateEvent;

			// Call the popstate handler
			if (mockWindow.onpopstate) {
				mockWindow.onpopstate(event);
			}

			// Give async operations time to complete
			await new Promise(resolve => setTimeout(resolve, 10));

			// The container should have been updated
			expect(mockContainer.innerHTML).toBe('Test content');
		});
	});

	describe('Bug #2: Link href absolute URL', () => {
		test('_roadsLinkEvent uses relative path instead of absolute URL', async () => {
			// Set up a route
			road.use((method, path) => {
				// Verify we receive a relative path, not absolute URL
				expect(path).toBe('/users/123?page=2#section');
				return Promise.resolve(new Response('User content', 200));
			});

			const pjax = new RoadsPjax(road, mockContainer, mockWindow);

			// Create a mock anchor element with absolute href
			const mockLink = {
				href: 'http://localhost:3000/users/123?page=2#section',
				pathname: '/users/123',
				search: '?page=2',
				hash: '#section'
			} as HTMLAnchorElement;

			// Call _roadsLinkEvent
			// @ts-expect-error - accessing protected method for testing
			await pjax._roadsLinkEvent(mockLink);

			// Give async operations time to complete
			await new Promise(resolve => setTimeout(resolve, 10));

			// Verify the route was called with relative path
			expect(mockContainer.innerHTML).toBe('User content');
		});

		test('_roadsLinkEvent preserves query strings', async () => {
			road.use((method, path) => {
				expect(path).toContain('?page=2');
				return Promise.resolve(new Response('Content', 200));
			});

			const pjax = new RoadsPjax(road, mockContainer, mockWindow);

			const mockLink = {
				href: 'http://localhost:3000/users?page=2',
				pathname: '/users',
				search: '?page=2',
				hash: ''
			} as HTMLAnchorElement;

			// @ts-expect-error - accessing protected method for testing
			await pjax._roadsLinkEvent(mockLink);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockContainer.innerHTML).toBe('Content');
		});

		test('_roadsLinkEvent preserves hash fragments', async () => {
			road.use((method, path) => {
				expect(path).toContain('#section');
				return Promise.resolve(new Response('Content', 200));
			});

			const pjax = new RoadsPjax(road, mockContainer, mockWindow);

			const mockLink = {
				href: 'http://localhost:3000/users#section',
				pathname: '/users',
				search: '',
				hash: '#section'
			} as HTMLAnchorElement;

			// @ts-expect-error - accessing protected method for testing
			await pjax._roadsLinkEvent(mockLink);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockContainer.innerHTML).toBe('Content');
		});
	});

	describe('Basic functionality', () => {
		test('register sets up popstate handler', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			expect(mockWindow.onpopstate).toBeNull();

			pjax.register();

			expect(mockWindow.onpopstate).not.toBeNull();
			expect(typeof mockWindow.onpopstate).toBe('function');
		});

		test('register sets up click listener on container', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			pjax.register();

			expect(mockContainer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
		});

		test('render updates container innerHTML', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			const response = new Response('Hello World', 200);

			pjax.render(response);

			expect(mockContainer.innerHTML).toBe('Hello World');
		});

		test('render handles undefined body', () => {
			const pjax = new RoadsPjax(road, mockContainer, mockWindow);
			mockContainer.innerHTML = 'existing content';

			// Create response with undefined body
			const response = new Response(undefined as unknown as string, 200);

			pjax.render(response);

			expect(mockContainer.innerHTML).toBe('');
		});
	});
});
