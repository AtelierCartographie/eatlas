//@flow

// cf. https://github.com/yahoo/react-intl/wiki/API

type IntlConfig = {
  locale: string,
  formats: Object,
  messages: { [id: string]: string },

  defaultLocale: string,
  defaultFormats: Object,
}

type MessageDescriptor = {
  id: string,
  defaultMessage?: string,
  description?: string | Object,
}

type IntlFormat = {
  formatDate: (value: any, options?: Object) => string,
  formatTime: (value: any, options?: Object) => string,
  formatRelative: (value: any, options?: Object) => string,
  formatNumber: (value: any, options?: Object) => string,
  formatPlural: (value: any, options?: Object) => string,
  formatMessage: (
    messageDescriptor: MessageDescriptor,
    values?: Object,
  ) => string,
  formatHTMLMessage: (
    messageDescriptor: MessageDescriptor,
    values?: Object,
  ) => string,
}

declare type ContextIntl = {
  intl: IntlConfig & IntlFormat & { now: () => number },
}
