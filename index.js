var LastCallWebpackPlugin = require('last-call-webpack-plugin');

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

  var self = this;
  this.lastCallInstance = new LastCallWebpackPlugin({
    assetProcessors: [
      {
        regExp: this.options.assetNameRegExp,
        processor: function (assetName, asset) {
          return self.processCss(assetName, asset);
        },
      }
    ],
    canPrint: this.options.canPrint
  });
};

OptimizeCssAssetsPlugin.prototype.processCss = function(assetName, asset) {
  var css = asset.source();
  return this.options
    .cssProcessor.process(css, Object.assign({ to: assetName }, this.options.cssProcessorOptions))
    .then(r => r.css);
};

OptimizeCssAssetsPlugin.prototype.apply = function(compiler) {
  return this.lastCallInstance.apply(compiler);
};

module.exports = OptimizeCssAssetsPlugin;
