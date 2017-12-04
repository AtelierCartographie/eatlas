# eatlas

## Dév

```sh
npm i
npm run dev
```

* Environnement de dév React
* Serveur en mode "watch"
* Container Docker Elastic Search

Note : l'environnement de dév de React vide la console à chaque rebuild, ça peut être pénible pour suivre l'output du serveur. Si ça devient gênant, utiliser deux terminaux :

```sh
# Terminal 1 (client)
cd client && npm start
# Terminal 2 (serveur)
cd server && npm run dev
```

### Elastic Search

* Le container est nommé "eatlas_es"
* Pour le démarrer manuellement : ``docker-compose -f docker-compose.dev.yml up``
* Pour consulter les logs : ``docker logs eatlas_es``

## Prod

**ATTENTION** : instructions temporaires, la livraison finale sera basée sur Docker et la seule commande ``docker-compose -f docker-compose.prod.yml up`` sera suffisante.

```sh
npm i --production
```

### Client

* Préparer les fichiers scripts & assets : ``npm run build``
* Placer les fichiers dans le document root de nginx

### Serveur

* Configurer le serveur (fichier ``config/local.json`` écrasant ``config/default.json`` et ``config.production.json``)
* Lancer la base de données Elastic Search : ``docker-compose -f docker-compose.prod.yml up``
* Lancer le serveur ``NODE_CONFIG_DIR=/path/to/config/ npm start``

## Maintenance

### Sauvegarde des données Docker

* Les données sont dans un volume Docker (voir le nom du volume dans le fichier ``docker-compose.{dev,prod}.yml``)
* Sauvegarde du volume : utiliser ``docker volume inspect <nom du volume>`` pour récupérer le "mountpoint", c'est le dossier à sauvegarder
  * Exemple en une commande avec `tar` et `jq` : ``sudo tar zcvf backup.tgz $(docker volume inspect eatlas_esdata_dev | jq -r '.[0].Mountpoint')``

### Suppression

* Arrêt avec suppression des images : ``docker-compose -f <fichier.yml> down --rmi all``
* Arrêt avec suppression des images **et des données** : ``docker-compose -f <fichier.yml> down --rmi all --volumes``
