require("dotenv").config();

const path = require("path");
const appIndex = path.resolve(__dirname, "src", "index.tsx");
const ManifestPlugin = require("webpack-manifest-plugin");

function getClientEnv(nodeEnv) {
  return {
    "process.env": JSON.stringify(
      Object.keys(process.env)
        .filter((key) => /^REACT_APP/i.test(key))
        .reduce(
          (env, key) => {
            env[key] = process.env[key];
            return env;
          },
          { NODE_ENV: nodeEnv }
        )
    ),
  };
}

module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const clientEnv = getClientEnv(webpackEnv);
  return {
    mode: webpackEnv,
    entry: appIndex,
    output: {
      path: appBuild,
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : isEnvDevelopment && "static/js/bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            "cache-loader",
            {
              loader: "ts-loader",
              options: {
                transpileOnly: isEnvDevelopment ? true : false,
              },
            },
          ],
        },
        {
          loader: "file-loader",
          exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
          options: {
            outputPath: "static/media",
            name: "[name].[hash:8].[ext]",
            esModule: false,
          },
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: "url-loader",
          options: {
            limit: 10000,
            outputPath: "static/media",
            name: "[name].[hash:8].[ext]",
          },
        },
        {
          test: /\.(ts|tsx)$/,
          enforce: "pre",
          exclude: /node_modules/,
          loader: "eslint-loader",
          options: {
            cache: true,
            formatter: isEnvDevelopment
              ? "codeframe"
              : isEnvProduction && "stylish",
          },
          include: appSrc,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: appHtml }),
      new webpack.DefinePlugin(clientEnv),
      new ManifestPlugin({
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce(
            (manifest, { name, path }) => ({ ...manifest, [name]: path }),
            seed
          );
          const entryFiles = entrypoints.main.filter(
            (filename) => !/\.map/.test(filename)
          );
          return { files: manifestFiles, entrypoints: entryFiles };
        },
      }),
    ],
  };
};
