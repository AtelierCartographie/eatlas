# eatlas

**Note :** toutes les commandes indiquées dans ce document sont prévues pour être exécutées depuis la racine du projet, sauf mention contraire (sous la forme `cd server && …`).

## Dépendances

* Docker
* Temporaire (sera inclus dans Docker à terme) :
  * Node
  * Yarn

## Configuration

### Client (généré)

Le côté client est configuré à l'aide de variables d'environnement :

* `REACT_APP_MOCK_API` : si `yes` alors le serveur d'API ne sera pas utilisé et les requêtes seront simulés à la place
* `REACT_APP_API_SERVER` : racine de l'URL du serveur d'API (exemple : `https://api.eatlas.com`)
* `REACT_APP_GOOGLE_CLIENT_ID` : _client id_ de l'application Google créée (cf. section "Google" de cette documentation)
* `REACT_APP_GOOGLE_DEV_KEY` : Clé d'API Google (cf. section "Google" de cette documentation)

**Attention** si un fichier `client/.env` est présent, il définit des valeurs par défaut pour ces variables d'environnement (actuellement utilisées pour le développement).
Ce fichier est lu par [create-react-app](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-development-environment-variables-in-env)
(lui même se basant sur [dotenv](https://github.com/motdotla/dotenv)).

Pour prendre en compte une modification de la configuration, le client doit être régénéré avec `yarn build` et re-déployé.

### Serveur (fichier)

Le côté serveur est configuré à l'aide de fichiers, dans le dossier `config`, au format JSON. Voici les options commentées :

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

**Note :** l'emplacement du dossier de configuration peut être modifié à l'aide de la variable d'environnement `NODE_CONFIG_DIR` (absolu ou relatif au dossier `server`, par défaut `../config`).

Pour modifier cette configuration **ne pas modifier** `config/default.json` ni `config/production.json` mais plutôt créer un fichier `config/local.json` et y placer seulement les options surchargées.

Pour prendre en compte une modification de la configuration, le serveur doit être redémarré (tué puis relancé avec `yarn start`).

### Docker

Lors d'une utilisation avec Docker et Docker-compose il faut placer des variables d'environnement dans le fichier `docker-config.env`:

```sh
cp docker-config.env.sample docker-config.env
```

La configuration des variables d'environnement se base sur le fichier `config/custom-environment-variables.json` qui utilise les variables d'environnement pour modifier la configuration par défaut de `config/default.json`.

Voir donc ce fichier pour la liste des variables utilisées.
On peut aussi mettre les variables d'environnement de la configuration du client.

La confirguration du client est construite (`yarn build`) à chaque lancement du conteneur `api`.

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
yarn dev:client
# Terminal 2 (serveur)
yarn dev:server
```

### Elastic Search

* Le container est nommé "eatlas_es_dev"
* Pour le démarrer manuellement : `docker-compose -f docker-compose.dev.yml up`
* Pour consulter les logs : `docker logs eatlas_es_dev`

## Prod

La production tourne dans des conteneurs Docker orchestrés par le fichier `docker-compose.prod.yml`.
Des images sont construites directements via le Docker Hub lors d'un évènement `push` sur le dépôt Git:
Client: https://hub.docker.com/r/sciencespo/eatlas-client/
API: https://hub.docker.com/r/sciencespo/eatlas-api/

### Code

Télécharger le code source de ce dépôt Git:

```bash
git clone https://github.com/AtelierCartographie/eatlas.git eatlas
cd eatlas
```

### Configuration

Copiez l'exemple de configuration et éditez le selon vos besoins:

```sh
cp docker-config.env.sample docker-config.env
```

Pour vérifier la configuration:

```sh
docker-compose -f docker-compose.prod.yml config
```

### Preparer les images Docker

Deux options: soit télécharger la dernière version depuis le Docker Hub, ou construire ses propres images.

* **Recommandé: Télécharger** nos images déjà construites depuis le Docker Hub:

  ```sh
  docker-compose -f docker-compose.prod.yml pull
  ```

* **Alternative: Construire** vos propres images à partir du code source (utile pour du développent ou si vous éditez le code):

  ```sh
  docker-compose -f docker-compose.prod.yml build
  ```

### Démarrer eAtlas

On peut alors démarrer l'application avec la commande:

```sh
docker-compose -f docker-compose.prod.yml up
```

La même chose mais en lancant les conteneurs en tâche de fond:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Troubleshooting

| Problème                                                    | Solution(s)                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Erreur de connexion “Not a valid origin for the client […]” | Aller configurer la clé d'API Google                                                                                                      |
| Impossible de se connecter après l'installation             | Il manque sûrement l'utilisateur initial :<br>`docker exec eatlas_api_1 yarn add-user <email> <name> admin`                               |
| Les pages semblent charger indéfiniment                     | - Regarder dans les logs de l'API : `docker logs eatlas_api_1`                                                                            |
|                                                             | - En cas d'erreur "CORS", en production il doit pouvoir être désactivé, vérifier la présence de `CORS_ALLOW_NO_ORIGIN=1` dans `docker-config.env` |
| Vérifier la configuration du serveur node                   | `docker exec eatlas_api_1 node -p "require('config')"`                                                                                    |

### Arrêt et journaux

Pour arrêter les conteneurs, utilisez `docker-composen -f docker-compose.prod.yml stop` (ou `docker-compose -f docker-compose.prod.yml down -v` pour détruire les conteneurs et les données).

Pour voir les logs utilisez la commande `docker-compose -f docker-compose.prod.yml logs`.

Lorsque vous modifiez la configuration, relancez les conteneurs:

```bash
docker-compose -f docker-compose.prod.yml stop
docker-compose -f docker-compose.prod.yml up -d
```

## Maintenance

### Supprimer un index Elastic Search

* Trouver le nom réel de l'index s'il est aliasé :

```sh
# Retourne un JSON: la clé est le nom de l'index réel
curl -XGET 'localhost:9200/eatlas_resource/_alias'
# {"eatlas_resource_1512598117510":{"aliases":{"eatlas_resource":{}}}}
```

* Supprimer l'index réel

```sh
curl -XDELETE 'localhost:9200/eatlas_resource_1512597721716'
# {"acknowledged":true}
```

### Sauvegarde des données Docker

* Les données sont dans un volume Docker (voir le nom du volume dans le fichier `docker-compose.{dev,prod}.yml`)
* Sauvegarde du volume : utiliser `docker volume inspect <nom du volume>` pour récupérer le "mountpoint", c'est le dossier à sauvegarder
  * Exemple en une commande avec `tar` et `jq` : `sudo tar zcvf backup.tgz $(docker volume inspect eatlas_esdata_dev | jq -r '.[0].Mountpoint')`

### Suppression

* Arrêt avec suppression des images : `docker-compose -f <fichier.yml> down --rmi all`
* Arrêt avec suppression des images **et des données** : `docker-compose -f <fichier.yml> down --rmi all --volumes`

### First install on localhost

* Ouvrir une console
* Se placer à l'endroit où on veut enregistrer le projet

`> cd /go/to/the/right/folder`

* Cloner le projet depuis le repo Github

`> git clone https://github.com/AtelierCartographie/eatlas.git`

* Aller à la racine du projet

`> cd eatlas/`

* Si nécessaire, installer [Homebrew](https://brew.sh/index_fr.html)
* Si nécessaire, installer yarn

`> brew install yarn`

* Installer les dépendances du projet

`> yarn install`

* Lancer le projet

`> yarn dev`

Un nouvel onglet présentant le projet doit alors s'ouvrir dans votre navigateur.

### Google

L'application nécessite une connexion via Google OAuth et l'accès à Google Drive, il faut donc créer une application Google avec les bons paramètres :

* Créer une application sur https://console.developers.google.com
* Menu burger → APIs & Services → Credentials → créer un nouveau projet :
  * Create credentials > OAuth client ID > Copier la clé d'API
  * Configurer "REACT_APP_GOOGLE_CLIENT_ID" à la valeur du "client id"
* Menu burger → APIs & Services → Library → activer les APIs suivantes :
  * Google Picker API
  * Google Drive API
* Menu buger → APIs & Services → Credentials → créer une nouvelle clé d'API :
  * Configurer "REACT_APP_GOOGLE_DEV_KEY" à la valeur de la clé
  * Réstreindre la clé aux API "Google Picker" et "Google Drive"

### Participants

* Delphine Lereculeur - delphine.lereculeur@sciencespo.fr (chef de projet)
* Anne Lhote - anne.lhote@sciencespo.fr (développement)
* Thomas Ansart - thomas.ansart@sciencespo.fr (carto)
* Atelier de carto - carto@sciencespo.fr
* Nicolas Chambrier - naholyr@gmail.com
* Bruno Héridet - delapouite@gmail.com
* Thomas Moyse - tmoyse@gmail.com
