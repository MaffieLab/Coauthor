const path = require("path");

module.exports = {
  /* 
    Two bundles, because chrome extensions require
    content scripts and background scripts to be in 
    separate files
  */
  entry: {
    content: "./src/content.ts",
    background: "./src/services/background.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  watchOptions: {
    poll: true, // Check for changes every second
    ignored: /node_modules/,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    clean: true,
  },
};
