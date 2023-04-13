# rooms-auth-lambda

[![codecov](https://codecov.io/gh/educandu/rooms-auth-lambda/branch/main/graph/badge.svg)](https://codecov.io/gh/educandu/rooms-auth-lambda)

Lambda@Edge function for authorizing access to private room resources in [educandu](https://github.com/educandu/educandu).

## Prerequisites

* node.js ^18.0.0
* optional: globally installed gulp: `npm i -g gulp-cli`

The output of this repository is an npm package (`@educandu/rooms-auth-lambda`) as well as a zip file containing the Lambda@Edge function.

## Usage

The handler in this package is supposed to run as a Lambda@Edge function in AWS.

### Environment variables

~~~sh
export SESSION_COOKIE_NAME="SESSION_ID" # mandatory
export WEBSITE_BASE_URL="https://consuming-website.com" # mandatory
export X_ROOMS_AUTH_SECRET="<secret>" # mandatory
export DISABLE_LOGGING="true" # optional, defaults to logging being enabled
~~~

As AWS Lambda@Edge function do not support environment variables, any values have to be injected into the code itself after deployment, for example at the top of the bundle file:

~~~js
process.env.SESSION_COOKIE_NAME = 'SESSION_ID';
process.env.WEBSITE_BASE_URL = 'https://consuming-website.com';
process.env.X_ROOMS_AUTH_SECRET = "<secret>"
~~~

### In AWS as a Lambda@Edge function

Run `gulp build` and you will find a single script file `index.js` in the `dist` folder which contains a bundle of all code needed to run on AWS. You will also find a file `lambda.zip` in the `pack` folder containing the bundle. This can be used for automated deployments on AWS (The Github action `publish` creates a release on Github and uploads this zip file).

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

export SESSION_COOKIE_NAME="SESSION_ID"
export WEBSITE_BASE_URL="http://localhost:3000"
export X_ROOMS_AUTH_SECRET="<secret>"
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
export CDN_BASE_URL="http://localhost:9000/my-bucket"

export SESSION_COOKIE_NAME="SESSION_ID"
export WEBSITE_BASE_URL="http://localhost:3000"
export X_ROOMS_AUTH_SECRET="<secret>"

node ./node_modules/@educandu/rooms-auth-lambda/src/dev-server/run.js
~~~

---

## OER learning platform for music

Funded by 'Stiftung Innovation in der Hochschullehre'

<img src="https://stiftung-hochschullehre.de/wp-content/uploads/2020/07/logo_stiftung_hochschullehre_screenshot.jpg)" alt="Logo der Stiftung Innovation in der Hochschullehre" width="200"/>

A Project of the 'Hochschule für Musik und Theater München' (University for Music and Performing Arts)

<img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_Hochschule_f%C3%BCr_Musik_und_Theater_M%C3%BCnchen_.png" alt="Logo der Hochschule für Musik und Theater München" width="200"/>

Project owner: Hochschule für Musik und Theater München\
Project management: Ulrich Kaiser
