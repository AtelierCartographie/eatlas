# Espace mondial l'atlas — version statique

Le site [espace-mondial-atlas.sciencespo.fr](https://espace-mondial-atlas.sciencespo.fr/fr/)
était servi par une application Node/Express + Elasticsearch + Redis avec un backoffice
React ([dépôt d'origine](https://github.com/AtelierCartographie/eatlas), dernier commit en
mars 2021). Le contenu n'évoluant plus, ce dossier produit une **version entièrement
statique** : des fichiers HTML/CSS/JS/images à déposer sur un simple espace SFTP, sans
aucun code exécuté côté serveur.

> **Site prêt à déposer** : archive `eatlas-site-statique.zip` de la
> [release `static-v1`](https://github.com/AtelierCartographie/eatlas/releases/tag/static-v1)
> (1,4 Go, à décompresser à la racine de l'hébergement). Note pour l'hébergeur :
> [HEBERGEMENT.md](HEBERGEMENT.md).

## Contenu du dossier `static-site/`

| Élément | Rôle |
| --- | --- |
| `tools/crawl.mjs` | Aspire le site en ligne vers `mirror/` (toutes les pages FR/EN, médias, CSS/JS). Part des 1 266 ressources publiées listées par l'API : aucune page orpheline oubliée. |
| `mirror/` | Copie brute du site d'origine (référence, jamais modifiée), **sans** `mirror/media/` (1,3 Go d'images, hors git : voir ci-dessous). |
| `data/` | Métadonnées de recherche extraites de l'ancienne API (types, langues, rubriques, ordre). |
| `static-src/assets/js/static-search.js` | Moteur de recherche côté navigateur qui remplace l'API Elasticsearch. |
| `tools/build.mjs` | Construit le site statique à partir de `mirror/` (voir ci-dessous). |
| `tools/check-links.mjs` | Vérifie que chaque lien interne pointe vers un fichier existant et qu'aucune ressource ne vient d'un serveur externe. |
| `tools/check-external.mjs` | Teste les 754 liens externes (sources des cartes et articles) -> `data/external-check.json`. |
| `tools/resolve-dead-links.mjs` | Remplace les liens morts par leur archive Wayback Machine (2018) -> `data/link-fixes.json` ; corrections à la main dans `data/link-fixes-manual.json`, liens restés sans solution dans `data/link-unresolved.json`. |
| `static-src/assets/vendor/` | jQuery 3.7.1, Bootstrap 3.4.1 (mêmes modules), jasny-bootstrap, slick, picturefill et polices Fira Sans / Gentium Basic (licence OFL), servis par le site lui-même. |
| `tools/serve.mjs` | Serveur local de test (statique pur, avec pages 404). |
| `conf/nginx-eatlas.conf` | Configuration serveur proposée au pôle réseau. |
| `dist-prod/`, `dist/` | Sorties du build (hors git) : site de production avec Google Tag Manager, et site de test sans mesure d'audience. |
| `../config/` | Mots vides FR/EN de l'ancien moteur de recherche, repris par l'index statique. |

## Commandes

Les médias ne sont pas versionnés. Pour reconstruire le site, récupérer d'abord les
images depuis l'archive de la release (le build ne les modifie pas) :

```bash
unzip eatlas-site-statique.zip 'media/*' -d mirror/   # -> mirror/media/
```

Depuis le dossier `static-site/` :

```bash
node tools/crawl.mjs mirror          # 1. aspiration du site d'origine — déjà faite (novembre 2026), ne plus relancer
node tools/build.mjs                 # 2a. build de test -> dist/
node tools/build.mjs --prod --out dist-prod   # 2b. build de production -> dist-prod/
node tools/check-links.mjs dist-prod # 3. contrôle des liens
node tools/serve.mjs 8080 dist       # 4. test local : http://localhost:8080/
```

Node ≥ 18, aucune dépendance npm.

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
