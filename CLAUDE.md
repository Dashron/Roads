# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/` with type declarations in `types/`
- **Lint**: `npm run lint` - Runs TypeScript compiler check and ESLint
- **Test**: `npm run test` - Runs both linting and test suite via Vitest
- **Test only**: `npm run test-code` - Runs test suite only using Vitest in `test/__tests__/`

## Project Architecture

**Roads** is an isomorphic HTTP framework that works both server-side and client-side. The core architecture follows these patterns:

### Core Components
- **Road class** (`src/core/road.ts`): Central class that manages middleware chain execution
- **Response class** (`src/core/response.ts`): Handles HTTP response objects
- **RequestChain** (`src/core/requestChain.ts`): Manages middleware execution order
- **Middleware system**: Functions that process requests in a chain pattern using `road.use()`

### Module Structure
- `src/core/`: Core framework classes (Road, Response, RequestChain)
- `src/middleware/`: Bundled middleware (routing, cookies, CORS, body parsing, etc.)
- `src/client/`: Browser-specific code (PJAX, request handling)
- `test/__tests__/`: Test files using Vitest
- `dist/`: Compiled JavaScript output
- `types/`: TypeScript declaration files

### Key Architectural Patterns
- **Middleware Chain**: Functions added via `road.use()` execute in order, each receiving a `next()` callback
- **Context System**: Middleware can add properties to `this` context shared across the request chain
- **Isomorphic Design**: Same code runs on server and browser with appropriate middleware
- **Promise-based**: All middleware returns promises resolving to Response objects or strings

### TypeScript Configuration
- Uses ES2023 target with NodeNext modules and resolution
- Comprehensive strict TypeScript settings enabled (noImplicitAny, strictNullChecks, noImplicitThis, alwaysStrict, exactOptionalPropertyTypes, noUncheckedIndexedAccess)
- Declaration files and declaration maps generated automatically in `types/` directory
- Source maps with inline sources included for debugging
- Incremental compilation with build info caching enabled
- Includes both ES2023 and DOM libraries for isomorphic compatibility

The framework emphasizes simplicity and isomorphic usage, allowing the same routing and middleware code to work in both Node.js servers and browser environments.