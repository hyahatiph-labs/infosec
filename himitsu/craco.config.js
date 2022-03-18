// craco.config.js
module.exports = {
  webpack: {
    configure: {
      output: {
        filename: 'static/js/[name].js',
      },
      optimization: {
        runtimeChunk: false,
        splitChunks: {
          // eslint-disable-next-line no-unused-vars
          chunks(_) {
            return false;
          },
        },
      },
    },
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // eslint-disable-next-line no-param-reassign
          webpackConfig.plugins[5].options.filename = 'static/css/[name].css';
          return webpackConfig;
        },
      },
      options: {},
    },
  ],
};
