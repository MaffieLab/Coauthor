const path = require("path");
const { DefinePlugin } = require("webpack");
const dotenv = require("dotenv");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");

// Load env vars that should be present in the final build.
const publicEnvVars = dotenv.config({
  path: `.env.${process.env.NODE_ENV}.public`,
}).parsed;

// Load env vars that shouldn't be present in the final build but are required during the build process.
dotenv.config({ path: `.env.${process.env.NODE_ENV}.private` });

const outputDir = path.resolve(__dirname, "build");

class BuildManifestPlugin {
  constructor() {}

  apply(compiler) {
    compiler.hooks.done.tap("BuildManifestPlugin", () => {
      const outputFile = path.resolve(outputDir, "manifest.json");

      const manifest = JSON.stringify(
        {
          manifest_version: 3,
          name: "Coauthor",
          version: JSON.parse(fs.readFileSync("./package.json")).version,
          icons: {
            128: "assets/icon128.png",
          },
          content_scripts: [
            {
              matches: ["https://mc.manuscriptcentral.com/*"],
              run_at: "document_end",
              js: ["content.js"],
            },
          ],
          background: {
            service_worker: "background.js",
          },
          action: {
            default_popup: "./ui.html",
          },
          web_accessible_resources: [
            {
              resources: ["*.map", "assets/*.*"],
              matches: ["<all_urls>"],
            },
          ],
          description:
            "Share your manuscript submission experiences and help increase transparency in academic publishing!",
          permissions: ["identity"],
          host_permissions: [`${process.env.API_BASE_URL}/*`],
          key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5EaziQp8N+0QkocGKkfq/AK6AgFpeGtJ+lblHfx3dqFpauY1z3himuj3y7j+jLLsQJdgOvDpzkleD5uB0uzN77tCixdt/7k509nKp/E9XCnFeFRPGC2GTnPndFqesjzvRHdxTlX3dHDTTkvHt1mpo/TXwVkkXtJvcG/ZCZTQFcw2/M7TeYr9iXbM0gcZc8OdwcPehDb+x6p1Spu6SyCiiYCfktMI8tKjSbp+bH/JRa+2iublrazzTkCx+bDvBM9N8AlmYaMVsgiqoaBWheb2bKkBVU91Q78QOMcwAXt1qpqFDcv0rtvsbDS6qcnwJTH/vxwOI6Zkr6kvEa2rt4+gBwIDAQAB",
        },
        null,
        2
      );

      fs.writeFileSync(outputFile, manifest);
    });
  }
}

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
    new BuildManifestPlugin(), // builds the manifest
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

    new CopyPlugin({
      patterns: [
        { from: "./src/ui" },
        { from: "./src/assets", to: "./assets" },
      ],
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
    path: outputDir,
    clean: true,
  },
};
