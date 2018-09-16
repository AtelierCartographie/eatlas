# e-Atlas ‑ documentation technique

## Configuration

Note : La compréhension de [l'architecture technique du projet](./Architecture.md#architecture-technique) peut être utile pour distinguer front/back.

### Node (backoffice et api)

#### Emplacement et surcharge

La configuration du serveur se trouve dans le fichier `config/default.json`. Toutes les options peuvent être surchargé par un fichier dépendant de l'environnement :

- Variables d'environnements (voir le fichier `config/custom-environment-variables`, par exemple définir la variable d'environnement `REACT_APP_FRONT_URL` surcharge la valeur de `publicUrl`)
- Fichiers de configuration au format JSON ou JavaScript, nommés en fonction notamment de la variables d'environnement `NODE_ENV` (voir [Configuration files loading order](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order)), par exemple `config/production.json`

#### Principales options de configuration

```js
{
  /**********
   * Réseau *
   **********/

  // Adresse IP et port "bindés" sur le serveur HTTP
  "server": {
    "port": 4000,
    "host": "127.0.0.1"
  },

  // Configuration Elastic Search
  "es": {
    // Options de connexion passées au client Elastic Search
    // cf. https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html#config-options
    "connection": {
      "host": "localhost:9200"
    },
    // Index utilisés pour le stockage des données (un par type de données)
    // Note : cet index sera utilisé en tant qu'alias, l'index réel sera de la forme "<nom>_<timestamp>"
    "indices": {
      "user": "eatlas_user",
      "resource": "eatlas_resource",
      "topic": "eatlas_topic"
    },
    // "settings" par défaut passés aux index lors de leur création
    // cf. https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#create-index-settings
    "indexSettings": {},
    // Configuration de la mise à jour automatique des index au démarrage du serveur
    // Dans tous les cas l'index sera créé, mais lors d'une mise à jour de l'application
    // si un "mapping" a été modifié, le serveur essaiera de mettre à jour l'index (PUT mappings)
    // Si cela échoue, une migration complète (création d'un nouvel index + reindex) peut être lancée
    // Il est conseillé de désactiver cette option en production
    "autoMigration": true, // false pour désactiver la réindexation (dans ce cas les mises à jour de mappings devront être effectuées manuellement)
    "acceptObsoleteMapping": false // true pour laisser le serveur démarrer même si le mapping a été modifié (risque de dysfonctionnements !)
    // Nombre maximum d'écriture (update/insert) lancé en concurrence par la couche modèle
    "maxConcurrentWrites": 50
  },

  // Connexion à Redis (stockage des sessions)
  "redis": {
    "host": "localhost",
    "port": 6379
  },

  /*******************
   * Chemins et URLs *
   *******************/

  // URL of API, powered by Node server
  // In production it could be "http://prod-url/api"
  "apiUrl": "http://localhost:4000",

  // URL of public website
  "publicUrl": "http://localhost:3000",

  // Commande utilisée pour la copie des fichiers uploadés vers le dossier public: 'copy' ou 'symlink'
  "publishFileCommand": "copy",

  // Chemin dans lequel sont stockés les média uploadés (non publics)
  "uploadPath": "./data/uploads",

  // Faut-il conserver les média uploadés lorsqu'une ressource est supprimée ?
  "keepUploadsOnDelete": false,

  // Chemin racine du front-end
  "publicPath": "$clientPath/public/generated",
  "mediaSubPath": "media", // Sous-dossier dans lequel sont placés les média
  "mediaFileName": "$type-$id-$name.$ext", // Format des nom de fichier média
  // URLs des différentes pages du front-end
  "pageUrls": {
    "index": "index.html",
    "search": "recherche.html",
    "notFound": "not-found.html",
    "about": "a-propos.html",
    "legals": "mentions-legales.html",
    "sitemap": "plan-du-site.html",
    "topic": "rubrique-$topicSlug.html",
    "definition": "lexique.html",
    "article": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html",
    "focus": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html",
    "image": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html",
    "map": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html",
    "sound": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html",
    "video": "rubrique-$topicSlug/$typeLabel-$id-$resourceSlug.html"
  }

  /****************************
   * Paramètres du backoffice *
   ****************************/

  // Paramètres de session (maintien de l'authentification)
  "session": {
    "secret": "E-Atlas S3cr3T"
  },

  // Configuration des accès aux APIs Google
  "google": {
    // ID client pour appeler l'API de validation du token passé par le client
    "clientId": "see https://console.cloud.google.com/apis/credentials",
    // Endpoints de l'API Google Drive
    "exportUrl": "https://www.googleapis.com/drive/v3/files/FILE_ID/export?mimeType=FORMAT",
    "downloadUrl": "https://www.googleapis.com/drive/v3/files/FILE_ID?alt=media",
    // Pour chaque type de ressource, en fonction du type de contenu uploadé, faut-il déclencher un export ou un download?
    // Lister ici les content-types déclenchant un export (format Google)
    "exportTrigger": {
      "article": ["application/vnd.google-apps.document"],
      "focus": ["application/vnd.google-apps.document"],
      "definition": ["application/vnd.google-apps.document"]
    },
    // Si on déclenche un export, vers quel format exporter
    "exportFormat": {
      "article": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "focus": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "definition": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
  },

  /*******************************
   * Paramètres du serveur d'API *
   *******************************/

  // CORS : URLs des pages ayant le droit d'interroger le serveur d'API
  "cors": {
    "origins": [ "https://eatlas.com" ],
    // Autoriser l'absence du header "origin" (requis si les hostnames sont identiques)
    "allowNoOrigin": false
  },

  /********************************
   * Paramètrage des logs serveur *
   ********************************/

  // Voir le module `bunyan` pour les options disponibles
  "logger": {
    "name": "eatlas",
    "level": "info",
    "src": false
  },

  /**********************
   * Statistiques front *
   **********************/

  "analytics": {
    // Google Analytics tracker code, e.g. UA-XXXXX-Y
    "google": "UA-2835049-27"
  }

  /*****************************************
   * Configuration avancée de la recherche *
   *****************************************/

  // Full-text search fields, use dot for nested fields
  // Voir `docs/Data.md` pour les champs disponibles
  "searchFields": [
    "title",
    "subtitle",
    "description_fr",
    "description_en",
    "author",
    "metas.text",
    "nodes.links.text",
    "nodes.list.text",
    "nodes.list.list",
    "nodes.text"
  ],

  // Champs pour lesquels on stocke une version "search-friendly"
  // (pas d'accents, stop-words supprimés, etc…)
  // Ces champs sont dupliqués dans le modèle avec le suffixe "_clean"
  "cleanSearchFields": [
    "title",
    "subtitle",
    "description_fr",
    "description_en",
    "metas.text",
    "nodes.text"
  ],
  "cleanSearchFieldSuffix": "_clean",

  // Réglage de l'approximation
  // Voir https://www.elastic.co/guide/en/elasticsearch/guide/current/fuzziness.html",
  "searchFuzziness": "AUTO",

  // Paramètrage fin du score pour changer l'ordre des résultats
  // Voir `docs/comments/issue-79-comment-409548247.md
  "searchSort": {
    // Boost du score par type de ressource
    "boostType": {
      "single-definition": 20
    },
    // Boost appliqué à certains champs considérés plus importants
    "boostSearchField": {
      "title": 40,
      "description_fr": 10,
      "description_en": 10
    },
    // Score appliqué en fonction du filtre utilisé
    "scoreSpecial": {
      "keyword": 200
    }
  },

}
```

**Note :** l'emplacement du dossier de configuration peut être modifié à l'aide de la variable d'environnement `NODE_CONFIG_DIR` (absolu ou relatif au dossier `server`, par défaut `../config`).

Pour modifier cette configuration **ne pas modifier** `config/default.json` ni `config/production.json` mais plutôt créer un fichier `config/local.json` et y placer seulement les options surchargées.

Pour prendre en compte une modification de la configuration, le serveur doit être redémarré (tué puis relancé avec `yarn start`).

### Front (build du site)

La configuration dite "front" consiste en la configuration de la tâche de _build_ (utilisant webpack) générant les pages du site statique (voir [Régénération du site](./Rebuild.md#régénération-du-site)régénération-du-site)). Utilisant `create-react-app` la configuration ne peut être effectuée que par variables d'environnements :

- `REACT_APP_MOCK_API` : si `yes` alors le serveur d'API ne sera pas utilisé et les requêtes seront simulés à la place
- Les URLs (définies par le [serveur web proxy](./Architecture.md#architecture-réseau))
  - `REACT_APP_API_SERVER` : racine de l'URL du serveur d'API (le serveur Node, exemple : `http://localhost:4000` ou `https://api.eatlas`)
  - `REACT_APP_ADMIN_URL` : racine de l'URL du backoffice (exemple : `http://localhost:3000` ou `https://node.eatlas`)
  - `REACT_APP_FRONT_URL` : racine de l'URL du front (exemple : `http://localhost:3000/generated` ou `https://eatlas`)
