//@flow

export const getDefinition = (dt: string, definitions: ?Array<Definition>) => {
  const search = dt.toLowerCase()
  if (!definitions) {
    return null
  }
  const found = definitions.find(def => def.dt.toLowerCase() === search)
  return found && found.dd
}
