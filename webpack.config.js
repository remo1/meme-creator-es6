/**
 * Environment variables used in this configuration:
 * NODE_ENV
 * CONSTANT_VALUE
 */

require('dotenv').config()
const webpack = require('webpack');
const glob = require('glob');
const PurifyCSSPlugin = require('purifycss-webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');

const isProduction = (process.env.NODE_ENV === 'production');

const fileNamePrefix = isProduction ? '[chunkhash].' : '';

const extractLess = new ExtractTextPlugin({
    filename: "[name].css",
});

const pathsToClean = [
    'dist'
];

const cleanOptions = {
    root: __dirname,
    verbose: true,
    dry: false,
    exclude: [],
};


module.exports = {
    context: __dirname,
    entry: {
        general: './src/js/general.js',
        memes: './src/js/memes.js'
    },
    output: {
        path: __dirname + "/dist",
        filename: fileNamePrefix + '[name].js',
        publicPath: '/dist/'
    },
    devServer: {
        compress: true,
        port: 8080,
        hot: true,
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'es2015'],
                    }
                }
            },
            {
                test: /\.(svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'fonts/[name].[ext]'
                }
            },
            {
                test: /\.(png|jpg|gif)$/,
                loaders: [{
                        loader: 'url-loader',
                        options: {
                            limit: 10000,
                            name: 'images/[name].[ext]'
                        }
                    },
                    'img-loader'
                ],
            },
            {
                test: /\.(less|css)$/,
                use: extractLess.extract({
                    use: [{
                            loader: 'css-loader',
                            options: {
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'less-loader',
                            options: {
                                sourceMap: true
                            }
                        }
                    ],
                    fallback: 'style-loader',
                })
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery'
        }),
        new webpack.DefinePlugin({
            ENVIRONMENT: JSON.stringify(process.env.NODE_ENV),
            CONSTANT_VALUE: JSON.stringify(process.env.CONSTANT_VALUE),
        }),
        extractLess,
        new PurifyCSSPlugin({
            paths: glob.sync(__dirname + '/*.html'),
            minimize: true,
        }),
        function () {
            this.plugin("done", function (status) {
                require("fs").writeFileSync(
                    __dirname + "/dist/manifest.json",
                    JSON.stringify(status.toJson().assetsByChunkName)
                );
            });
        }
    ],
}

if (!isProduction) {
    module.exports.plugins.push(
        new webpack.HotModuleReplacementPlugin() // HMR plugin will cause problems with [chunkhash]
    );
}

if (isProduction) {
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true // use false if you want to disable source maps in production
        }),
        function () { // Create a manifest.json file that contain the hashed file names of generated static resources
            this.plugin("done", function (status) {
                require("fs").writeFileSync(
                    __dirname + "/dist/manifest.json",
                    JSON.stringify(status.toJson().assetsByChunkName)
                );
            });
        },
        new CleanWebpackPlugin(pathsToClean, cleanOptions)
    );
}