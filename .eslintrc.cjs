module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    'digitalbazaar',
    'digitalbazaar/jsdoc',
    'digitalbazaar/module'
  ],
  ignorePatterns: ['node_modules/'],
  rules: {
    'unicorn/prefer-node-protocol': 'error'
  }
};
