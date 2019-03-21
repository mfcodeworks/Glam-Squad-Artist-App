const loaders = [
  {
    loader: 'file-loader',
    options: {
      outputPath: 'assets',
    },
  },
];

module.exports = {
  test    : /\.(png|gif|jpg)$/i,
  exclude : /(node_modules)/,
  use     : loaders,
};
