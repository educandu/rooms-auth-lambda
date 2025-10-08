import { inspect } from 'node:util';
import { logger } from './logging.js';
import WebsiteApiClient from './website-api-client.js';
import { analyzeRequest, REQUEST_TYPE } from './request-helper.js';
import { forbiddenResponse, internalServerErrorResponse, loginRedirectResponse, notFoundResponse } from './response-helper.js';

const websiteApiClient = new WebsiteApiClient();

export async function handler(event, _context, callback) {
  const request = event.Records[0].cf.request;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // This should never happen, only GET and HEAD should be allowed in CloudFront configuration
    // In case of misconfiguration we respond with 500 to any non read-request
    return callback(null, internalServerErrorResponse());
  }

  const { requestType, roomId, documentInputId, sessionCookie } = analyzeRequest(request);

  if (requestType === REQUEST_TYPE.unknown) {
    // Request path does not match any of the required patterns -> 404
    return callback(null, notFoundResponse());
  }

  if (!sessionCookie) {
    // If there is no cookie, we redirect to the login page, so the user can login and then be redirected back to the requested resource
    return callback(null, loginRedirectResponse(request));
  }

  let verificationResponse;
  try {
    switch (requestType) {
      case REQUEST_TYPE.roomMedia:
        verificationResponse = await websiteApiClient.callRoomAccessAuthEndpoint(roomId, sessionCookie);
        break;
      case REQUEST_TYPE.documentInputMedia:
        verificationResponse = await websiteApiClient.callDocumentInputAccessAuthEndpoint(documentInputId, sessionCookie);
        break;
      case REQUEST_TYPE.mediaTrash:
        verificationResponse = await websiteApiClient.callMediaTrashAccessAuthEndpoint(sessionCookie);
        break;
      default:
        throw new Error(`Unexpected request type: '${requestType}'`);
    }
  } catch (err) {
    logger.error(inspect(err));
    return callback(null, internalServerErrorResponse());
  }

  switch (verificationResponse.status) {
    case 200:
      // User is allowed to proceed, we return the original request
      return callback(null, request);
    case 401:
      // Unauthorized (in case the cookie is there but the session has already expired, re-login is required)
      return callback(null, loginRedirectResponse(request));
    case 403:
      // Forbidden (cookie is there but room access is denied)
      return callback(null, forbiddenResponse());
    default:
      // In all other cases we just return status 500
      return callback(null, internalServerErrorResponse());
  }
}
