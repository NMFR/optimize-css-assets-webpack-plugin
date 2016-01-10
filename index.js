var _ = require('underscore');
var webpackSources = require('webpack-sources');

function OptimizeCssAssetsPlugin(options) {
  this.options = options || {};
  
  if (this.options.assetNameRegExp === undefined) {
    this.options.assetNameRegExp = /\.css$/g;
  }
  
  if (this.options.cssProcessor === undefined) {
    this.options.cssProcessor = require('cssnano');
  }
  
  if (this.options.cssProcessorOptions === undefined) {
    this.options.cssProcessorOptions = {};
  }
  
  if (this.options.canPrint === undefined) {
    this.options.canPrint = true;
  }
};

OptimizeCssAssetsPlugin.prototype.print = function() {
  if (this.options.canPrint) {
    console.log.apply(console, arguments);  
  }
};

OptimizeCssAssetsPlugin.prototype.processCss = function(css) {
  return this.options.cssProcessor.process(css, this.options.cssProcessorOptions); 
};

OptimizeCssAssetsPlugin.prototype.createCssAsset = function(css, originalAsset) {
  return new webpackSources.RawSource(css);
};

OptimizeCssAssetsPlugin.prototype.apply = function(compiler) {
  
  var self = this;
  
  compiler.plugin('emit', function(compilation, compileCallback) {
    
    self.print('\nStarting to optimize CSS...');
    
    var assets = compilation.assets;
    
    var cssAssetNames = _.filter(
      _.keys(assets), 
      function(assetName) { 
        return assetName.match(self.options.assetNameRegExp);
      }
    );
    
    var hasErrors = false;
    var promises = [];
    
    _.each(
      cssAssetNames,
      function(assetName) {
        
        self.print('Processing ' + assetName + '...');
        
        var asset = assets[assetName];
        
        var originalCss = asset.source();
        
        var promise = self.processCss(originalCss); 
        
        promise.then(
          function (result) {
            
            if (hasErrors) {
              self.print('Skiping ' + assetName + ' because of an error.');  
              return;
            }
            
            var processedCss = result.css;
            
            assets[assetName] = self.createCssAsset(processedCss, asset);
            
            self.print('Processed ' + assetName + ', before: ' + originalCss.length + ', after: ' + processedCss.length + ', ratio: ' + (Math.round(((processedCss.length * 100) / originalCss.length) * 100) / 100) + '%');
            
          }, function(err) {
            hasErrors = true;
            self.print('Error processing file: ' + assetName);
            console.error(err);
          }
        );
        
        promises.push(promise);
      }
    );
    
    Promise.all(promises).then(function () { compileCallback(); }, compileCallback);
  });
};

module.exports = OptimizeCssAssetsPlugin;
