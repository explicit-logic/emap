const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

const outputDirectory = '/dist';
module.exports = {
  entry: {
    index: ['babel-polyfill', './src/js/index.js']
  },
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      }
    ],
    devServer: {
      port: 3000,
      open: true,
      // proxy: {
      //   '/api': 'http://localhost:8080'
      // }
    },
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/templates/index.html",
      filename: "./dist/index.html"
    })
  ]
};