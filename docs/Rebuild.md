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
- La [#copie-des-assets](copie des _media_ publiés) depuis le dossier d'upload vers le dossier public servi par un serveur web

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

## Copie des assets

Lors de la génération du site, les fichiers uploadés des ressources publiées sont copiés vers le dossier public.

Cela consiste en résumé à copier de `server/data/uploads` (dépend de [./Configuration.md](la configuration)) vers `client/public/generated/media` (idem) les fichiers `{map|image|sound}-{id}-*` si, et seulement si, la ressource `id` est publiée.

Cette copie peut être une copie réelle, ou un simple lien symbolique selon les options définies.

### Images « full »

Pour répondre à [une demande spécifique](https://github.com/AtelierCartographie/eatlas/issues/157) un procédé a été mis en place pour personnaliser le fichier téléchargé dans la page ressource d'une image ou d'une carte. Ce procédé est pour le moment manuel, voici la marche à suivre :

- Créer la ressource de type carte ou image (par exemple "0C02")
- Avant ou après publication de cette ressources, poser des fichiers dans le dossier d'upload du serveur (dépend de [./Configuration.md](la configuration), par défaut `server/data/uploads`) suivant une nomenclature de nommage précise :
  - Format général : `{type}-{id}-{taille}-full-{densité}.{extension}`
  - Le type est `map` ou `image` selon le type de ressource
  - L'id est l'identifiant (casse non modifiée) de la ressource
  - La taille et la densité sont les tailles et densités (non modifiées) de la ressource
  - L'extension est l'extension de fichier normalisée (**attention** l'upload d'un fichier `.jpg` générera un fichier `.jpeg` par exemple)
  - **Vérifier le nom de la ressource créée par le serveur pour se baser dessus**, par exemple :
    - je sélectionne `0C02-large@3x.jpg` dans Google Drive
    - le serveur crée un fichier `map-0C02-large-3x.jpeg` dans le dossier d'upload
    - je dois donc déposer un fichier `map-0C02-large-full-3x.jpeg` à côté
  - Un set d'images d'exemple est disponible au téléchargement : [./images/exemple-nommage-images-full.tgz](exemple-nommage-images-full.tgz)
- Lors de la prochaine génération du site les versions "full" seront copiées
- Dans la fiche de ressource, les fichiers de haute densité sont proposés au téléchargement, et c'est la version "full" qui est pointée si elle a été déposée
