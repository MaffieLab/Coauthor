const { merge } = require("webpack-merge");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("./webpack.common.js");
const webpack = require("webpack");

function modify(buffer) {
  // copy-webpack-plugin passes a buffer
  var manifest = JSON.parse(buffer.toString());

  // Remove any host permissions not required in production
  manifest.host_permissions = [`${process.env.API_BASE_URL}/*`];

  // pretty print to JSON with two spaces
  manifest_JSON = JSON.stringify(manifest, null, 2);
  return manifest_JSON;
}

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
    new CopyPlugin({
      patterns: [
        {
          from: "./src/manifest.json",
          to: "./manifest.json",
          transform(content, path) {
            return modify(content);
          },
        },
        { from: "./src/ui" },
        { from: "./src/assets", to: "./assets" },
      ],
    }),
  ],
});
