const fs = require('fs');
const path = require('path');
const difference = require('lodash/difference');
const values = require('lodash/values');
const uniq = require('lodash/uniq');
const flatten = require('lodash/flatten');
const babel = require('@babel/core');
const glob = require('glob');
const resolveGlob = require('./resolve-glob');

let babelOptions = {};
try {
    babelOptions = JSON.parse(fs.readFileSync('.babelrc', 'utf-8'));
} catch (err) {
   console.log(err)
}

const findImports = function(patterns) {
    let requiredModules = {};
    let filepaths = [];
    let addModule = function(modulePath, value) {
      if (value[0] !== '/' && value[0] !== '.') {
        requiredModules[modulePath].push(value);
      }
    };
        let positives = [];
        let negatives = [];

        patterns = [].concat(patterns || []);
        patterns.forEach(function(pattern) {
            // Make a glob pattern absolute
            pattern = resolveGlob(pattern);

            if (pattern.charAt(0) === '!') {
                negatives = negatives.concat(glob.sync(pattern.slice(1)));
            } else {
                positives = positives.concat(glob.sync(pattern));
            }
        });

    filepaths = difference(positives, negatives);
    filepaths.forEach(function(filepath) {
        const stat = fs.statSync(filepath);
        if (!stat.isFile()) {
            return;
        }

        try {
            const result = babel.transformFileSync(filepath, babelOptions);
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
            [...result.code.matchAll(patternImport)].map(([, , importModule]) => {
              addModule(modulePath, importModule);
            });
           [...result.code.matchAll(patternDImport)].map(([, importModule]) => {
              addModule(modulePath, importModule);
            })

        } catch (e) {
            console.error('Error in `' + modulePath + '`: ' + e);
        }
    });

    return uniq(flatten(values(requiredModules)));
};

module.exports = findImports;
