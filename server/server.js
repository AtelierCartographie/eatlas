const { server: { host, port } } = require('config')

require('http').createServer((req, res) => res.end('Coucou')).listen(port, host, () => console.log(`Server ready: http://${host}:${port}`))
