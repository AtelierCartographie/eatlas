'use strict'

const { writeFile } = require('fs-extra')
const { promisify } = require('util')
const path = require('path')
const babel = require('babel-core')

const compileJS = promisify(babel.transformFile)

const main = async () => {
  // Compile 'eatlas.js' into 'eatlas.es5.js'
  const pubDir = path.join(__dirname, '..', 'public')
  const source = path.resolve(pubDir, path.join('assets', 'js', 'eatlas.js'))
  const target = path.resolve(
    pubDir,
    path.join('assets', 'js', 'eatlas.es5.js'),
  )

  const options = {
    presets: [
      [
        'env',
        {
          targets: {
            browsers: ['last 2 versions', 'safari >= 7'],
          },
        },
      ],
    ],
  }
  const { code } = await compileJS(source, options)

  await writeFile(target, code)
  console.log('WRITE OK', target)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
