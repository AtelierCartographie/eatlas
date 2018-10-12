// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const h = require('react-hyperscript')
const { FormattedMessage: T, injectIntl } = require('react-intl')

const {
  PublishedAt,
  Paragraph,
  Keywords,
  Quote,
  Footnotes,
  Lexicon,
  exportLinks,
} = require('./Doc')
const Head = require('./Head')
const Body = require('./Body')
const {
  getImageUrl,
  getResourcePageUrl,
  getTopicPageUrl,
  articleHeaderImageUrl,
  prefixUrl,
} = require('./layout')
const { stripTags, topicName } = require('../../universal-utils')
const EmbeddedResource = require('./EmbeddedResource')
const Html = require('./Html')
const Summaries = require('./Summaries')
const { LangLink } = require('./LangSelector')

// subcomponents

const ArticleHeader = injectIntl(({ article, resources, intl, options }) => {
  const imageHeader = resources.find(r => r.id === article.imageHeader)
  const imageHeaderUrlL1 =
    imageHeader && getImageUrl(imageHeader, 'large', '1x', options)
  const imageHeaderUrlL2 =
    imageHeader && getImageUrl(imageHeader, 'large', '2x', options)
  const imageHeaderUrlL3 =
    imageHeader && getImageUrl(imageHeader, 'large', '3x', options)
  const imageHeaderUrlM1 =
    imageHeader && getImageUrl(imageHeader, 'medium', '1x', options)
  const imageHeaderUrlM2 =
    imageHeader && getImageUrl(imageHeader, 'medium', '2x', options)
  const imageHeaderUrlM3 =
    imageHeader && getImageUrl(imageHeader, 'medium', '3x', options)
  const imageHeaderUrlS1 =
    imageHeader && getImageUrl(imageHeader, 'small', '1x', options)
  const imageHeaderUrlS2 =
    imageHeader && getImageUrl(imageHeader, 'small', '2x', options)
  const imageHeaderUrlS3 =
    imageHeader && getImageUrl(imageHeader, 'small', '3x', options)

  const style = imageHeaderUrlS1
    ? {
        backgroundImage: `url(${imageHeaderUrlS1})`,
      }
    : {}

  return h('header.ArticleHeader', [
    h(
      Html,
      { component: 'script' },
      `
      function mediaSize() {
        var bgImg = new Image()
        var el = document.getElementsByClassName("ImageHeader")[0]
        var mql = [
          window.matchMedia('(min-width: 700px)'),
          window.matchMedia('(min-width: 560px) and (max-width: 700px)'),
          window.matchMedia('(max-width: 560px)'),
          window.matchMedia('(min-resolution: 3dppx), (-webkit-min-device-pixel-ratio: 3)'),
          window.matchMedia('(min-resolution: 2dppx), (-webkit-min-device-pixel-ratio: 2)'),
          window.matchMedia('(min-resolution: 1dppx), (-webkit-min-device-pixel-ratio: 1)'),
        ]
        switch (true) {
          case mql[0].matches && mql[3].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlL3})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlL3}';

            break;
          case mql[0].matches && mql[4].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlL2})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlL2}';

            break;
          case mql[0].matches && mql[5].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlL1})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlL1}';

            break;
          case mql[1].matches && mql[3].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlM3})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlM3}';

            break;
          case mql[1].matches && mql[4].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlM2})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlM2}';

            break;
          case mql[1].matches && mql[5].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlM1})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlM1}';

            break;
          case mql[2].matches && mql[3].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlS3})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlS3}';

            break;
          case mql[2].matches && mql[4].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlS2})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlS2}';

            break;
          case mql[2].matches && mql[5].matches:
            bgImg.onload = function(){
              el.style.backgroundImage = 'url(${imageHeaderUrlS1})';
              el.style.filter = 'none';
            };
            bgImg.src = '${imageHeaderUrlS1}';

            break;
        }
      }
      window.addEventListener('resize', mediaSize, false);
      document.addEventListener('DOMContentLoaded', mediaSize);
      `,
    ),
    h('.ImageHeader', { style }),
    h(
      '.container.ArticleHeaderInfo',
      { className: `title-position-${article.titlePosition}` },
      [
        h(Html, { component: 'h1.ArticleTitle' }, article.title),
        h(PublishedAt, { doc: article }),
      ],
    ),
    imageHeader &&
      (imageHeader.copyright || imageHeader.description_fr) &&
      h('.container.imageHeaderInfo', [
        h(
          'a',
          {
            href: `#comment`,
            'data-toggle': 'collapse',
            role: 'button',
            'aria-controls': 'comment',
            'aria-expanded': false,
            'aria-haspopup': true,
          },
          [
            h('img', {
              alt: intl.formatMessage({ id: 'doc.comment' }),
              width: 24,
              src: prefixUrl(`/assets/img/info.svg`, options.preview),
            }),
          ],
        ),
        h('.collapse', { id: 'comment' }, [
          h('div', {
            dangerouslySetInnerHTML: {
              __html: `${imageHeader.copyright} ${imageHeader.description_fr}`,
            },
          }),
        ]),
      ]),
  ])
})

