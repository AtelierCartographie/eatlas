Voir [issues/79#issuecomment-409548247](https://github.com/AtelierCartographie/eatlas/issues/79#issuecomment-409548247)

> J'ai fini avec un mélange de "boost" et de "constant_score", en effet le score constant donne des résultats plus prévisibles mais casse le tri par pertinence intégré d'Elastic Search, ce qui est dommage.
>
> Vous avez à votre disposition cette configuration pour jouer sur le tri :
>
> ```json
> {
>   "// searchSort": "Rules to compute score for specific ordering",
>   "searchSort": {
>     "// boostType": "Boost score depending on doc's type",
>     "boostType": {
>       "single-definition": 1000
>     },
>     "// boostSearchField": "Boost applied to text searchFields listed above (not listed = 1)",
>     "boostSearchField": {
>       "title": 40,
>       "description_fr": 10,
>       "description_en": 10
>     },
>     "// scoreSpecial": "Score applied to specific search criteria: status, type, language, topic, or keyword (not listed = 0)",
>     "scoreSpecial": {
>       "keyword": 200
>     }
>   }
> }
> ```
>
> Il y a donc 3 grandes parties dans la recherche :
>
> 1. Les filtres excluant "simples" : langues, topics, types…
>    - A priori ils n'ont pas à avoir d'impact dans l'ordre final, j'ai donc défini leur score à 0 (sauf modification dans la config `searchSort.scoreSpecial`)
> 2. Les champs "full text" pour lesquels on souhaite un calcul de pertinence : tous ceux listés dans la config `searchFields` (titre, sous-titre, description fr & en, etc…)
>    - On souhaite "booster" le score de certains de ces champs selon leur importance (ici titre et description) : c'est possible dans la config `searchSort.boostSearchField` (boost par défaut = 1 donc les champs non listé gardent quand-même un impact selon la pertinence)
>    - Le score final de la recherche sur tous ces champs sera la somme de toutes les recherches
> 3. Les métas sont techniquement plus complexes (nested à deux niveau) à interroger
>    - on trouve donc les mots-clés dans un bloc à part, dont le score est fixé par la config `searchSort.scoreSpecial.keyword`
>    - ce score est fixe et défini à l'avance
>
> Le score final d'un document est la somme de tous ces scores cumulés. On applique alors finalement un multiplicateur (défini par la config `searchSort.boostType`) en fonction du type de ressource, ici utilisé pour propulser les définitions en tête de résultat.
>
> Le jeu consiste ensuite à définir les bonnes valeurs en configuration… Il faudra surtout faire du "try and see" pour peaufiner avec les vraies données et les vraies recherches.
>
> ### Comment j'ai choisi les valeurs par défaut
>
> Par défaut il y a un boost de 1 sur les champs "full text" (dont titre et description_fr et description_en). Il y a 10 champs listés.
>
> - Afin de s'assurer que la description ait plus d'importance que n'importe quel autre champs, je lui ai appliqué un **boost de 10 (= le nombre total de champs full text)**, ainsi si deux docs sortent, on est sûr que celui dont la description match sera devant l'autre même si _tous_ ses autres champs matchent.
> - Une fois ceci défini, j'ai une nouvelle somme des boosts qui est 28, j'ai donc appliqué un **boost de 40** au titre, en appliquant la même logique plus une bonne marge pour caler le score des mots-clés au milieu.
> - Les mots-clés n'étant pas du full-text, il faut ensuite s'en remettre aux valeurs expérimentales (`*`) qui m'ont donné un **score de 58\*3 arrondi à 200**
> - Une fois qu'on a tout ça, il faut être sûr que les définitions seront toujours devant, on se retrouve avec un score pouvant d'après les tests aller jusqu'à environ 700, donc j'ai simplement décidé de **multiplier par 1000** pour m'assurer qu'une définition avec un très faible score passe quand-même devant.
>
> (`*`) valeurs expérimentales :
>
> - Il n'y a je crois théoriquement pas de "max" au score d'une requête "match" (celle de l'étape 2) mais lors de mes tests on est en gros entre 3 et 8 lorsqu'on est très précis, et la plupart du temps entre 1 et 2.
> - Si on choisit une valeur X comme score de référence pour les champs "full text", on se retrouve avec **un score global du bloc n° 2 de 58\*X**
> - J'ai choisi une valeur de référence arbitraire de 3 pour qu'un titre matchant approximativement reste prioritaire sur un mot-clé, il s'agira pour vous d'ajuster ce curseur
