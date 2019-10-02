const { getBabelLoader } = require('customize-cra')

module.exports = {
  webpack(config, env) {
    getBabelLoader(config).options.sourceType = 'unambiguous'
    return config
  },

  devServer(configFunction) {
    return (proxy, allowedHosts) => {
      const config = configFunction(proxy, allowedHosts)

      // Disable 'watchContentBase' to avoid reload when adding a resource, messing with react-router redirections
      config.watchContentBase = false

      return config
    }
  },
}
