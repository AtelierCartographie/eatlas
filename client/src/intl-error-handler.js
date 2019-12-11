const cleanStack = string => {
  const lines = string.split(/[\r\n]+/)
  return lines
    .filter(
      s =>
        s &&
        (!s.match(/^\s*at /) ||
          (!s.match(/\/node_modules\//) && s.match(/\/src\//))),
    )
    .join('\n')
    .trim()
}

const debug = string => {
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(`\u001b[2m${string}\u001b[0m\n`)
  } else {
    console.debug(string) // eslint-disable-line no-console
  }
}

const error = string => {
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(`\u001b[31m${string}\u001b[0m\n`)
  } else {
    console.error(string) // eslint-disable-line no-console
  }
}

let ignoreNext = false

exports.intlErrorHandler = string => {
  if (ignoreNext) {
    ignoreNext = false
    return
  }
  if (/Cannot format XML message without DOMParser/.test(string)) {
    debug(cleanStack(string))
    ignoreNext = true
  } else {
    error(string)
  }
}
