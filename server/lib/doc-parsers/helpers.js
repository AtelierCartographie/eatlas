exports.isLexiconElement = el =>
  el.name.toLowerCase() === 'span' &&
  el.attribs.style.match(/color\s*:\s*(?:#ff0000|#f00|red)/i)

exports.getText = ($, el) =>
  $(el)
    .text()
    .trim()