const ArticleBreadcrumb = ({ article, topics, options, intl }) => {
  const topic = topics.find(x => x.id === article.topic)
  const otherLang = intl.lang === 'fr' ? 'en' : 'fr'
  const otherUrl = intl.urls[otherLang]
  return h('section.ArticleBreadcrumb', [
    h('.container', [
      h(
        'a.TopicLink',
        { href: getTopicPageUrl(topic, options) },
        topic ? `${topic.id}. ${topicName(topic, intl.lang)}` : article.topic,
      ),
      otherUrl &&
        h(LangLink, {
          intl,
          lang: otherLang,
          url: otherUrl,
          label: `common.article-version-lang.${otherLang}`,
        }),
    ]),
  ])
}

const ArticleNodes = ({ article, resources, lexiconId, options, topics }) => {
  return article.nodes.map(n => {
    switch (n.type) {
      case 'header':
        return h('h2.container.DocInterTitle', { key: n.id }, n.text)
      case 'p':
        return h(Paragraph, { p: n, key: n.id, lexiconId })
      case 'resource': {
        const resource = resources.find(r => r.id === n.id)
        return !resource
          ? null
          : h(EmbeddedResource, { resource, options, key: n.id })
      }
      default:
        return null
    }
  })
}

const ArticleSeeAlso = ({ article, topics, resources, options, title }) => {
  // used by SeeAlso
  const relateds =
    article.relatedResources || // Use directly 'relatedResources', e.g. provided by populateImageRelatedResources
    // otherwise, we need full resources to look into
    (article.related || [])
      .map(r => {
        const [articleId] = r.text.split(/\s*-\s*/)
        return resources.find(r => r.id === articleId)
      })
      .filter(a => !!a)

  if (!relateds || !relateds.length) return null

  return h('section.container.ArticleSeeAlso', [
    h('h2', {}, title || h(T, { id: 'doc.see-also-alt-title' })),
    h(
      'ul',
      relateds.map(r =>
        h('li', { key: r.id }, [
          h(
            'a',
            {
              href: getResourcePageUrl(r, options),
            },
            [
              r.imageHeader
                ? h('.imgSeeAlso', {
                    title: stripTags(r.title),
                    style: {
                      backgroundImage: articleHeaderImageUrl(r, options),
                    },
                  })
                : h(
                    '.imgSeeAlso',
                    {},
                    h(T, { id: `doc.type-plural.${r.type}` }),
                  ),
              h('div', [
                h(
                  '.ArticleSeeAlsoTopic',
                  (topics.find(t => t.id === r.topic) || {}).name,
                ),
                h(Html, { component: '.ArticleSeeAlsoTitle' }, r.title),
              ]),
            ],
          ),
        ]),
      ),
    ),
  ])
}

const ArticleFooter = ({ article, topics, resources, options }) =>
  h('footer.DocFooter', [
    h(Keywords, { keywords: article.keywords, options }),
    h(Quote, { doc: article, options }),
    h(Footnotes, {
      references: article.references,
      footnotes: article.footnotes,
    }),
    h(ArticleSeeAlso, { article, topics, resources, options }),
  ])

const Article = props =>
  h('article.article.ArticlePage', [
    h(ArticleHeader, props),
    h(ArticleBreadcrumb, props),
    h(Summaries, { doc: props.article }),
    h(ArticleNodes, props),
    h(ArticlePrevNextInline, props),
    h(ArticleFooter, props),
    h(Lexicon, {
      nodes: props.article.nodes,
      definitions: props.definitions,
      options: props.options,
    }),
  ])

