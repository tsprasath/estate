var path = require("path")
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

var config = require('./webpack.base.config.js')

// Use webpack dev server
config.entry = [
    'react-hot-loader/patch',
    './estate/assets/js/index'
]

// override django's STATIC_URL for webpack bundles
config.output.publicPath = 'http://localhost:3000/assets/bundles/'

// Add HotModuleReplacementPlugin and BundleTracker plugins
config.plugins = config.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
])

// Add a loader for JSX files with react-hot enabled
config.module.loaders.push(
    { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader', query: { presets: ['react']} }
)

config.devServer = {
    host: '0.0.0.0',
    port: 3000,
    headers: { "Access-Control-Allow-Origin": "*" },
    publicPath: '/assets/bundles/',
    historyApiFallback: true,
    hot: true,
    inline: true,
}

module.exports = config
