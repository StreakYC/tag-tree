module.exports = {
  parser: 'babel-eslint',
  env: {
    jest: true,
    node: true,
    es6: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    },
    sourceType: 'module'
  },
  plugins: ['flowtype'],
  rules: {
    'flowtype/define-flow-type': 1,
    'flowtype/require-valid-file-annotation': ['error', 'always'],

    'linebreak-style': ['error', 'unix'],
    semi: ['error', 'always'],
    'no-var': ['error'],
    'brace-style': ['error']
  }
};
