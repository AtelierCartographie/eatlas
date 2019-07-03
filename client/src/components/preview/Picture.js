// @flow

const h = require('react-hyperscript')

const { getImageUrl } = require('./layout')

const srcset = (image, size, options) => {
  const image1 = getImageUrl(image, size, '1x', options)
  const image2 = getImageUrl(image, size, '2x', options)
  const image3 = getImageUrl(image, size, '3x', options)
  if (!image1 && !image2 && !image3) {
    if (options.fallback) {
      return (
        srcset(image, 'large', { ...options, fallback: false }) ||
        srcset(image, 'medium', { ...options, fallback: false }) ||
        srcset(image, 'small', { ...options, fallback: false })
      )
    }
    return null
  }
  const srcSet = [
    ...(image1 ? [image1] : []),
    ...(image2 ? [`${image2} 2x`] : []),
    ...(image3 ? [`${image3} 3x`] : []),
  ].join(', ')
  return options.includeSrc
    ? { src: image1 || image2 || image3, srcSet }
    : { srcSet }
}

const Picture = ({
  resource,
  options,
  main: { component, size, props },
  sources = [],
}) => {
  const srcSet = srcset(resource, size, {
    ...options,
    fallback: true,
    includeSrc: component === 'img',
  })
  return h('picture', [
    ...sources.map(({ size, minWidth }, key) => {
      const srcSet = srcset(resource, size, options)
      if (!srcSet) {
        return null
      }
      const more = {
        media: minWidth ? `(min-width: ${minWidth})` : '(min-width: 0)',
      }
      return h('source', { key, ...srcSet, ...more })
    }),
    h(component, {
      ...props,
      key: 'maincomponent',
      ...(srcSet || {}),
    }),
  ])
}

const defaultSources = [
  { size: 'large', minWidth: '700px' },
  { size: 'medium', minWidth: '560px' },
  { size: 'small', minWidth: 0 },
]

const ResponsivePicture = ({
  resource,
  options,
  mainSize,
  sources = defaultSources,
  alt = '',
}) =>
  Picture({
    resource,
    options,
    main: {
      component: 'img',
      size: mainSize,
      props: {
        className: 'img-responsive center-block',
        alt,
      },
    },
    sources,
  })

Picture.Responsive = ResponsivePicture
module.exports = Picture
