// deps normalizer

process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';

const fs = require('fs');
const pkg = require('../package.json');
const findImports = require('./findImports');
const globby = require('globby');
const orderBy = require('lodash/orderBy');

fs.writeFileSync(
  '.babelrc',
  JSON.stringify({
    presets: ['babel-preset-react-app']
  })
);

main().catch(err => {
  console.error(err);
  process.exit(1);
});

async function main() {
  const workspaces = flattenWorkspaces(pkg.workspaces);

  for (const workspace of workspaces) {
    const path = `${workspace}/src/**/*.{js,jsx}`;
    const res =findImports(path);
    const deps = res.reduce((acc, _path) => {
      const path =
        _path[0] === '@'
          ? _path
              .split('/')
              .slice(0, 2)
              .join('/')
          : _path.split('/')[0];
      if (!acc.includes(path)) {
        acc.push(path);
      }

      return acc;
    }, []);

    const pkgPath = `${workspace}/package.json`;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

     deps.reduce((acc, dep) => {
      if (pkg.dependencies[dep]) {
        acc[dep] = pkg.dependencies[dep];
      } else {
        console.log(`${dep} is missing in ${pkg.name}`);
      }

      return acc;
    }, {});
  }

  function flattenWorkspaces(workspaces) {
    return workspaces.reduce((acc, curr) => {
      if (curr.includes('*')) {
        acc.push(...globby.sync(curr, { onlyDirectories: true }));
      } else {
        acc.push(curr);
      }

      return acc;
    }, []);
  }
}
