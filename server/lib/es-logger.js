const logger = require('./logger')

module.exports = class LogToBunyan {
  constructor() {
    this.logger = logger.child({ domain: 'elasticsearch' })
  }

  debug(...args) {
    this.logger.debug(...args)
  }

  info(...args) {
    this.logger.info(...args)
  }

  warning(...args) {
    this.logger.warn(...args)
  }

  error(...args) {
    this.logger.error(...args)
  }

  trace(method, requestUrl, body, responseBody, responseStatus) {
    this.logger.trace({
      method: method,
      requestUrl: requestUrl,
      body: body,
      responseBody: responseBody,
      responseStatus: responseStatus,
    })
  }

  close() {
    // bunyan's loggers do not need to be closed
  }
}
