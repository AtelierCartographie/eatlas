# eatlas

## Dépendances

* Docker
* Temporaire (sera inclus dans Docker à terme) :
  * Node
  * Yarn

## Configuration

### Client (généré)

Le côté client est configuré à l'aide de variables d'environnement :

* ``REACT_APP_MOCK_API`` : si ``yes`` alors le serveur d'API ne sera pas utilisé et les requêtes seront simulés à la place
* ``REACT_APP_API_SERVER`` : racine de l'URL du serveur d'API (exemple : ``https://api.eatlas.com``)
* ``REACT_APP_GOOGLE_CLIENT_ID`` : *client id* de l'application Google créée (cf. section "Google" de cette documentation)
* ``REACT_APP_GOOGLE_PROJECT_NUM`` : Numéro de l'application Google créée (cf. section "Google" de cette documentation)
* ``REACT_APP_GOOGLE_DEV_KEY`` : Clé d'API Google (cf. section "Google" de cette documentation)

**Attention** si un fichier ``.env`` est présent, il définit des valeurs par défaut pour ces variables d'environnement (actuellement utilisées pour le développement).

Pour prendre en compte une modification de la configuration, le client doit être régénéré avec ``yarn build`` et re-déployé.

### Serveur (fichier)

Le côté serveur est configuré à l'aide de fichiers, dans le dossier ``/config``, au format JSON. Voici les options commentées :

```js
{
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
      "resource": "eatlas_resource"
    },
    // "settings" par défaut passés aux index lors de leur création
    // cf. https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#create-index-settings
    "indexSettings": {},
    // Configuration de la mise à jour automatique des index au démarrage du serveur
    // Dans tous les cas l'index sera créé, mais lors d'une mise à jour de l'application
    // si un "mapping" a été modifié, le serveur essaiera de mettre à jour l'index (PUT mappings)
    // Si cela échoue, une migration complète (création d'un nouvel index + reindex) peut être lancée
    "autoMigration": true, // false pour désactiver la réindexation (dans ce cas les mises à jour de mappings devront être effectuées manuellement)
    "acceptObsoleteMapping": false // true pour laisser le serveur démarrer même si le mapping a été modifié (risque de dysfonctionnements !)
  },
  // Paramètres de session
  "session": {
    "secret": "E-Atlas S3cr3T"
  },
  // Connexion à Redis (stockage des sessions)
  "redis": {
    "host": "localhost",
    "port": 6379
  },
  // CORS : URLs des pages ayant le droit d'interroger le serveur d'API
  "cors": {
    "origins": [ "https://eatlas.com" ]
  },
  // Configuration des accès aux APIs Google
  "google": {
    "clientId": "see https://console.cloud.google.com/apis/credentials", // Pour valider le token passé après authentification côté client
    "exportUrl": "https://www.googleapis.com/drive/v3/files/FILE_ID/export?mimeType=FORMAT", // Endpoint de l'API Google Drive
    "exportFormat": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // Format d'export pour les articles
  }
}
```

Pour modifier cette configuration **ne pas modifier** ``default.json`` ni ``production.json`` mais plutôt créer un fichier ``local.json`` et y placer seulement les options surchargées.

Pour prendre en compte une modification de la configuration, le serveur doit être redémarré (tué puis relancé avec ``yarn start``).

### Création du premier compte admin

Une fois l'application configurée, les services démarrés, il faut au moins un utilisateur pour pouvoir commencer à administrer l'application. L'ajout du tout premier utilisateur se fait en ligne de commande :

```sh
yarn add-user "user@gmail.com" "Nom Complet" admin
```

On peut dès lors se connecter avec ce compte et effectuer tout le reste depuis l'interface Web.

## Dév

```sh
yarn install
yarn dev
```

* Environnement de dév React
* Serveur en mode "watch"
* Container Docker Elastic Search

Note : l'environnement de dév de React vide la console à chaque rebuild, ça peut être pénible pour suivre l'output du serveur. Si ça devient gênant, utiliser deux terminaux :

```sh
# Terminal 1 (client)
cd client && yarn start
# Terminal 2 (serveur)
cd server && yarn dev
```

### Elastic Search

* Le container est nommé "eatlas_es_dev"
* Pour le démarrer manuellement : ``docker-compose -f docker-compose.dev.yml up``
* Pour consulter les logs : ``docker logs eatlas_es_dev``

## Prod

**ATTENTION** : instructions temporaires, la livraison finale sera basée sur Docker et la seule commande ``docker-compose -f docker-compose.prod.yml up`` sera suffisante.

```sh
yarn install --prod
```

### Client

* Configurer le client par variables d'environnement (voir le fichier ``.env`` pour les valeurs par défaut)
  * **TODO** utiliser plutôt le dossier `config/`
* Préparer les fichiers scripts & assets : ``yarn build``
* Placer les fichiers dans le document root de nginx

### Serveur

* Configurer le serveur (fichier ``config/local.json`` écrasant ``config/default.json`` et ``config.production.json``)
* Lancer la base de données Elastic Search : ``docker-compose -f docker-compose.prod.yml up``
* Lancer le serveur ``NODE_CONFIG_DIR=/path/to/config/ yarn start``

## Maintenance

### Sauvegarde des données Docker

* Les données sont dans un volume Docker (voir le nom du volume dans le fichier ``docker-compose.{dev,prod}.yml``)
* Sauvegarde du volume : utiliser ``docker volume inspect <nom du volume>`` pour récupérer le "mountpoint", c'est le dossier à sauvegarder
  * Exemple en une commande avec `tar` et `jq` : ``sudo tar zcvf backup.tgz $(docker volume inspect eatlas_esdata_dev | jq -r '.[0].Mountpoint')``

### Suppression

* Arrêt avec suppression des images : ``docker-compose -f <fichier.yml> down --rmi all``
* Arrêt avec suppression des images **et des données** : ``docker-compose -f <fichier.yml> down --rmi all --volumes``

## Google

L'application nécessite une connexion via Google OAuth et l'accès à Google Drive, il faut donc créer une application Google avec les bons paramètres :

* Créer une application sur https://console.developers.google.com
* Menu burger → APIs & Services → Credentials → créer un nouveau projet :
  * Configurer "REACT_APP_GOOGLE_CLIENT_ID" à la valeur du "client id"
* Menu burger → APIs & Services → Library → activer les APIs suivantes :
  * Google Picker API
* Menu burger → IAM & administration → Paramètres → relever le n° du projet