// floating buttons on each side of the screen
const ArticlePrevNext = ({ prevNext: { prev, next }, options }) => {
  return [
    prev &&
      h('a.ArticlePrev', { href: getResourcePageUrl(prev, options) }, [
        h('span.ArticlePrevNextTopic', prev.topicName),
        h(Html, { component: 'span.ArticlePrevNextTitle' }, prev.title),
      ]),
    next &&
      h('a.ArticleNext', { href: getResourcePageUrl(next, options) }, [
        h('span.ArticlePrevNextTopic', next.topicName),
        h(Html, { component: 'span.ArticlePrevNextTitle' }, next.title),
      ]),
    // horrible pattern? yes? no? who knows?
    h(
      Html,
      { component: 'script' },
      `
window.addEventListener('DOMContentLoaded', () => {
  if (!window.IntersectionObserver) return
  const toggle = (sel, bool) => {
    const el = document.querySelector(sel)
    if (el) el.classList.toggle('hidden', bool)
  }
  const observer = new IntersectionObserver((entries) => {
    const hidden = entries[0].isIntersecting
    toggle('.ArticlePrev', hidden)
    toggle('.ArticleNext', hidden)
  })
  observer.observe(document.querySelector('.ArticleHeader'))
  observer.observe(document.querySelector('.DocFooter'))
})
`,
    ),
  ]
}

// these buttons appear just above the footer
const ArticlePrevNextInline = ({ prevNext: { prev, next }, options }) => {
  return h('.ArticlePrevNextInline.container', [
    prev &&
      h('.ArticlePrevWrapperInline', [
        h('a.ArticlePrevInline', { href: getResourcePageUrl(prev, options) }, [
          h('img', {
            alt: '',
            style: {
              backgroundImage: articleHeaderImageUrl(prev, options),
            },
          }),
          h('div', [
            h('.ArticlePrevNextTopicInline', prev.topicName),
            h('.ArticlePrevNextTitleInline', stripTags(prev.title)),
          ]),
        ]),
      ]),
    next &&
      h('.ArticleNextWrapperInline', [
        h('a.ArticleNextInline', { href: getResourcePageUrl(next, options) }, [
          h('div', [
            h('.ArticlePrevNextTopicInline', next.topicName),
            h('.ArticlePrevNextTitleInline', stripTags(next.title)),
          ]),
          h('img', {
            alt: '',
            style: {
              backgroundImage: articleHeaderImageUrl(next, options),
            },
          }),
        ]),
      ]),
  ])
}

// use *all* the articles of the site
const getPrevNextArticles = (article, articles, topics) => {
  if (!articles || !articles.length) return {}
  const currentIndex = articles.findIndex(a => a.id === article.id)
  const prevIndex = currentIndex !== 0 ? currentIndex - 1 : null
  const nextIndex =
    currentIndex !== articles.length - 1 ? currentIndex + 1 : null

  const prev = prevIndex !== null && articles[prevIndex]
  const next = nextIndex !== null && articles[nextIndex]

  if (prev) prev.topicName = (topics.find(t => t.id === prev.topic) || {}).name
  if (next) next.topicName = (topics.find(t => t.id === next.topic) || {}).name

  return { prev, next }
}

const ArticlePage = injectIntl((
  {
    article,
    articles,
    topics,
    definitions,
    resources,
    options,
    intl,
  } /*: {
  article: Resource,
  articles: Resource[],
  topics: Topic[],
  definitions: Definition[],
  resources: Resource[],
  options: FrontOptions,
} */,
) => {
  // passed by reference between paragraphs
  const lexiconId = {
    id: 0,
  }

  const prevNext = getPrevNextArticles(article, articles, topics)

  return h('html', { lang: intl.lang }, [
    h(Head, {
      title: stripTags(article.title),
      links: exportLinks({ doc: article, intl, options }),
      options,
    }),
    h(Body, { altTitle: stripTags(article.title), topics, options }, [
      h(Article, {
        article,
        prevNext,
        topics,
        definitions,
        resources,
        lexiconId,
        options,
        intl,
      }),
      h(ArticlePrevNext, { prevNext, options }),
    ]),
  ])
})

module.exports = ArticlePage
module.exports.ArticleSeeAlso = ArticleSeeAlso
