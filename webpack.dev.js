const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const plugins = [
  // Copies manifest.json into /build every build
  new CopyPlugin({
    patterns: [
      { from: "./src/manifest.json", to: "./manifest.json" },
      { from: "./src/ui" },
      { from: "./src/assets", to: "./assets" },
    ],
  }),
  new webpack.NormalModuleReplacementPlugin(/src[\\\/]env.ts/, "./env.dev.ts"),
];

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
