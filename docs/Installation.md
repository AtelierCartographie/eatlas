# e-Atlas ‑ documentation technique

## Installation

Note : La compréhension de [l'architecture technique du projet](./Architecture.md#architecture-technique) peut être utile pour appréhender le fonctionnement général.

### Code

Télécharger le code source de ce dépôt Git:

```bash
git clone https://github.com/AtelierCartographie/eatlas.git eatlas
cd eatlas
```

### Local

Pour préparer un poste de développement, l'application doit tourner en local. Le plus simple est d'utiliser l'image Docker :

1. Éventuellement [configurer le projet](./Configuration.md#configuration) pour les contraintes locales (port, url, chemins…)
2. Installer les dépendances requises manquantes :
   - [`yarn`](https://yarnpkg.com/en/docs/install)
   - [`docker`](https://docs.docker.com/install/)
   - [`docker-compose`](https://docs.docker.com/compose/install/)
   - Les dépendances Node avec la commande `yarn install`
3. Lancer le projet avec la commande `yarn dev`
   - Les images Docker `eatlas_es_dev` et `eatlas_redis_dev` seront construites si besoin, puis démarrées
   - Le navigateur principal sera ouvert sur l'URL du backoffice
   - Si tout fonctionne correctement, les modifications sur le serveur le redémarrent, et les modifications sur le client rechargent la page du navigateur

Le site web front est généré au fur et à mesure de la création de rubriques et de la (dé)publication de ressources sur http://localhost:3000/generated (par défaut)

### Production

La production tourne dans des conteneurs Docker orchestrés par le fichier `docker-compose.prod.yml`.
Des images sont construites directements via le Docker Hub lors d'un évènement `push` sur le dépôt Git:

- Client: https://hub.docker.com/r/sciencespo/eatlas-frontend/
- API: https://hub.docker.com/r/sciencespo/eatlas-backend/

1. [Configurer l'application](./Configuration.md#configuration)
2. Installer les dépendances requises manquantes :
   - [`yarn`](https://yarnpkg.com/en/docs/install)
   - [`docker`](https://docs.docker.com/install/)
   - [`docker-compose`](https://docs.docker.com/compose/install/)
   - Un serveur web comme `nginx` qui aura plusieurs rôles :
     - servir le dossier du site généré (dit _dossier public_)
     - probablement servir de proxy pour le serveur node (backoffice, api)
     - servir la page 404 du site (page `notFound`, soit par défaut le fichier `not-found.html`)
3. Construire les images Docker
   - **Recommandé: Télécharger** nos images déjà construites depuis le Docker Hub:
     ```sh
     docker-compose -f docker-compose.prod.yml pull
     ```
   - **Alternative: Construire** vos propres images à partir du code source (utile pour du développent ou si vous éditez le code):
     ```sh
     docker-compose -f docker-compose.prod.yml build
     ```
4. Pour démarrer l'application :
   ```sh
   docker-compose -f docker-compose.prod.yml up
   # Supprimer le flag "-d" pour lancer au premier plan
   ```
5. Pour relancer l'application (après une mise à jour par exemple) :
   ```sh
   docker-compose -f docker-compose.prod.yml stop
   docker-compose -f docker-compose.prod.yml up -d
   ```

Voir le fichier `docker-compose.prod.yml` pour la liste des volumes (à cette date : `esbackup`, `esdata`, `redisdata`, `uploadsdata`) et des containers attendus.

### Google

L'application nécessite une connexion via Google OAuth et l'accès à Google Drive, il faut donc créer une application Google avec les bons paramètres :

- Créer une application sur https://console.developers.google.com
- Menu burger → APIs & Services → Credentials → créer un nouveau projet :
  - Create credentials > OAuth client ID > Copier la clé d'API
- Menu burger → APIs & Services → Library → activer les APIs suivantes :
  - Google Picker API
  - Google Drive API
- Menu buger → APIs & Services → Credentials → créer une nouvelle clé d'API :
  - Réstreindre la clé aux API "Google Picker" et "Google Drive"
- Modifier la [configuration client](./Configuration.md#front-build-du-site) pour y entrer les clés fournies :
  - `REACT_APP_GOOGLE_CLIENT_ID` est la clé Oauth Client ID
  - `REACT_APP_GOOGLE_DEV_KEY` est la clé d'API

### Création du premier compte admin

Une fois l'application configurée, les services démarrés, il faut au moins un utilisateur pour pouvoir commencer à administrer l'application. L'ajout du tout premier utilisateur se fait en ligne de commande :

```sh
yarn add-user "user@gmail.com" "Nom Complet" admin
```

ou avec Docker:

```sh
docker-compose -f docker-compose.prod.yml exec backend node ./bin/add-user "prenom.nom@mail.fr" "Prénom NOM" admin
```

On peut dès lors se connecter avec ce compte et effectuer tout le reste depuis l'interface Web.
