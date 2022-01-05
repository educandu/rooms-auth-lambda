export default {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test-setup.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/[^/]\\.js',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dev/',
    '<rootDir>/dist/',
    '<rootDir>/pack/',
    '<rootDir>/src/dev-server/',
    '<rootDir>/src/test-setup\\.js',
    '<rootDir>/src/lambda/website-api-client\\.js'
  ]
};
