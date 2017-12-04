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

```sh
npm i --production
docker-compose -f docker-compose.prod.yml yp
```
