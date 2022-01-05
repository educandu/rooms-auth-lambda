import { DISABLE_LOGGING } from './config.js';

const noop = () => {};

export const logger = DISABLE_LOGGING
  ? {
    log: noop,
    info: noop,
    warn: noop,
    error: noop
  }
  : console;
