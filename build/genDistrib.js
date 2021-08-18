"use strict";

// import * as Fs from "fs";
// import * as FsPromises from "fs/promises";
// import * as StreamPromises from "stream/promises";
// import * as Path from "path";
// import * as Yazl from "yazl";
const Fs = require("fs");
const FsPromises = require("fs/promises");
const StreamPromises = require("stream/promises");
const Path = require("path");
const Yazl = require("yazl");

// Returns file paths relative to the specified directory.
async function listDirRecursive (rootDirPath) {
   const a = [];
   await listDir("");
   return a;
   async function listDir (subDirPath) {
      const dirPath = Path.join(rootDirPath, subDirPath);
      const dir = await FsPromises.opendir(dirPath);
      for await (const de of dir) {
         const subPath = Path.join(subDirPath, de.name);
         if (de.isFile()) {
            a.push(subPath); }
          else if (de.isDirectory()) {
            await listDir(subPath); }}}}
      // dir is closed automatically.

async function addDirectory (zip, dirPath, zipDirPath) {
   const files = await listDirRecursive(dirPath);
   for (const filePath of files) {
      zip.addFile(Path.join(dirPath, filePath), Path.join(zipDirPath, filePath)); }}

async function main() {
   const outputFileStream = Fs.createWriteStream("dist.zip")
   const zip = new Yazl.ZipFile();
   zip.addFile("src/giessereigoogle.xml", "giessereigoogle.xml");
   await addDirectory(zip, "src/admin", "admin");
   await addDirectory(zip, "src/site", "site");
   zip.addFile("tempBuild/distrib/app.js", "site/app.js");
   zip.end();
   await StreamPromises.pipeline(zip.outputStream, outputFileStream); }

main();
