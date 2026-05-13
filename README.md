# flotiq-api

Node.js CommonJS client for working with the Flotiq API. The package wraps Flotiq content type, content object, and media operations behind a single class built on top of `axios`, with request throttling and automatic retry handling for HTTP `429` responses.

## Features

- Fetch and update content type definitions
- Read, publish, create, patch, and delete content objects
- Download and upload media files
- Reuse cached API clients with `getFlotiqApi(...)`
- Throttle write traffic with `writePerSecondLimit`
- Retry requests after rate limiting using the `Retry-After` header when present

## Requirements

- Node.js
- Yarn

## Installation

Install dependencies in the repository root:

```bash
yarn install flotiq-api
```

## Usage

### Create a client

```js
const FlotiqApi = require('flotiq-api');

const api = new FlotiqApi('https://api.flotiq.com/api', 'YOUR_API_KEY', {
  batchSize: 100,
  batchSizeRead: 1000,
  writePerSecondLimit: 10,
});
```

### Reuse a cached client

```js
const { getFlotiqApi } = require('flotiq-api');

const api = getFlotiqApi('https://api.flotiq.com/api', 'YOUR_API_KEY', {
  batchSize: 100,
});
```

Clients created through `getFlotiqApi(...)` are cached by API URL, API key, and options.

### Fetch content objects

```js
const objects = await api.fetchContentObjects(
  'article',
  1,
  50,
  { field: 'internal.createdAt', direction: 'asc' },
  { status: { type: 'equals', filter: 'published' } }
);
```

### Create or update content objects in batches

```js
await api.persistContentObjectBatch('article', [
  {
    id: 'article-1',
    title: 'Hello Flotiq',
  },
]);
```

### Upload media from a remote URL

```js
const media = await api.uploadMediaFromUrl({
  fileName: 'hero.png',
  mime_type: 'image/png',
  url: 'https://example.com/hero.png',
});
```

## API Overview

### Constructor

```js
new FlotiqApi(flotiqApiUrl, flotiqApiKey, options)
```

Supported options:

- `batchSize`: write batch size, defaults to `100`
- `batchSizeRead`: read page size, defaults to `1000` or `batchSize` when provided
- `writePerSecondLimit`: maximum write throughput, defaults to `10`

### Content type definitions

- `fetchContentTypeDefinition(name)`
- `fetchContentType(internal = false)`
- `fetchContentTypeDefs()`
- `updateContentTypeDefinition(name, definition)`
- `deleteContentTypeDefinition(name)`
- `checkIfClear(ctds)`
- `createOrUpdate(remoteCtd, contentTypeDefinition)`

### Content objects

- `fetchContentObject(contentType, id, hydrate = 0)`
- `fetchContentObjects(contentType, hydrate = 0, limit, order, filters)`
- `persistContentObjectBatch(contentType, objects)`
- `patchContentObjectBatch(contentType, objects)`
- `deleteContentObjectBatch(contentType, objects)`
- `publishContentObject(contentType, object)`

### Media

- `fetchMediaFile(mediaUrl)`
- `uploadMedia(form)`
- `uploadMediaFromUrl(contentObject, existingImages = {})`

## Utilities

The repository also exposes helper utilities in `./src/util.js`:

- `camelize(str)`
- `readCTDs(directory)`
- `shouldUpdate(relatedContentObject, replacements)`
- `rateLimitInterceptor(axios, logger, defaultDelay)`
- `throttleInterceptor(axios, delay)`

Logging is handled with Winston in `./src/logger.js`.

## Development

Run the test suite:

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test:watch
```

## Notes

- The client sends the `X-Auth-Token` header for authentication.
- Requests are created with the `x-mode: preview` header.
- Batch writes show a terminal progress bar using the `progress` package.