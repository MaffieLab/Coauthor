const path = require("path");
const { DefinePlugin } = require("webpack");
const dotenv = require("dotenv");

// Load env vars that should be present in the final build.
const publicEnvVars = dotenv.config({
  path: `.env.${process.env.NODE_ENV}.public`,
}).parsed;

// Load env vars that shouldn't be present in the final build but are required during the build process.
dotenv.config({ path: `.env.${process.env.NODE_ENV}.private` });

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
  plugins: [
    /**
     * This replaces all instances of 'process.env' in source code
     * with an object w/ environment variable key-value pairs. This means that
     * all environment variables in this object will be exposed to the client.
     * So it is VERY IMPORTANT that this object only contains
     * environment variables that you're okay with making public.
     *
     * An example of what you shouldn't do: doing JSON.stringify(process.env).
     * That will expose ALL environment variables of the system used to build the
     * app to the client. Obviously a bad idea!
     */
    new DefinePlugin({
      "process.env": JSON.stringify(publicEnvVars),
    }),
  ],
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
