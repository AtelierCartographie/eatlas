# e-Atlas ‑ documentation technique

## Sauvegarde

Les éléments à sauvegarder sont les suivants :

- Les données dans Elastic Search
  - La technique recommandée repose sur [les snapshots](https://www.elastic.co/guide/en/elasticsearch/guide/current/backing-up-your-cluster.html)
- Les fichiers uploadés dans le dossier d'upload
  - Voir l'option de [configuration](./Configuration.md) `uploadPath`
- Éventuellement le site généré pour une restauration plus rapide
  - Voir l'option de [configuration](./Configuration.md) `publicPath`

Note : à la date actuelle, Redis ne contient que des informations volatiles (les sessions utilisateur du backoffice) et sa sauvegarde a un faible intérêt.

### Sauvegarde des données Docker

Plutôt qu'une sauvegarde par serveur, on peut également simplement sauvegarder directement les systèmes de fichier des images Docker :

- Les données sont dans un volume Docker (voir le nom du volume dans le fichier `docker-compose.{dev,prod}.yml`)
- Sauvegarde du volume : utiliser `docker volume inspect <nom du volume>` pour récupérer le "mountpoint", c'est le dossier à sauvegarder
  - Exemple en une commande avec `tar` et `jq` : `sudo tar zcvf backup.tgz $(docker volume inspect eatlas_esdata_dev | jq -r '.[0].Mountpoint')`

## Restauration

- Restaurer les indices Elastic Search
  - Par exemple en ayant utilisé [les snapshots](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-snapshots.html)
- Restaurer les fichiers uploadés et éventuellement le site généré

Normalement il n'est pas nécessaire de redémarrer le serveur Node.