- Les clés Google pour l'authentification :
  - `REACT_APP_GOOGLE_CLIENT_ID` : _client id_ de l'application Google créée (cf. section "Google" de cette documentation)
  - `REACT_APP_GOOGLE_DEV_KEY` : Clé d'API Google (cf. section "Google" de cette documentation)
- `REACT_APP_MEDIA_SUBPATH` : le dossier public où sont placés les média (exemple : `media` indiquant que l'URL `https://eatlas/media` doit répondre)
- `REACT_APP_RESOURCES_COLUMNS` : colonnes dans le backoffice de la page "ressources"
- `REACT_APP_PAGINATION_COUNT` : pagination dans le backoffice

Ces valeurs sont définies par défaut dans le fichier `client/.env`, pour les surcharger :

- Définissez les variables d'environnement correspondantes
- Ou créez le fichier `client/.env.local` avec les valeurs modifiées

### Docker

Lors d'une utilisation avec Docker et Docker-compose il faut placer des variables d'environnement dans le fichier `docker-config.env`:

```sh
cp docker-config.env.sample docker-config.env
```

La configuration des variables d'environnement se base sur le fichier `config/custom-environment-variables.json` qui utilise les variables d'environnement pour modifier la configuration par défaut de `config/default.json`.

Voir donc ce fichier pour la liste des variables utilisées.
On peut aussi mettre les variables d'environnement de la configuration du client.

La configuration du client est construite (`yarn build`) à chaque lancement du conteneur `backend`.

Pour vérifier la configuration:

```sh
docker-compose -f docker-compose.prod.yml config
```
