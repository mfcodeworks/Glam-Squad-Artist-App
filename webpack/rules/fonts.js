const loaders = [
    {
        loader: 'file-loader',
    },
];

module.exports = {
    test: /\.(eot|ttf|svg|woff|woff2)(\?\S*)?$/,
    use     : loaders,
};
