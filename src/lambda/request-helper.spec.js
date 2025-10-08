import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeRequest, REQUEST_TYPE } from './request-helper.js';

const SESSION_COOKIE_VALUE = 's%3AIMb28VLUKex1w166';

function createLambdaRequest({ uri = '/', cookie = `SESSION_ID=${SESSION_COOKIE_VALUE}` }) {
  return {
    uri,
    headers: {
      cookie: cookie ? [{ key: 'Cookie', value: cookie }] : null
    }
  };
}

describe('request-helper', () => {

  describe('analyzeRequest', () => {

    describe('when there is no cookie set in the request', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({ cookie: null }));
      });
      it('should set the sessionCookie to null', () => {
        expect(result.sessionCookie).toBeNull();
      });
    });

    describe('when there is a session cookie set in the request', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({}));
      });
      it('should set the sessionCookie to the correct value', () => {
        expect(result.sessionCookie).toBe(SESSION_COOKIE_VALUE);
      });
    });

    describe('when the uri is a room media URL', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({ uri: '/room-media/abc/my-image.png' }));
      });
      it('should return requestType roomMedia', () => {
        expect(result.requestType).toBe(REQUEST_TYPE.roomMedia);
      });
      it('should return the correct roomId', () => {
        expect(result.roomId).toBe('abc');
      });
      it('should return documentInputId as null', () => {
        expect(result.documentInputId).toBeNull();
      });
    });

    describe('when the uri is a document input media URL', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({ uri: '/document-input-media/xyz/abc/my-image.png' }));
      });
      it('should return requestType documentInputMedia', () => {
        expect(result.requestType).toBe(REQUEST_TYPE.documentInputMedia);
      });
      it('should return the correct roomId', () => {
        expect(result.roomId).toBe('xyz');
      });
      it('should return the correct documentInputId', () => {
        expect(result.documentInputId).toBe('abc');
      });
    });

    describe('when the uri is a media trash URL', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({ uri: '/media-trash/my-image.png' }));
      });
      it('should return requestType mediaTrash', () => {
        expect(result.requestType).toBe(REQUEST_TYPE.mediaTrash);
      });
      it('should return roomId as null', () => {
        expect(result.roomId).toBeNull();
      });
      it('should return documentInputId as null', () => {
        expect(result.documentInputId).toBeNull();
      });
    });

    describe('when the uri does not match any known pattern', () => {
      let result;
      beforeEach(() => {
        result = analyzeRequest(createLambdaRequest({ uri: '/chambers/123/some-file.png' }));
      });
      it('should return requestType unknown', () => {
        expect(result.requestType).toBe(REQUEST_TYPE.unknown);
      });
      it('should return roomId as null', () => {
        expect(result.roomId).toBeNull();
      });
      it('should return documentInputId as null', () => {
        expect(result.documentInputId).toBeNull();
      });
    });

  });

});
