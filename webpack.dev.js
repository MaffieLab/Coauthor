const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

const plugins = [];

if (process.env.UPLOAD_SOURCEMAPS === "true") {
  plugins.push(
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "michael-maffie",
      project: "coauthor-extension",
    })
  );
}

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  plugins: plugins,
});
