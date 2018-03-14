//@flow
// Utils used server-side or client-side, marked as "universal"
// They're all aliased in "utils" for client-side
// "preview" components must require "universal-utils" and not "utils"

exports.getDefinition = (
  dt /*: string*/,
  definitions /*: ?Array<Definition>*/,
) /*: string*/ => {
  const search = dt.toLowerCase()
  if (!definitions) {
    return null
  }
  const found = definitions.find(def => {
    if (def.dt.toLowerCase() === search) {
      // matches main definition
      return true
    }
    if (def.aliases && def.aliases.length) {
      // search in aliases
      return def.aliases.some(alias => alias.toLowerCase() === search)
    }
    return false
  })
  return found && found.dd
}
