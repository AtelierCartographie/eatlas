# e-Atlas ‑ documentation technique

## Les URLs

La problématique des URLs est plus complexe qu'on peut l'imaginer, la principale difficulté vient des contraintes posées aux composants *preview* :

- Les mêmes composants servent à la _preview_ et au _front_ (quelque soit le futur du projet, ce choix est à conserver car la garantie que le rendu final sera identique à la preview est indispensable)
- Les URLs en _preview_ et en _front_ sont très différentes (par exemple `https://backend/preview/resources/6A42` deviendra `https://eatlas/rubrique-6/article-6A42-guerre-et-paix.html`)
- Les composants _preview_ n'ont pas accès aux modules serveur

## Génération

- Les ressources (article, focus, vidéo, son, carte, image) ont une propriété ajoutée `pageUrl`, qui a été générée par le serveur avant de passer les ressource au composant React
  - Voir fonction `populatePageUrl` dans `generator-utils.js`
- Les pages du footer sont listées via les propriétés `aPropos` (du module `layout.js`) et `footerResourcesConfig` (du module `universal-utils.js`), listant des objets avec la méthode `url({ preview })` retournant l'URL de la page en question
- Pour les quelques autres liens, il s'agit de pages globales ou des rubriques, on utilise alors l'une des deux méthodes de `layout.js` :
  - `getTopicPageUrl` pour le lien vers une page rubrique
  - `globalPageUrl` pour le lien vers une page globale

Exemples :

```js
// Lien vers une page article
h('a', { href: article.pageUrl });

// Lien vers la rubrique 3
h('a', { href: getTopicPageUrl(topic, props.options) });

// Lien vers les mentions légales
h('a', { href: globalPageUrl('legals')(props.options) });

// Lien vers une ancre de la page à propos
h('a', { href: globalPageUrl('about', null, 'team')(props.options) });
```
