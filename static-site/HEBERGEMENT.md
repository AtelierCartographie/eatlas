# Espace mondial l'atlas — demande d'hébergement statique

**Pour** : pôle réseau de Sciences Po
**Objet** : remplacer le serveur actuel d'espace-mondial-atlas.sciencespo.fr par un
simple espace de fichiers statiques (SFTP), comme pour le site de l'Atelier de cartographie.

## Ce qui change

| | Aujourd'hui | Après |
| --- | --- | --- |
| Logiciels côté serveur | Node.js/Express, Elasticsearch, Redis, backoffice React (code de 2018-2021) | **aucun** : nginx sert des fichiers |
| Accès d'administration | backoffice accessible publiquement sur `/backoffice` | supprimé |
| API publique | `/backend/search` (requêtes POST vers Elasticsearch) | supprimée : recherche dans le navigateur |
| Formulaires, comptes, base de données | backoffice (connexion Google), Elasticsearch | aucun |
| Scripts tiers | Google Analytics UA (hors service), cdn.polyfill.io (domaine compromis en 2024), jQuery 3.3.1 et Bootstrap 3.3.7 (failles connues) via CDN, Google Fonts | Google Tag Manager Sciences Po (`GTM-WFBGG7`) uniquement ; jQuery 3.7.1, Bootstrap 3.4.1 et polices servis par le site |

## Ce dont nous avons besoin

1. **Un espace SFTP** d'environ **1,5 Go** (5 177 fichiers, dont 4 100 images JPEG).
2. Le domaine **espace-mondial-atlas.sciencespo.fr** (HTTPS) pointé vers la racine de cet
   espace : les adresses actuelles de toutes les pages sont conservées à l'identique.
3. Si possible, les règles nginx de [`conf/nginx-eatlas.conf`](conf/nginx-eatlas.conf) :
   redirection `/` → `/fr/`, pages 404 FR/EN, compression gzip, `410` sur les anciennes
   adresses `/backoffice` et `/backend`. Le site fonctionne sans elles (liens relatifs), elles
   améliorent seulement les erreurs et redirections.
4. Une fois la bascule vérifiée : **l'arrêt définitif de l'ancien serveur** (Node,
   Elasticsearch, Redis) et des sauvegardes associées.

## Dépôt

Contenu à déposer : l'archive `eatlas-site-statique.zip` de la
[release `static-v1`](https://github.com/AtelierCartographie/eatlas/releases/tag/static-v1),
décompressée telle quelle (sa racine = racine du site). Envoi unique, aucune mise à jour
prévue (le projet n'évolue plus). La méthode et les scripts sont dans la branche
[`static-site`](https://github.com/AtelierCartographie/eatlas/tree/static-site/static-site).

## Vérification après bascule

```bash
curl -sI https://espace-mondial-atlas.sciencespo.fr/fr/index.html        # 200
curl -sI https://espace-mondial-atlas.sciencespo.fr/                      # 301 -> /fr/
curl -sI https://espace-mondial-atlas.sciencespo.fr/fr/inexistant.html    # 404 (page du site)
curl -sI https://espace-mondial-atlas.sciencespo.fr/backoffice/           # 410
```

Puis, dans un navigateur : une recherche sur la page « Rechercher » et l'apparition du
bandeau Cookiebot.
