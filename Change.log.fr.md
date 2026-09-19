[English Changelog](./Change.log.md)

# Changelogs

# 1.11.0

- Fix #26 : la dernière version est désormais sélectionnée comme le plus grand tag SemVer, et non comme le premier élément de la liste des releases GitHub/Gitea. Les forges trient les releases par identifiant de création : un backport publié après une version plus récente (ex. VictoriaLogs v1.51.1 après v1.52.0) était détecté à tort comme « dernière version ». Les schémas de versionnement non-SemVer conservent le comportement précédent.
- Fix #26 : une version de production **supérieure** à la dernière release détectée n'est plus signalée « TO UPDATE » ; elle est affichée avec un badge gris « Unknown » et un nouveau champ `productionVersionIsGreater` dans le résultat de comparaison.
- Comparaison tenant compte du SemVer (tolérance du préfixe v, précédence des pre-releases) lorsque les deux versions sont parsables en SemVer ; le comportement historique par inclusion de chaînes est conservé en repli.
- **CHANGEMENT DE COMPORTEMENT** : pour les dépôts maintenant plusieurs flux de versions (ex. 1.x LTS et 2.x) sans expression régulière de filtre, la version la plus grande l'emporte désormais. Utilisez le filtre « ne conserver que les releases correspondant à ce motif » pour suivre un flux précis.
- UI : l'aperçu « dernière version disponible détectée » de l'assistant de contrôle applique désormais la même sélection que le serveur.
- Tests UI : nouvelle suite Vitest + React Testing Library pour le client (56 tests).
- Tests : proxy local minimal (`npm run startLocalProxy`) permettant d'exécuter la suite de tests serveur sans proxy corporate.
- Garde-fou de confidentialité : `npm run checkConfidentiality` analyse les commits en attente, l'arborescence de travail et tout texte sur le point d'être publié (descriptions de PR) à la recherche de secrets, d'adresses IP internes et de fichiers sensibles ; un hook git `pre-push` l'applique avant chaque push.
- Dépendances client : vite 8, @vitejs/plugin-react 6, @reduxjs/toolkit 2, react-redux 9, react-router-dom 7, react-intl 12 — `npm audit` ne rapporte plus aucune vulnérabilité (4 auparavant).
- Dépendances serveur actualisées.

# 1.10.0

- Migration du serveur en **modules ECMAScript** (« type » : « module », imports avec suffixe .js, configurations TypeScript/Jest ESM, nodemon utilise désormais tsx).
- Dépendances serveur mises à jour en versions majeures : Express 4 → 5, body-parser 1 → 2, helmet 7 → 8, express-session 1.18 → 1.19, http/https-proxy-agent 7 → 9, @metrichor/jmespath 0.3 → 1.0.
- **BREAKING CHANGE** : Node.js 22 est désormais requis (image Docker de base node:22.22.3-alpine3.23, auparavant node:20.18).
- La détection de version GitHub utilise désormais l'API **/releases** au lieu de /tags, et lit le tag depuis « tag_name » en priorité (« name » en repli).
- Compatibilité Express 5 : la route wildcard de la SPA devient « /ui/editcontrol/*path » (Express 5 impose des wildcards nommés).
- Storybook et ESLint retirés du client (suppression de tous les fichiers *.stories.*) — installations et builds plus légers.
- Build : « npm run build » nettoie le répertoire dist/ en premier ; les builds Docker copient les fichiers de paquets avant les sources pour un meilleur cache des couches.
- Roadmap : abandons des éléments « token readonly par utilisateur », « stockage S3 » et « point d'entrée API metrics ».
- Client : mises à jour mineures des dépendances (react-router-dom 6.30, vite 4.5.14, typescript 5.9).
- Tests : configuration Jest ESM (preset ts-jest ESM, nouveau tsconfig.test.json), nouvelles suites de tests (groupes, base de données).

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
