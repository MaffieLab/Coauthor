const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
    // Copies manifest.json into /build every build
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json", to: "./manifest.json" },
        { from: "./src/ui" },
        { from: "./src/assets", to: "./assets" },
      ],
    }),
    new webpack.NormalModuleReplacementPlugin(
      /src[\\\/]env.ts/,
      "./env.dev.ts"
    ),
  ],
});
