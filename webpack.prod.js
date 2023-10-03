const { merge } = require("webpack-merge");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const common = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /src[\\\/]env.ts/,
      "./env.prod.ts"
    ),
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "michael-maffie",
      project: "coauthor-extension",
    }),
  ],
});
