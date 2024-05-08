const nodeResolve = require("@rollup/plugin-node-resolve");

module.exports = {
   input: "tempBuild/js/Main.js",
   output: {
      file: "tempBuild/distrib/app.js",
      format: "iife" },
   plugins: [
      nodeResolve() ]};
