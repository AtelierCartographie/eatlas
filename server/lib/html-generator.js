const { parseDocx } = require('./docx-parser')
const cheerio = require('cheerio')

const generateTitle = doc => {
  const title = doc.nodes.find(n => n.type === 'title')
  // TODO date
  return `
    <header class="headerwrap">
        <div class="container header-info">
            <h1>${title.text}</h1>
            <p><em>Publié le <time datetime="2016-08-04">21 décembre 2016</em></p>
        </div>
    </header>`
}

const generateBreadcrumb = doc => {
  // TODO topic
  return `
    <section class="breadcrumb">
        <div class="container">
            <a href="#">(In)sécurités/Paix</a>
        </div>
    </section>`
}

const generateResume = doc => {
  const resume = doc.nodes.find(n => n.type === 'meta' && n.id === 'Résumé-FR')
  return `
    <section class="container resume">
        <div class="tab-content">
            <div role="tabpanel" class="tab-pane active" id="french" lang="fr" xml:lang="fr">
                <h2 class="line">Résumé</h2>
                <p>${resume.text}</p>
            </div>
            <div role="tabpanel" class="tab-pane" id="english" lang="en" xml:lang="en">
                <h2 class="line">Resume</h2>
                <p>Lorem ipsum dolor <strong>EN</strong> amet, consectetur adipiscing elit. Proin laoreet eu felis sit amet blandit. Fusce magna dui, lobortis in malesuada non, eleifend nec erat. Proin semper nulla lacus, non facilisis dolor tempus blandit. Duis in lectus eu quam pellentesque tincidunt id ac dolor. Aliquam scelerisque nunc sed nulla volutpat hendrerit.
                </p>
            </div>
        </div>
        <div class="resume-select">
            <ul class="nav nav-pills" role="tablist">
                <li role="presentation" class="active"><a href="#french" aria-controls="french" role="tab" data-toggle="pill" hreflang="fr">Fr</a></li>
                <li role="presentation"><a href="#english" aria-controls="english" role="tab" data-toggle="pill" hreflang="en">En</a></li>
            </ul>
        </div>
        <hr>
    </section>`
}

const generateDivContainer = container => {
  const parts = container.map(p => {
    switch (p.type) {
      // TODO fix h1 → h2 makes no sense!
      case 'h1':
        return `<h2>${p.text}</h2>`

      case 'p':
        return `<p>${p.text}</p>`
      default:
        return '<div>other</div>'
    }
  })

  return `<div class="container">${parts.join('\n')}</div>`
}

const generateFigureContainer = container => {
  return `
    <figure class="container">
      <h2 class="figure-title">${container[0].text}</h2>

      <picture>
          <!--[if IE 9]><video style="display: none;"><![endif]-->
          <source srcset="assets/figure/${container[0].id}-medium.png,
                    assets/figure/${container[0].id}-medium@2x.png 2x,
                    assets/figure/${
                      container[0].id
                    }-medium@3x.png 3x" media="(min-width: 560px)">
          <source srcset="assets/figure/${container[0].id}-small.png,
                    assets/figure/${container[0].id}-small@2x.png 2x,
                    assets/figure/${container[0].id}-small@3x.png 3x">
          <!--[if IE 9]></video><![endif]-->
          <img srcset="assets/figure/${container[0].id}-small.png,
                    assets/figure/${container[0].id}-small@2x.png 2x,
                    assets/figure/${
                      container[0].id
                    }-small@3x.png 3x" alt="Budget des opérations de paix de l’ONU" class="img-responsive">
      </picture>

      <figcaption>Source : <a href="http://www.un.org/en/peacekeeping/">Nations unies</a>, Département des opérations de maintien de la paix (DOMP).</figcaption>
      <a class="btn btn-figComment" role="button" data-toggle="collapse" href="#figComment-2" aria-expanded="false" aria-controls="figComment-2">
          Commentaire
      </a>
      <div class="collapse" id="figComment-2">
        <div class="figComment">
          Lorem ipsum dolor amet, consectetur adipiscing elit. Proin laoreet eu felis sit amet blandit. Fusce magna dui, lobortis in malesuada non, eleifend nec erat. Proin semper nulla lacus, non facilisis dolor tempus blandit. Duis in lectus eu quam pellentesque tincidunt id ac dolor. Aliquam scelerisque nunc sed nulla volutpat hendrerit. Maecenas condimentum convallis metus id rhoncus. Donec ut tortor quis nulla condimentum pretium. Integer venenatis, leo vel ullamcorper tempor, sem eros cras amet.
        </div>
      </div>
    </figure>`
}

const generateContainers = doc => {
  const containers = []
  let container = []
  doc.nodes.forEach(n => {
    if (n.type === 'h1' || n.type === 'resource') {
      containers.push(container)
      container = []
      container.type = n.type
    }
    container.push(n)
  })

  return containers
    .filter(c => c.type)
    .map(c => {
      switch (c.type) {
        case 'h1':
          return generateDivContainer(c)
        case 'resource':
          return generateFigureContainer(c)
      }
    })
    .join('\n')
}

const generateKeywords = doc => {
  const keywords = doc.nodes
    .find(n => n.id === 'Mots-clés')
    .list.map(kw => `<a href="#">${kw.text}</a>`)
  return `
    <section class="container article-keyword">
        <h2>Mots-clés</h2>
        <p>${keywords.join('\n')}</p>
    </section>`
}

const generateCitation = doc => {
  return `
    <section class="container article-quote">
        <h2>Citation</h2>
        <blockquote>
            <p>"Maintenir la paix", Atlas de la mondialisation, 2016 [en ligne], consulté le 07/12/2016, URL : http://sciencespo.fr/atlas-mondialisation/mobilites/maintenir-la-paix</p>
        </blockquote>
    </section>`
}

const generateNotes = doc => {
  const notes = doc.nodes
    .find(n => n.type === 'footnotes')
    .list.map(f => `<li>${f.text}</li>`)
  return `
    <section class="container article-ref">
        <h2>Notes</h2>
        <ul>${notes.join('\n')}</ul>
    </section>`
}

const generateSeeAlso = doc => {
  const seeAlsos = doc.nodes
    .find(n => n.id === "Continuer dans l'Atlas")
    .list.map(
      s =>
        `
      <div class="col-sm-6">
          <a href="#" class="thumbnail">
              <img src="assets/img/thumbnails-article1.svg" alt="...">
              <h3>${s.text}</h3>
          </a>
      </div>`,
    )
  return `
    <section class="container article-seealso">
        <h2>Continuer dans l'Atlas</h2>
        <div class="row">${seeAlsos.join('\n')}</div>
    </section>`
}

const generateFooter = doc => {
  const footer = [
    generateKeywords(doc),
    generateCitation(doc),
    generateNotes(doc),
    generateSeeAlso(doc),
  ]
  return `<footer class="footer-article">${footer.join('')}</footer>`
}

const generateArticle = doc => {
  const article = [
    generateTitle(doc),
    generateBreadcrumb(doc),
    generateResume(doc),
    generateContainers(doc),
    generateFooter(doc),
  ]
  return article.join('')
}

exports.generateHTML = async (docx, mockup) => {
  const doc = await parseDocx(docx)
  const $ = cheerio.load(mockup)
  $('article.article').html(generateArticle(doc))
  return $.html()
}
