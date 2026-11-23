# Espace mondial l'atlas — version statique

Le site [espace-mondial-atlas.sciencespo.fr](https://espace-mondial-atlas.sciencespo.fr/fr/)
était servi par une application Node/Express + Elasticsearch + Redis avec un backoffice
React ([dépôt d'origine](https://github.com/AtelierCartographie/eatlas), dernier commit en
mars 2021). Le contenu n'évoluant plus, ce dossier produit une **version entièrement
statique** : des fichiers HTML/CSS/JS/images à déposer sur un simple espace SFTP, sans
aucun code exécuté côté serveur.

> **Site prêt à déposer** : archive `eatlas-site-statique.zip` de la
> [release `static-v1`](https://github.com/AtelierCartographie/eatlas/releases/tag/static-v1)
> (≈ 1,1 Go, à décompresser à la racine de l'hébergement). Note pour l'hébergeur :
> [HEBERGEMENT.md](HEBERGEMENT.md).

## Contenu du dossier `static-site/`

| Élément | Rôle |
| --- | --- |
| `tools/crawl.mjs` | Aspire le site en ligne vers `mirror/` (toutes les pages FR/EN, médias, CSS/JS). Part des 1 266 ressources publiées listées par l'API : aucune page orpheline oubliée. |
| `mirror/` | Copie brute du site d'origine (référence, jamais modifiée), **sans** `mirror/media/` (1,4 Go de JPEG d'origine, hors git : voir [Images](#images)). |
| `data/` | Métadonnées de recherche extraites de l'ancienne API (types, langues, rubriques, ordre). |
| `static-src/assets/js/static-search.js` | Moteur de recherche côté navigateur qui remplace l'API Elasticsearch. |
| `tools/build.mjs` | Construit le site statique à partir de `mirror/` (voir ci-dessous). |
| `tools/check-links.mjs` | Vérifie que chaque lien interne pointe vers un fichier existant et qu'aucune ressource ne vient d'un serveur externe. |
| `tools/check-external.mjs` | Teste les 754 liens externes (sources des cartes et articles) -> `data/external-check.json`. |
| `tools/resolve-dead-links.mjs` | Remplace les liens morts par leur archive Wayback Machine (2018) -> `data/link-fixes.json` ; corrections à la main dans `data/link-fixes-manual.json`, liens restés sans solution dans `data/link-unresolved.json`. |
| `static-src/assets/vendor/` | jQuery 3.7.1, Bootstrap 3.4.1 (mêmes modules), jasny-bootstrap, slick, picturefill et polices Fira Sans / Gentium Basic (licence OFL), servis par le site lui-même. |
| `tools/convert-webp.mjs` | Convertit les JPEG d'affichage en WebP dans `webp/` (hors git). |
| `tools/serve.mjs` | Serveur local de test (statique pur, avec pages 404). |
| `conf/nginx-eatlas.conf` | Configuration serveur proposée au pôle réseau. |
| `dist-prod/`, `dist/` | Sorties du build (hors git) : site de production avec Google Tag Manager, et site de test sans mesure d'audience. |
| `../config/` | Mots vides FR/EN de l'ancien moteur de recherche, repris par l'index statique. |

## Commandes

Les images ne sont pas versionnées (voir [Images](#images)). Pour reconstruire le site,
les récupérer d'abord depuis la release `static-v1` :

- **avec les originaux** (`eatlas-media-jpeg-originaux.zip`) : `unzip … -d mirror/`
  (-> `mirror/media/`), puis `npm run webp` pour régénérer les WebP ;
- **sans les originaux**, depuis l'archive du site :
  ```bash
  unzip eatlas-site-statique.zip 'media/*.webp' -d tmp && mkdir -p webp && mv tmp/media/*.webp webp/
  unzip eatlas-site-statique.zip 'media/*' -x 'media/*.webp' -d mirror/
  ```

Depuis le dossier `static-site/` (Node ≥ 18) :

```bash
npm install                          # sharp (conversion WebP), seule dépendance
node tools/crawl.mjs mirror          # aspiration du site d'origine — faite en novembre 2026, ne plus relancer
npm run webp                         # 1. JPEG d'affichage -> webp/ (incrémental)
npm run build                        # 2a. build de test -> dist/
npm run build:prod                   # 2b. build de production -> dist-prod/
npm run check                        # 3. contrôle des liens de dist-prod/
npm run serve                        # 4. test local de dist/ : http://localhost:8080/
```

## Images

Chaque image existe en 9 déclinaisons (small/medium/large × 1x/2x/3x, choisies par le
navigateur selon l'écran) ; les cartes ont en plus des versions « full » à télécharger.

- **Affichage en WebP** (qualité 82) : −45 % de poids, sans différence visible sur les
  cartes. Le WebP est lu par tous les navigateurs depuis 2020 et par les robots des
  réseaux sociaux (images de partage), contrairement à l'AVIF.
- **Téléchargements en JPEG d'origine** : les cartes « full » et les autres fichiers
  proposés par un lien « télécharger » restent les JPEG de 2018, intacts. Le
  téléchargement reste un simple lien, sans conversion ni JavaScript.
- PNG inchangés (le WebP sans perte n'y gagne que 6 %).
- Bilan : images 1,43 Go -> 1,07 Go (−25 %) ; −47 % sur les images effectivement affichées
  aux visiteurs. Les 458 déclinaisons « 3x » proposées au téléchargement existent dans les
  deux formats (WebP pour l'affichage, JPEG pour le téléchargement).

## Ce que fait le build

- **Mesure d'audience** : retrait de Google Analytics « UA » (`UA-2835049-27`, arrêté par
  Google en juillet 2023) et injection du conteneur Google Tag Manager commun à Sciences Po
  (`GTM-WFBGG7`, le même que le site de l'Atelier ; le bandeau Cookiebot est géré dans le
  conteneur). Uniquement avec `--prod`.
- **Sécurité** : retrait du script `cdn.polyfill.io` (domaine racheté et compromis en 2024)
  et des liens vers le backoffice ; jQuery 3.3.1 -> 3.7.1 et Bootstrap 3.3.7 -> 3.4.1
  (failles connues corrigées) ; plus aucun CDN ni Google Fonts : la seule ressource
  externe chargée est Google Tag Manager.
- **Liens externes** : 205 liens morts remplacés par leur copie archivée (Wayback
  Machine, au plus près de 2018), 11 adresses mal saisies corrigées, 257 liens passés en
  https.
- **SEO** : `meta description` sur toutes les pages (résumé, premier paragraphe ou titre),
  `canonical`, `hreflang` complets (auto-référence + `x-default`), `og:site_name` /
  `og:locale`, `twitter:card` valide, pages 404 en `noindex`, liens de citation
  (`data%3A…`, lus comme des 404 par les robots) réparés, polices en `font-display: swap`.
- **Liens relatifs** : tous les liens internes deviennent relatifs ; le site fonctionne
  quel que soit le domaine ou le dossier où il est déposé. Seules les métadonnées
  (`og:*`, `hreflang`, `canonical`) et les citations gardent l'adresse absolue.
- **Recherche** : la page Rechercher / Search interroge un index statique
  (`assets/search/meta.json` 0,5 Mo, `text.json` 1,7 Mo chargé seulement pour une recherche
  plein texte) au lieu de l'API. Mêmes filtres (type, langue, rubrique, lettre),
  pagination identique, pondération titre/résumé/texte reprise de l'ancienne configuration.
- **Contenu** : mentions légales FR/EN (directeur de la publication désigné par sa fonction,
  hébergeur, section données personnelles), liens de l'équipe, lien de contact, coquilles
  des bios ; la page « About » anglaise reprend les bios relues de l'accueil anglais (elle
  avait gardé une traduction automatique fautive).
- **Ajouts** : `index.html` racine (redirige vers `/fr/`), `robots.txt`, `sitemap.xml`.

Chaque correction est comptée et le build échoue si l'une d'elles ne s'applique plus.
