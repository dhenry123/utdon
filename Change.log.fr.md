[English Changelog](./Change.log.md)

# Changelogs

# 1.11.0

- Fix #26 : la dernière version est désormais sélectionnée comme le plus grand tag SemVer, et non comme le premier élément de la liste des releases GitHub/Gitea. Les forges trient les releases par identifiant de création : un backport publié après une version plus récente (ex. VictoriaLogs v1.51.1 après v1.52.0) était détecté à tort comme « dernière version ». Les schémas de versionnement non-SemVer conservent le comportement précédent.
- Fix #26 : une version de production **supérieure** à la dernière release détectée n'est plus signalée « TO UPDATE » ; elle est signalée « à jour » avec un avertissement et un nouveau champ `productionVersionIsGreater` dans le résultat de comparaison.
- Comparaison tenant compte du SemVer (tolérance du préfixe v, précédence des pre-releases) lorsque les deux versions sont parsables en SemVer ; le comportement historique par inclusion de chaînes est conservé en repli.
- **CHANGEMENT DE COMPORTEMENT** : pour les dépôts maintenant plusieurs flux de versions (ex. 1.x LTS et 2.x) sans expression régulière de filtre, la version la plus grande l'emporte désormais. Utilisez le filtre « ne conserver que les releases correspondant à ce motif » pour suivre un flux précis.
- UI : l'aperçu « dernière version disponible détectée » de l'assistant de contrôle applique désormais la même sélection que le serveur.
- Tests UI : nouvelle suite Vitest + React Testing Library pour le client (56 tests).
- Tests : proxy local minimal (`npm run startLocalProxy`) permettant d'exécuter la suite de tests serveur sans proxy corporate.
- Dépendances client : vite 8, @vitejs/plugin-react 6, @reduxjs/toolkit 2, react-redux 9, react-router-dom 7, react-intl 12 — `npm audit` ne rapporte plus aucune vulnérabilité (4 auparavant).
- Dépendances serveur actualisées.

# 1.9.0

- NodeJS 20.18
- Support proxy Corporate.
- Amélioration de la sécurité SSL, lié à l'implémentation du support d'un proxy corporate.
- **BREAKING CHANGE** : Un nouveau volume a été ajouté : "cacerts", monté sur "/app/cacerts".
- **BREAKING CHANGE** : Si vous surveillez des services HTTPS avec des certificats autosignés, vous devez installer les certificats CA dans le répertoire "cacerts" ou bien désactiver le contrôle SSL en passant la variable d'environnement : `NODE_TLS_REJECT_UNAUTHORIZED="0"`
- Amélioration des tests unitaires.
- Typo.

# 1.7.0

- **BREAKING CHANGE** : Changement de la méthode HTTP pour l'entrée API : "compare". La méthode originale n'était pas appropriée, car la fonction appelée altère les données, par conséquent, elle a été remplacée par "PUT". Si vous utilisez utdon dans une tâche "cron" avec curl, ajouter le paramètre : '-X PUT'
- **BREAKING CHANGE** : Harmonisation et amélioration des logs serveur, **le contenu des logs a changé**.
- Refactorisation login/logout, le login retourne un nouveau cookie (corrige session fixation).
- Correction de plusieurs bugs et refactorisation de méthodes.
- Rechercher par uuid ou partie d'uuid.
- UserManager : Le champs "username" est inactif en mode "Édition".
- Présentation des contrôles sous la forme d'un tableau.
- Duplication d'un contrôle.
- Support des dépôts git de type "Gitea" avec authentification, permet ainsi l'authentification GitHub pour les projets privés, valeur (HTTP HEADER) Key: Authorization value: "Bearer <You token>"
- Authentification GitHub globale pour supprimer la barrière "rate-limit". La valeur est prise seulement dans le cas où le contrôle ne dispose pas déjà d'une authentification spécifique.
- Pour les applications n'offrant pas de point d'entrée de niveau de version, possibilité de saisir la valeur de la version utilisée, ceci peut aussi permettre de suivre l'évolution d'une application qui n'est pas en production.
