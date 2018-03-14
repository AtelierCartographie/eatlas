// @flow

// components shared by ArticlePage and FocusPage

const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

exports.PublishedAt = ({ doc }) =>
  !doc.publishedAt
    ? h('.PublishedAt', 'Non publié')
    : h('.PublishedAt', [
        'Publié le ',
        h(
          'time',
          { dateTime: doc.publishedAt },
          moment(doc.publishedAt).format('D MMMM YYYY'),
        ),
      ])
