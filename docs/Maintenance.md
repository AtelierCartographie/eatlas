# e-Atlas ‑ documentation technique

## Maintenance

### Utilisateurs

Pour ajouter un utilisateur, par exemple le premier administrateur, on utilise le script "add-user" :

```sh
# un admin
yarn add-user "email" "Full name" admin

# un accès visiteur au backoffice
yarn add-user "email" "Full name" visitor

# en production, via Docker, on utilise "docker exec"
docker-compose -f docker-compose.prod.yml exec backend node ./bin/add-user "prenom.nom@mail.fr" "Prénom NOM" admin

# ou en connaissant le nom du container
docker exec eatlas_node node ./bin/add-user "prenom.nom@mail.fr" "Prénom NOM" admin
```

### Manipuler les données

On peut soit passer par l'API Elastic Search :

- Les index sont définis dans [la configuration](./Configuration.md)
- Ces index sont chacun un alias vers l'index réel suffixé par un timestamp

On peut également attaquer les données via l'API Node à l'aide d'une application dédiée :

```sh
yarn model-repl
```

On entre dans un _REPL_ Node personnalisé simplifiant l'utilisation des méthodes d'accès au modèle, par exemple si on souhaite forcer le status "publié" d'un article (il suffira de [régénérer le site ensuite](./Rebuild.md)) :

```
eatlas-model > Resources.findBy('4A07')
eatlas-model > article = _
eatlas-model > article.status = 'published'
eatlas-model > Resources.update(article.id, article)
```

### Manipuler les indices Elastic Search

Le script `es-index` permet de manipuler les indices :

- Lister les indices et l'alias actif
- Basculer l'alias sur un autre indice (pour retourner à une ancienne version des données par exemple)
- Créer un nouvel indice ([pour forcer une migration de mapping par exemple](./Architecture.md#mapping-alias-et-migration-automatique))

```sh
# Vérifier les indices
yarn es-index

# Forcer la réindexation en appliquant le mapping configuré
yarn es-index reindex resource

# Basculer vers un ancien indice
yarn es-index resource 12397987
```

### Régénérer le site complet

Voir [la documentation dédiée](./Rebuild.md#régénération-manuelle)
