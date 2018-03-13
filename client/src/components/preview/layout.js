// shared by Menu and Footer

const HOST = (exports.HOST = process.env.REACT_APP_PUBLIC_URL || '')

exports.getImageUrl = ({ images }, size = 'medium', density = '1x') => {
  const file = images && images[size] && images[size][density]
  return file
    ? `${HOST}${process.env.REACT_APP_PUBLIC_PATH_image || '/'}${file}`
    : null
}

exports.getResource = (resources, id) => resources.find(r => r.id === id)

exports.resourcesTypes = [
  'Cartes et diagrammes',
  'Photos et vidéos',
  'Focus',
  'Lexique',
  'Références',
]

exports.aPropos = [
  'Qui somme nous ?',
  'Nous contacter',
  'Mentions légales',
  'Plan du site',
]
