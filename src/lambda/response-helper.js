import { getLoginPageUrl } from './urls.js';
import { CLOUDFRONT_PROTO } from './config.js';

export function loginRedirectResponse(request) {
  const redirectUrl = `${CLOUDFRONT_PROTO}//${request.headers.host[0].value}${request.uri}${request.querystring ? `?${request.querystring}` : ''}`;
  return {
    status: '302',
    statusDescription: 'Found',
    headers: {
      location: [
        {
          key: 'Location',
          value: getLoginPageUrl(redirectUrl)
        }
      ]
    }
  };
}

export function forbiddenResponse() {
  return {
    status: '403',
    statusDescription: 'Forbidden'
  };
}

export function notFoundResponse() {
  return {
    status: '404',
    statusDescription: 'Not Found'
  };
}

export function internalServerErrorResponse() {
  return {
    status: '500',
    statusDescription: 'Internal Server Error'
  };
}
