const path = require("path");
const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/app.ts",
  target: "node",
  externals: [nodeExternals()], // node_modules 디렉토리의 모듈을 외부 모듈로 설정
  module: {
    rules: [
      {
        test: /\.tsx?$/, // TypeScript 파일에 대한 처리 규칙
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // 해석할 파일 확장자
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/views", to: "views" }, // views 폴더를 dist 폴더로 복사
      ],
    }),
  ],
};
