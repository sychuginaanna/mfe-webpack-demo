const fs = require("fs");
const path = require("path");
const values = require("lodash/values");
const uniq = require("lodash/uniq");
const flatten = require("lodash/flatten");
const fg = require("fast-glob");

const findImports = patterns => {
  let requiredModules = {};
  let filepaths = [];
  const addModule = (modulePath, value) => {
    if (value[0] !== "/" && value[0] !== ".") {
      requiredModules[modulePath].push(value);
    }
  };

  patterns = [].concat(patterns || []);
  patterns.forEach(pattern => {
    filepaths = filepaths.concat(fg.sync(pattern, { absolute: true }));
  });

  filepaths.forEach(filepath => {
    const stat = fs.statSync(filepath);
    if (!stat.isFile()) {
      return;
    }

    try {
      const result = fs.readFileSync(filepath, "utf-8");
      const modulePath = path.relative(process.cwd(), filepath);
      requiredModules[modulePath] = [];

      const patternImport = new RegExp(
        /import(?:["'\s]*([\w*${}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*[@\w_-]+)["'\s].*$/,
        "mg"
      );
      const patternDImport = new RegExp(
        /import\((?:["'\s]*\s*)?(.*([@\w_-]+))["'\s].*\);$/,
        "mg"
      );
      [...result.matchAll(patternImport)].map(([, , importModule]) => {
        addModule(modulePath, importModule);
      });
      [...result.matchAll(patternDImport)].map(([, importModule]) => {
        addModule(modulePath, importModule);
      });
    } catch (err) {
      console.error("Error in `" + modulePath + "`: " + err);
    }
  });

  return uniq(flatten(values(requiredModules)));
};

module.exports = findImports;
