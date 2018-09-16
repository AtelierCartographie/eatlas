# e-Atlas ‑ documentation technique

Note : voir [la configuration](./Configuration.md#configuration) et [l'architecture](./Architecture.md#architecture-technique) pour complément d'information.

## Régénération du site

La régénération du site _front_ consiste en :

- La compilation des assets _front_ (aujourd'hui ça consiste uniquement en la transpilation de `client/public/assets/js/eatlas.js` en `client/public/assets/js/eatlas.es5.js` qui sera inclus dans le HTML du _front_)
- La génération de toutes les pages HTML (voire [l'option `pageUrls`](./Configuration.md#configuration)) :
  - Les pages "fixes" : la _home_, la recherche, la page "à propos", mentions légales, etc…
  - La page lexique complet
  - Une page par article, focus, carte, son, vidéo…
  - Une page par rubrique
- La copie des _media_ publiés depuis le dossier d'upload vers le dossier public servi par un serveur web

Le point d'entrée de ce processus est `server/lib/site-builder.js` faisant appel aux générateurs déclarés dans `server/lib/html-generator.js`.

### Régénération automatique

Le _front_ est automatiquement reconstruit lors de la publication ou de la dépublication d'une ressource.

### Régénération manuelle

Le script `rebuild-site` permet de lancer une génération complète du _front_, manuellement :

```sh
yarn rebuild-site
```

ou avec Docker:

```sh
docker-compose -f docker-compose.prod.yml exec backend node ./bin/rebuild-site
```
