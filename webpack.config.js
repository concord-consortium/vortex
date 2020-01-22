'use strict';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  return {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'source-map',
    entry: {
      'lara-app': './src/lara-app/index.tsx',
      'mobile-app': './src/mobile-app/index.tsx'
    },
    mode: 'development',
    output: {
      filename: '[name]/assets/index.[hash].js',
      publicPath: "../" // <-- this is a hack to get the injected js/css paths pointing to the correct folder, need to fix probably when wrapping mobile app
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          enforce: 'pre',
          use: [
            {
              loader: 'tslint-loader',
              options: {}
            }
          ]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true // IMPORTANT! use transpileOnly mode to speed-up compilation
          }
        },
        {
          test: /\.(sa|sc|c)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loader: 'url-loader',
          options: {
            limit: 8192
          }
        }
      ]
    },
    resolve: {
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: devMode ? "[name]/assets/index.css" : "[name]/assets/index.[hash].css"
      }),
      new HtmlWebpackPlugin({
        chunks: ['lara-app'],
        filename: 'lara-app/index.html',
        template: 'src/lara-app/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['mobile-app'],
        filename: 'mobile-app/index.html',
        template: 'src/mobile-app/index.html'
      }),
      // note: this next html file is only created on build, the dev-server doesn't copy it
      new HtmlWebpackPlugin({
        chunks: [],
        filename: 'index.html',
        template: 'src/index.html'
      }),
      new CopyWebpackPlugin([
        {from: 'src/lara-app/public', to: 'lara-app/'}
      ]),
      new CopyWebpackPlugin([
        {from: 'src/mobile-app/public', to: 'mobile-app/'}
      ])
    ]
  };
};
