var _ = require('underscore');
var cssnano = require('cssnano');

function OptimizeCssAssetsPlugin() {};

OptimizeCssAssetsPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, compileCallback) {
    
    console.log('');
    console.log('Starting to optimize CSS...');
    
    var cssFiles = _.filter(_.keys(compilation.assets), function(fn){ return fn && fn.match && fn.match(/\.css$/g); });
    
    var counter = 0;
    function checkFinish() {
      if (cssFiles.length >= counter++) {
        console.log('CSS optimize ended.');
        compileCallback();
      }
    };
    
    _.each(
      cssFiles,
      function(assetName) {
        console.log('Processing ' + assetName);
        var asset = compilation.assets[assetName];
        var originalCss = asset.source();
        cssnano.process(originalCss, {discardComments: {removeAll: true}}).then(
          function (result) {
            var processedCss = result.css;
            compilation.assets[assetName] = {
              source: function() {
                return processedCss;
              },
              size: function() {
                return processedCss.length;
              }
            };
            console.log('Processing ' + assetName + ' ended, before: ' + originalCss.length + ', after: ' + processedCss.length + ', ratio: ' + (Math.round(((processedCss.length * 100) / originalCss.length) * 100) / 100) + '%');
            checkFinish();
          }, function(err) {
            console.log('Error processing file: ' + assetName);
            console.log(err);
            checkFinish();
          }
        );
      }
    );
  });
};

module.exports = OptimizeCssAssetsPlugin;
