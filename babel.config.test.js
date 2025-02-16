// This config is only used for testing
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      allowNamespaces: true,
      allowDeclareFields: true,
      onlyRemoveTypeImports: true,
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-object-rest-spread'
  ]
}; 