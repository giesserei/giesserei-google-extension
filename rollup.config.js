import resolve from "@rollup/plugin-node-resolve";

export default {
   input: "tempBuild/js/Main.js",
   output: {
      file: "tempBuild/distrib/app.js",
      format: "iife"
   },
   plugins: [
      resolve({
//       mainFields: ["jsnext:main", "module"]             // required for current "Moment" package
      })
   ]
};
