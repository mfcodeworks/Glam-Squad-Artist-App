module.exports = {
  test    : /\.(js)$/,
  exclude : /(node_modules|bower_components|build|dist\/)/,
  use     : ['babel-loader'],
};
