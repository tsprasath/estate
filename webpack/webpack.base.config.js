var path = require("path")
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

module.exports = {
    context: path.dirname(__dirname),

    entry: './estate/assets/js/index',

    output: {
        path: path.resolve('./estate/assets/bundles/'),
        filename: "[name]-[hash].js"
    },

    plugins: [
        new BundleTracker({filename: './estate/assets/webpack-stats.json'}),
        //makes jQuery available in every module
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        })
    ], // add all common plugins here

    module: {
      loaders: [
            {
                test: /\.ico$/,
                loader: 'file-loader?name=[name].[ext]'  // <-- retain original file name
            },
            {
                test     : /\.css$/,
                loaders: ['style-loader', 'css-loader', 'resolve-url-loader']
            },
            {
                test     : /\.scss$/,
                loaders: ['style-loader', 'css-loader', 'resolve-url-loader', 'sass-loader?sourceMap']
            }
      ] // add all common loaders here
    },

    resolve: {
      extensions: ['.js', '.jsx'],
      modules: [path.join(path.dirname(__dirname), "node_modules")]
    },
}
