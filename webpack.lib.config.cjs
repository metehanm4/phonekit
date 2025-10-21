const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const isProd = process.env.NODE_ENV === 'production';
const list = (process.env.ADAPTERS || 'webrtc').split(',').map(s => s.trim().toUpperCase());
const flags = { WEBRTC: list.includes('WEBRTC'), JANUS: list.includes('JANUS'), MEDIASOUP: list.includes('MEDIASOUP'), SIP: list.includes('SIP') };

const common = {
  entry: { phone: './src/index.js' },
  module: { rules: [{ test: /\.m?js$/, exclude: /node_modules/, use: 'babel-loader' }] },
  plugins: [new webpack.DefinePlugin({ ADAPTERS: JSON.stringify(flags) })],
  optimization: { minimize: true, minimizer: [new TerserPlugin({ extractComments: false })], usedExports: true }
};

const umd = {
  ...common, mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'phone.umd.js', library: { name: 'Phone', type: 'umd' }, clean: true },
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      ADAPTERS: JSON.stringify(flags),
      __DEV__: 'false',
      __LOG_MODE__: JSON.stringify('json')   // prod: JSON (kolay parse)
    })
  ]
};

const esm = {
  ...common, mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  experiments: { outputModule: true },
  output: { path: path.resolve(__dirname, 'dist'), filename: 'phone.esm.js', library: { type: 'module' } },
  devtool: 'source-map'
};

module.exports = [umd, esm];
