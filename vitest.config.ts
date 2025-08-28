import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Test file patterns
		include: ['test/__tests__/**/*.test.ts'],

		// Environment setup
		environment: 'node',

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/*.d.ts',
				'src/**/*.test.ts',
				'dist/**/*',
				'types/**/*'
			]
		},

		// Global setup
		globals: true,

		// Reporter configuration
		reporters: ['verbose'],

		// Timeout settings
		testTimeout: 10000,
		hookTimeout: 10000
	}
});