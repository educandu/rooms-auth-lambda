# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Lambda@Edge function for authorizing access to private room resources in educandu. It serves as an authentication gateway that verifies user sessions before allowing access to protected media files stored in CloudFront/CDN.

The package has dual purposes:
1. Deployed as a Lambda@Edge function on AWS CloudFront
2. Published as an npm package (`@educandu/rooms-auth-lambda`) for integration testing

## Development Commands

### Common Tasks
- **Lint**: `gulp lint`
- **Fix linting issues**: `gulp fix`
- **Run tests**: `gulp test`
- **Run tests in watch mode**: `gulp testWatch`
- **Build**: `gulp build` (outputs bundled `dist/index.js` and `pack/lambda.zip`)

### Development Server
- **Start dev server**: `gulp serve` (runs on port 10000)
- **Watch mode**: `gulp watch` (rebuilds and restarts on changes)

The dev server requires these environment variables:
```sh
export SESSION_COOKIE_NAME="SESSION_ID"
export WEBSITE_BASE_URL="http://localhost:3000"
export X_ROOMS_AUTH_SECRET="<secret>"
```

### Running Single Tests
Tests use Vitest. Run a single test file:
```sh
npx vitest run src/lambda/index.spec.js
```

Run tests matching a pattern:
```sh
npx vitest run -t "pattern"
```

## Architecture

### Core Authentication Flow

The Lambda@Edge handler ([src/lambda/index.js](src/lambda/index.js)) intercepts CloudFront requests and:

1. **Request Analysis**: Parses the request URI to determine resource type (via [request-helper.js](src/lambda/request-helper.js)):
   - `/room-media/{roomId}/*` - Room-specific media files
   - `/document-input-media/{roomId}/{documentInputId}/*` - Document input media files
   - `/media-trash/*` - Deleted files media in trash

2. **Cookie Extraction**: Extracts session cookie from request headers

3. **Authorization**: Makes API call to educandu website to verify access:
   - Sends session cookie and `x-rooms-auth-secret` header
   - Checks response status (200/401/403/500)

4. **Response**:
   - 200: Returns original request (allows CloudFront to serve file)
   - 401: Redirects to login page with return URL
   - 403: Returns forbidden response
   - Other: Returns 500 error

### Key Components

- **[src/lambda/index.js](src/lambda/index.js)**: Main Lambda@Edge handler
- **[src/lambda/website-api-client.js](src/lambda/website-api-client.js)**: Makes authorization API calls to educandu website
- **[src/lambda/request-helper.js](src/lambda/request-helper.js)**: Parses CloudFront requests to extract resource type and IDs
- **[src/lambda/response-helper.js](src/lambda/response-helper.js)**: Generates CloudFront-compatible response objects
- **[src/lambda/urls.js](src/lambda/urls.js)**: Constructs API endpoint URLs
- **[src/lambda/config.js](src/lambda/config.js)**: Environment variable configuration
- **[src/dev-server/](src/dev-server/)**: Express-based local development server that simulates Lambda@Edge

### Build System

Uses Gulp with `@educandu/dev-tools`:
- **esbuild**: Bundles lambda code into single CommonJS file for AWS deployment (Node 16 target)
- **Bundling**: Entry point is `src/lambda/index.js`, outputs to `dist/index.js` (CommonJS format)
- **Packaging**: Creates `pack/lambda.zip` containing the bundled file for AWS deployment

### Environment Variables

Required variables (configured in [src/lambda/config.js](src/lambda/config.js)):
- `SESSION_COOKIE_NAME`: Name of the session cookie to extract
- `WEBSITE_BASE_URL`: Base URL of the educandu website API
- `X_ROOMS_AUTH_SECRET`: Shared secret for authenticating Lambda to website API
- `DISABLE_LOGGING`: Optional, set to "true" to disable logging, used in tests

**Important**: Lambda@Edge doesn't support environment variables natively. Values must be injected into the bundled code after deployment by prepending `process.env` assignments at the top of `dist/index.js`.

### Testing

- Test files use `.spec.js` suffix
- Tests use Vitest with Sinon for mocking
- Coverage excludes dev-server and website-api-client
- Test setup in [src/test-setup.js](src/test-setup.js)

### AWS Lambda@Edge Constraints

- Only GET and HEAD requests are allowed (enforced in CloudFront config)
- Uses CommonJS format (not ESM) for AWS compatibility
- Target is Node 16 (Lambda@Edge restriction)
- Uses `phin` library as polyfill for `fetch` (until Lambda@Edge supports Node 18+)

## Code Style

- Uses ESLint with educandu dev-tools configuration
- ES modules (ESM) in source code
- CommonJS in bundled output for Lambda@Edge
