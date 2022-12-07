export const WEBSITE_BASE_URL = process.env.WEBSITE_BASE_URL;
if (!WEBSITE_BASE_URL) {
  throw new Error('Environment variable WEBSITE_BASE_URL is not defined');
}

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME;
if (!SESSION_COOKIE_NAME) {
  throw new Error('Environment variable SESSION_COOKIE_NAME is not defined');
}

// The CDN is supposed to have the same protocol as the website!
export const CLOUDFRONT_PROTO = new URL(WEBSITE_BASE_URL).protocol;

export const DISABLE_LOGGING = process.env.DISABLE_LOGGING === true.toString();
