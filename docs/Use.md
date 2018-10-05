# e-Atlas ‑ documentation technique

Notes pratiques et synthétiques sur l'interface d'administration.

## Utilisateurs

- Les utilisateurs sont identifiés par une adresse e-mail permettant l'identification via le service Google (donc typiquement une adresse Google App ou Gmail)
- Le rôle "admin" permet de créer/modifier/supprimer des ressources/rubriques/utilisateurs
- Le rôle "visitor" ne permet que de visualiser les ressources/rubriques/utilisateurs

## Rubriques

- Les rubriques sont identifiées par un numéro, et triées par ce numéro (croissant) dans le site
- On retrouve sur la page la liste des contenus (par type) pour chaque rubrique

## Ressources

- L'identifiant d'une ressource suit la nomenclature "{id rubrique}{code type}{numéro}" par exemple "0C02" devrait être la deuxième ressource, de type carte, de la rubrique 0.
- Une ressource peut avoir 4 statuts :
  - soumis (à valider)
  - validé
  - publié : le passage de ce statut à un autre, et vice-versa, provoque une régénération du site
  - supprimé : une ressource doit d'abord passer par ce statut avant de pouvoir être supprimée définitivement

### Article et Focus

- Sélection d'un fichier `{id} Titre.docx` depuis Google Drive
- Le parsing devrait pré-remplir un maximum de champs, vérifier et compléter
- Sous le formulaire sont listées les informations du document, ainsi que les éventuelles erreurs à compléter (expliquant l'impossibilité de publier par exemple)

### Carte et Image

- Sélection d'un ou plusieurs fichiers `{id}-{taille}{densité}.{extension}` où
  - la taille est `small`, `medium` ou `large`
  - la densité est `@1x`, `@2x` ou `@3x`, ou vide
  - l'extension est une extension de fichiers image valide
  - Exemple : `0C02-large@3x.jpg`
- Voir [Rebuild.md#copie-des-assets](la copie des assets) pour le processus de publication de ces fichiers

### Lexique

- Le lexique est à part car il ne peut en exister qu'un, global
- Réuploader un fichier `.docx` en remplacement pour modifier le lexique

### Son

- Upload d'un fichier son valide
- Ce fichier sera copié [Rebuild.md#copie-des-assets](avec les autres assets) lors de la régénération du site

### Vidéo

- Saisie de l'URL d'une vidéo (URL Dailymotion)
