const path = require('path')

const LastCallWebpackPlugin = require('last-call-webpack-plugin');

class OptimizeCssAssetsWebpackPlugin extends LastCallWebpackPlugin {
  constructor(options) {
    super({
      assetProcessors: [
        {
          phase: LastCallWebpackPlugin.PHASES.OPTIMIZE_CHUNK_ASSETS,
          regExp: (options && options.assetNameRegExp) || /\.css(\?.*)?$/i,
          processor: (assetName, asset, assets) =>
            this.processCss(assetName, asset, assets),
        }
      ],
      canPrint: options && options.canPrint,
    });

    this.options.assetNameRegExp = !options || !options.assetNameRegExp ?
      /\.css(\?.*)?$/i :
      options.assetNameRegExp;
    this.options.cssProcessor = !options || !options.cssProcessor ?
        require('cssnano') :
        options.cssProcessor;
    this.options.cssProcessorOptions = !options || options.cssProcessorOptions === undefined ?
      {} :
      options.cssProcessorOptions;
    this.options.cssProcessorPluginOptions = !options || options.cssProcessorPluginOptions === undefined ?
      {} :
      options.cssProcessorPluginOptions;
  }

  buildPluginDescriptor() {
    return { name: 'OptimizeCssAssetsWebpackPlugin' };
  }

  processCss(assetName, asset, assets) {
    let filename = assetName;
    let query = '';
    const idx = filename.indexOf('?');
    if (idx >= 0) {
        query = filename.substr(idx);
        filename = filename.substr(0, idx);
    }
    const assetInfo = {
      path: filename,
      query: query,
    };

    const css = asset.sourceAndMap ? asset.sourceAndMap() : { source: asset.source() };
    const processOptions = Object.assign(
      { from: assetName, to: assetName },
      this.options.cssProcessorOptions
    );

    if (processOptions.map && !processOptions.map.prev) {
      try {
        let map = css.map;
        if (!map) {
          const mapJson = assets.getAsset(`${assetInfo.path}.map`);
          if (mapJson) {
            map = JSON.parse(mapJson);
          }
        }
        if (
          map &&
          (
            (map.sources && map.sources.length > 0) ||
            (map.mappings && map.mappings.length > 0)
          )
        ) {
          processOptions.map = Object.assign({ prev: map }, processOptions.map);
        }
      } catch (err) {
        console.warn('OptimizeCssAssetsPlugin.processCss() Error getting previous source map', err);
      }
    }
    return this.options
      .cssProcessor.process(css.source, processOptions, this.options.cssProcessorPluginOptions)
      .then(r => {
        if (processOptions.map && r.map && r.map.toString) {
          let filename = `${assetInfo.path}.map${assetInfo.query}`
          if (processOptions.getFileName) {
            filename = processOptions.getFileName(assetInfo)
          }
          assets.setAsset(filename, r.map.toString());

          if (processOptions.append !== false) { // true or undefined
            let reletivePath = path.relative(path.dirname(assetName), filename).replace(/\\/g, '/')
            r.css += `\n/*# sourceMappingURL=${reletivePath}*/`
          }
        }
        return r.css;
      });
  }
}

module.exports = OptimizeCssAssetsWebpackPlugin;
