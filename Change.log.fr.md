[English Changelog](./Change.log.md)

# Changelogs

# 1.9.0

- Support proxy Corporate
- Typo

# 1.7.0

- **BREAKING CHANGE**: Changement de la méthode HTTP pour l'entrée API: "compare". La méthode originale n'était pas appropriée, car la fonction appelée altère les données, par conséquent elle a été remplacée par "PUT". Si vous utiliser utdon dans une tâche "cron" avec curl, ajouter le paramètre: '-X PUT'
- **BREAKING CHANGE**: Harmonisation et amélioration des logs serveur, **le contenu des logs a changé**.
- Refactorisation login/logout, le login retourne un nouveau cookie (corrige session fixation).
- Correction de plusieurs bugs et refactorisation de méthodes.
- Rechercher par uuid ou partie d'uuid.
- UserManager: Le champs username est inactif en mode "Edition".
- Présentation des contrôles sous la forme d'un tableau.
- Duplication d'un contrôle.
- Support des dépôts git de type "Gitea" avec authentification, permet ainsi l'authentification Github pour les projets privés, valeur (HTTP HEADER) Key: Authorization value: Bearer <You token>
- Authentification Github globale pour supprimer la barrière "rate-limit". La valeur est prise seulement dans le cas où le contrôle ne dispose pas déjà d'une authentification spécifique.
- Pour les applications n'offrant pas de point d'entrée de niveau de version, possibilité de saisir la valeur de la version utilisée, ceci peut aussi permettre de suivre l'évolution d'une application qui n'est pas en production.
