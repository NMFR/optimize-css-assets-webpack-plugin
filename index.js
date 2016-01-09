var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var cssnano = require('cssnano');

function OptimizeCssAssetsPlugin() {};

OptimizeCssAssetsPlugin.prototype.apply = function(compiler) {
  compiler.plugin('after-emit', function (compilation, callback) {
    console.log('');
    console.log('Starting to optimize CSS...');
    var outputPath = compiler.options.output.path;
    var stats = compilation.getStats().toJson();
    var assetsByChunkName = stats.assetsByChunkName;
    var files = _.flatten(_.values(assetsByChunkName));
    var cssFiles = _.filter(files, function(fn){ return fn && fn.match && fn.match(/\.css$/g); });
    var counter = 0;
    function checkFinish() {
      if (cssFiles.length >= counter++) {
        console.log('CSS optimize ended.');
        callback();
      }
    };
    _.each(
      cssFiles, 
      function(filename) {
        console.log('Processing ' + filename);
        var filePath = path.join(outputPath,  filename);
        var css = fs.readFileSync(filePath, 'utf8');
        cssnano.process(css, {discardComments: {removeAll: true}}).then(
          function (result) {
            fs.writeFileSync(filePath, result.css);
            console.log('Processing ' + filename + ' ended');
            checkFinish();
          }, function(err) {
            console.log('Error processing file: ' + filename);
            console.log(err);
            checkFinish();
          }
        );
      }
    );
  });
};

module.exports = OptimizeCssAssetsPlugin;
