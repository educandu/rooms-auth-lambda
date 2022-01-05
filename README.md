# rooms-auth-lambda

[![codecov](https://codecov.io/gh/educandu/rooms-auth-lambda/branch/main/graph/badge.svg?token=SM7ANNBT3A)](https://codecov.io/gh/educandu/rooms-auth-lambda)

Lambda@Edge function for authorizing access to private room resources in [educandu](https://github.com/educandu/educandu).

## Usage

The handler in this package is supposed to run as a Lambda@Edge function in AWS.

### Environment variables

~~~sh
export WEBSITE_BASE_URL="https://consuming-website.com" # mandatory
export SESSION_COOKIE_NAME="MYCOOKIE" # optional, defaults to "SESSION_ID"
export DISABLE_LOGGING="true" # optional, defaults to logging enabled
~~~

As AWS Lambda@Edge function do not support environment variables, any values have to be injected into the code itself after deployment, for example (at the top of the bundle file:

~~~js
process.env.WEBSITE_BASE_URL = 'https://consuming-website.com';
~~~

### In AWS as a Lambda@Edge function

1. Run `gulp build` and you will find a single script file `index.js` in the `dist` folder which contains a bundle of all code needed to run on AWS.
2. Run `gulp pack` and you will find a file `lambda.zip` in the `pack` folder containing the bundle. This can be used for automated deployments on AWS (The Github action `publish` creates a release on Github and uploads this zip file).

### In code as a node module

~~~sh
yarn add @educandu/rooms-auth-lambda --dev
~~~

~~~js
import { handler } from '@educandu/rooms-auth-lambda';

handler(event, context, (error, result) => {
  // Do something
});
~~~

## Development Server

This package comes with a development server that can be used for testing the lambda locally. The server object returned by the call is the object you would get when starting an `express` server.

### In code as a node module

~~~sh
yarn add @educandu/rooms-auth-lambda --dev

export WEBSITE_BASE_URL="http://localhost:3000"
~~~

~~~js
import { startDevServer } from '@educandu/rooms-auth-lambda';

const port = 10000;
const cdnBaseUrl = 'http://localhost:9000/my-bucket';

const server = startDevServer(cdnBaseUrl, port, err => {
  // Do something with err
});

// Then, in the end, close the server:
server.close(err => {
  // Do something with err
});
~~~

### As a stand-alone node process

~~~sh
yarn add @educandu/rooms-auth-lambda --dev

export PORT=10000
export WEBSITE_BASE_URL="http://localhost:3000"
export CDN_BASE_URL="http://localhost:9000/my-bucket"

node ./node_modules/@educandu/rooms-auth-lambda/src/dev-server/run.js
~~~

## License

Educandu is released under the MIT License. See the bundled LICENSE file for details.
