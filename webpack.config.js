const path = require('path');

module.exports = {
  entry: {
    map: ['./www/js/map.js'],
    login: ['./www/js/login.js'],
    settings: ['./www/js/settings.js'],
    chat: ['./www/js/chat.js']
  },
  output: {
    filename: './www/js/dist/[name].bundle.js',
    path: path.resolve(__dirname, '')
  },
  node: {
    fs: 'empty',
    dgram: 'empty',
    net: 'empty',
    tls: 'empty',
    dns: 'empty',
  },
  mode: 'development'
};