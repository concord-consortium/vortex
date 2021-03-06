'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  return {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'source-map',
    entry: {
      'lara-app': './src/lara-app/index.tsx',
      'mobile-app': './src/mobile-app/index.tsx',
      'sensor-demo': './src/sensor-demo/index.tsx',
      'shared': './src/shared/index.tsx',
      'authoring-app': './src/authoring-app/index.tsx'
    },
    mode: 'development',
    output: {
      filename: '[name]/assets/index.[hash].js'
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
        },
        {
          test: /^(?!.*module).*\.(sa|sc|c)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.module\.(sa|sc|c)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]-[local]-vortex'
                },
                sourceMap: true,
                importLoaders: 1
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|woff|woff2|eot|ttf)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: '../../'
          }
        },
        {
          test: /\.svg$/,
          oneOf: [
            {
              // Do not apply SVGR import in (S)CSS files.
              issuer: /\.scss$/,
              use: 'url-loader'
            },
            {
              issuer: /\.tsx?$/,
              loader: '@svgr/webpack'
            }
          ]
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
      new MiniCssExtractPlugin({
        filename: devMode ? "[name]/assets/index.css" : "[name]/assets/index.[hash].css"
      }),
      new HtmlWebpackPlugin({
        chunks: [],
        filename: 'index.html',
        template: 'src/index.html'
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
      new HtmlWebpackPlugin({
        chunks: ['sensor-demo'],
        filename: 'sensor-demo/index.html',
        template: 'src/sensor-demo/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['shared'],
        filename: 'shared/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['authoring-app'],
        filename: 'authoring-app/index.html',
        template: 'src/authoring-app/index.html'
      }),
      new CopyWebpackPlugin([
        {from: 'src/lara-app/public', to: 'lara-app/'}
      ]),
      new CopyWebpackPlugin([
        {from: 'src/mobile-app/public', to: 'mobile-app/'}
      ]),
      new CopyWebpackPlugin([
        {from: 'src/data', to: 'data/'}
      ]),
      new Dotenv()
    ]
  };
};
