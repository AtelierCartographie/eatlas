# e-Atlas ‑ documentation technique

## Troubleshooting

### Erreur de connexion “_Not a valid origin for the client […]_”

[Configurer la clé d'API Google](./Configuration.md#front-build-du-site)

### Impossible de se connecter après l'installation

Il manque sûrement [l'utilisateur initial](./Installation.md#création-du-premier-compte-admin).

### Les pages semblent charger indéfiniment

- Regarder dans les logs de l'API : `docker logs eatlas_backend` (le nom du container peut être différent selon l'environnement)
- En cas d'erreur "CORS", en production il doit pouvoir être désactivé, vérifier la présence de `CORS_ALLOW_NO_ORIGIN=1` dans `docker-config.env`

### Les données ont disparu / l'index Elastic Search est corrompu / …

Utiliser [le script `es-index`](./Maintenance.md#manipuler-les-indices-elastic-search) pour analyser les index et éventuellement remplacer l'alias courant pour rebasculer sur une ancienne version de l'index.

Sinon le plus direct et efficace est généralement la restauration d'une [sauvegarde](./Backup.md).

### La génération du site échoue, les HTML ne sont pas bien à jour…

Lancer une [régénération manuellement](./Maintenance.md#régénérer-le-site-complet), si d'éventuelles erreurs empêchent cette génération elles seront alors visible en sortie de la commande

### Le mapping Elastic Search a été modifié, mais malgré le redémarrage du serveur les nouveaux paramètres ne sont pas pris en compte

La migration automatique est probablement désactivée, le plus simple est de faire une migration manuelle à l'aide de [la commande `yarn es-index reindex <resource|topic|user>`](./Maintenance.md#manipuler-les-indices-elastic-search).

Un redémarrage du serveur peut ensuite être nécessaire pour migrer sur le nouvel index.

### J'ai des erreurs `EACCESS` lors de l'upload de fichiers

Vérifier les permissions, les dossier suivants doivent être en lecture/écriture au moins pour l'utilisateur exécutant le processus node :

- dossier spécifié par `publicPath`
- dossier spécifié par `uploadPath`
