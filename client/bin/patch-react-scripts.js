/**
 * - We want to customize non-configurable behaviors of create-react-app
 * - But we don't want to fork it
 * - We can't even monkey-patch modules, we *have* to modify them
 *
 * So this module will apply modifications to react-scripts *files* directly.
 *
 * - This is harmful, so it's only applied in dev environment
 * - This should not be kept indefinitely, one day we'll finally eject, and this
 *   day, this script will be useful as an index of all the changes to make
 *
 * Applied patches:
 *
 * - Disable 'watchContentBase' to avoid reload when adding a resource, messing with
 *   react-router redirections
 */
if (process.env.NODE_ENV === 'production') {
  console.log('[patch-react-scripts] Production: no patch applied')
  process.exit(0)
}

const { writeFileSync, readFileSync } = require('fs')

// Disable 'watchContentBase'
{
  console.log('[patch-react-scripts] Disabling watchContentBase…')
  const file = require.resolve('react-scripts/config/webpackDevServer.config')
  const js = readFileSync(file, 'utf8')
  const patched = js.replace(
    /(['"]?watchContentBase['"]?\s*:\s*)true/,
    '$1false',
  )
  writeFileSync(file, patched)
}
