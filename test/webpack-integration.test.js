/* eslint-disable import/no-dynamic-require, global-require */
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

const cases = process.env.CASES ? process.env.CASES.split(',') : fs.readdirSync(path.join(__dirname, 'cases'));

describe('Webpack Integration Tests', () => {
  cases.forEach((testCase) => {
    if (/_skip_/.test(testCase)) return;
    it(testCase, (done) => {
      const testDirectory = path.join(__dirname, 'cases', testCase);
      const outputDirectory = path.join(__dirname, 'js', testCase);
      const expectedDirectory = path.join(testDirectory, 'expected');

      const configFile = path.join(testDirectory, 'webpack.config.js');
      const config = Object.assign(
        fs.existsSync(configFile) ? require(configFile) : { entry: { test: './index.js' } },
        {
          context: testDirectory,
          output: {
            filename: '[name].js',
            path: outputDirectory
          }
        }
      );

      webpack(config, (err, stats) => {
        if (err) return done(err);
        if (stats.hasErrors()) return done(new Error(stats.toString()));
        fs.readdirSync(expectedDirectory).forEach((file) => {
          const expectedFile = readFileOrEmpty(path.join(expectedDirectory, file));
          const actualFile = readFileOrEmpty(path.join(outputDirectory, file));
          expect(actualFile).toEqual(expectedFile);
          expect(actualFile).toMatchSnapshot();
        });
        done();
      });
    });
  });
});

function readFileOrEmpty(path) {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch (e) {
    return '';
  }
}
