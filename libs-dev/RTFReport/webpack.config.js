var webpack = require('webpack');

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: {
    'RTFReport': './RTFReport.js',
    'RTFReport.min': './RTFReport.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
    })
  ],
  devServer: {
    inline:true,
    port: 10000,
  },
};
