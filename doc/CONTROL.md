# Création d'un contrôle

**Précision par rapport à healthchecks et immich**:
Vous verrez que le code source fait références aux applications "healthchecks" et "immich" dans les tests. Tout simplement parce que j'utilise ces services qui m'ont servi de base de travail...
Je précise que je n'ai aucuns liens ou intérêts directs/indirectes avec ces applications et leurs auteurs. Ces projets sont Opensource et disponibles sur la forge GitHub.

## Récupération de la version de production

Donnez un nom à votre contrôle, le nom de l'application par exemple, vous pouvez ajouter le logo associé (format PNG, JPEG, max 100Ko).

Première difficulté, récupérer la version de production, la manière de récupérer cette information peut-être indiquée dans la documentation de l'application, ce n'est souvent pas le cas. Chercher par vous-même... il existe souvent une entrypoint api, du genre "[URL de l'application]/version" ou "[URL de l'application]/api/v1/version"... qui retourne du texte ou un format JSON. La version peut aussi être incluse dans la page de login. Selon le type de réponse, vous utiliserez les filtres proposés ou bien
créez le votre.

### Valeur fixe

**Implémenté dans la version 1.7.0**, cette méthode permet de résoudre deux problèmes:

- Certaines applications ne proposent pas de point d'entrée pour obtenir leur version (ex: pgAdmin4).
- Lorsque vous voulez suivre un projet que vous n'hébergez pas.

Il suffit d'entrer une valeur fixe, la comparaison se fera par rapport à cette valeur et il n'y aura pas d'appel réseau pour résoudre la version de production.

### Entête HTTP

Cette zone permet d'entrer les paramètres d'authentification (header http clé/valeur).

Voir la documentation de l'application concernée, généralement le nom de l'attribut est "Autorization", et la valeur est directement le token d'accès ou bien le token précédé du terme "Bearer[espace] token".

### Filtres (RegExp ou JmesPath)

Ce sont les filtres que vous souhaitez appliquer pour obtenir une valeur comparable à la version disponible sur le dépôt git.

#### Text/Html/Xml (RegExp)

Exemple: la page de login fournit l'information souhaitée :

```html
<html>
  [..]
  <td>[....] Healthchecks v3.0.1</td>
</html>
```

La Regexp sera : Healthchecks (v[\d+\.+]+)

Certaines équipes commencent avec le modèle v1.0.1 et soudainnement, à la majeure, ne gardent que 2 chiffres. Heureusement, Github expose les tags par date (DESC).

#### Pour JSON (JmesPath)

C'est plus facile lorsque les développeurs fournissent un point d'entrée de l'API, qui renvoie un texte qui peut être au format json.

Dans ce cas, il suffit de fournir le chemin complet de la clé, exemple:

```json
{
  "version": "v3.0.1"
}
```

L'expression Jmespath sera : 'version' ==> v3.0.1

Ou bien :

```json
{
  "api": {
    "version": "v3.0.1"
  }
}
```

L'expression Jmespath sera : 'api.version' ==> v3.0.1

Ou bien :

```json
{ "major": 1, "minor": 89, "patch": 0 }
```

L'expression Jmespath sera : 'join('.',\*)' ==> 1.89.0

## Récupération de la dernière release disponible sur GitHub

**A partir de la version 1.7.0**, les dépôt de **type Gitea** (Codeberg est compatible) sont supportés.

Coller simplement l'url du dépôt de l'application, UTDON se charge d'interroger le point d'entrée API qui renvoie les "tags de release", puis vous appliquez le filtre désiré.

~~**ATTENTION**: Le service Github applique une politique de "rate-limit" concernant l'utilisation de ses API. Pour l'instant, ce produit n'a pas été prévu pour s'authentifier aux API GITHUB, par conséquent, Github applique la politique la plus restrictive, à savoir et à cette date : 60 appels par heure.~~

~~Voir la document GitHub :~~

