var webpack = require('webpack')

var config = require('./webpack.base.config.js')

config.plugins = config.plugins.concat([
  // keeps hashes consistent between compilations
  new webpack.optimize.OccurrenceOrderPlugin(),
])

// Add a loader for JSX files
config.module.loaders.push(
  { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
)

module.exports = config
