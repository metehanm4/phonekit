const path = require('path');
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './demo/app.js',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: 'true',
      __LOG_MODE__: JSON.stringify('human') // pretty
    })
  ],
  devServer: {
    static: { directory: path.join(__dirname, 'demo') },
    port: 3000, hot: true, open: true
  },
  output: { filename: 'bundle.js', path: path.resolve(__dirname, 'demo'), clean: true },
  module: { rules: [{ test: /\.m?js$/, exclude: /node_modules/, use: 'babel-loader' }] }
};