- ~~FR : https://docs.github.com/fr/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28~~
- EN : ~~https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28#get-rate-limit-status-for-the-authenticated-user~~

**Depuis la version 1.7.0**, il est possible d'entrer les informations d'authentifications au niveau du contrôle (par exemple pour les dépôt privés), ou bien au niveau global. Le token global sera utilisé par tous les appels Github sauf si le contrôle dipose déjà d'une authentification.

En cas d'application de cette limite par le service GitHub, les logs du serveur indiqueront cette erreur :

```json
{"level":"error","message":{"errorToString":"Error: An error has occured: 403"
```

### Entête HTTP

Cette zone permet d'entrer les paramètres d'authentification (header http clé/valeur).

Pour Github, la clé est "Autorization", la valeur commence par "Bearer[espace]" et votre token d'accès github. Pour les autres forges, voir leur documentation.

### Filtres (RegExp)

Chaque équipe gére le numéro de version comme bon lui semble. Vous devez analyser leur fonctionnement afin d'éviter les "faux positifs". Pour cela vous pouvez utiliser les filtres déjà existants ou bien créer le vôtre avec une expression régulière.

Exemple: Un projet utilise aléatoirement ce type chaîne: v1.0 (2digits) ou v1.1.0 (3digits), l'expression régulière sera une expression générique permettant de considérer ces deux cas:

- `v[0-9]+\.[0-9]`
- `v[0-9]+\.[0-9].[0-9]`

Pour simplifier et être certain d'obtenir un résultat cohérent:

- `(v[\d+\.+]+)` : capture le contenu qui commence par v, suivi d'un ou plusieurs chiffres et eventuellement d'un point. Ce qui permet de capturer : v2.0 et v1.9.12

### Suivre uniquement une version, (ex: LTS-Long Term Support)

La version LTS d'un produit est actuellement la V2 "LTS", fixer l'expression en démarrant par l'indice "LTS" : `(v2.[0-9]+\.+)`

## Actions

Il s'agit de compléments qui permettront de mettre en place un suivi par monitoring et de déclencher le pipeline d'une chaîne CI/CD.

### Service de monitoring (ping)

Personnellement j'utilise le service de "ping healthchecks". Ce type de service est générique et prend en paramètre d'url : "0" pour "OK" et "1" pour "KO".

### Chaîne CI/CD

Cette action n'est jamais appelée automatiquement, vous devrez demander l'action au moyen de l'entrypoint API prévue ou bien du bouton disponible après comparaison. Généralement cette action permet la mise à jour de votre application en éxécutant un pipeline de tâches. **Déclencher ce type d'action automatiquement est une mauvaise pratique**, car mettre à jour une application nécessite d'abord de lire la documentation de version. Il peut y avoir des tâches complémentaires à effectuer par rapport aux tâches habituelles et mettre hors service votre application.

L'appel aux API UTDON peut être opéré dans le pipeline CI/CD. L'entrypoint de comparaison vous permet de récupérer plusieurs informations nécessaires au build, et/ou déploiement de la mise à jour.

**ATTENTION**, si vous utilisez les images containers associées, il arrive que les auteurs utilisent une autre méthode de nommages des tags...

## Enregistrement du contrôle

L'enregistrement du contrôle est nécessaire pour effectuer la comparaison. C'est le serveur qui se charge de cette opération.

## Comparaison

Une fois les informations nécessaires enregistrées, vous pouvez démarrer une comparaison. Le système retourne le résultat :

- UPTODATE: rien à faire, votre application est à jour
- UPTODATE avec avertissement: Ceci présage que l'application est à jour mais que la comparaison ne donne pas un résultat strict. Ceci provient du fait qu'il existe une légère différences entre les deux résultats obtenus. L'outils vous indique pourquoi je considère que l'application est à jour, mais il peut s'agir d'un faux positif...
- TOUPDATE: L'application en production ne correspond pas du tout à la dernière version disponible sur GitHuB.
