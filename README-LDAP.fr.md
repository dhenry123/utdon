J'ai déssiné cette application dans le but de disposer d'un outil permettant d'automatiser les mises à jour des applications FOSS.
Cette tâche peut être confiée à plusieurs personnes dans une organisation et selon le niveau de responsabilité de chacun, y comprise les chaîne CI/CD.

Actuellement il y a peu de points d'entrées API.

- Gestion des contrôles
- Update des versions
- Une entrée qui retourne uniquement la dernière version enregistrée sur le contrôle. Ma chaîne CI utilise ce point d'entrée pour connaitre le numéro de version à installer.
- Appel des action par un ordonnanceurs
  ...je vais plutôt ajouter un résumé de ces points dans la documentation.

## Authentification/Autorisations

J'ai prévu deux méthodes :

- natif pour ceux qui n'ont pas de LDAP (méthode actuelle + gestion groupes).
- LDAP

**PS**: Il n'est pas possible de basculer d'un mode à l'autre (du moins d'une manière automatique...)

L'utilisateur installe "utdon", indique la configuration LDAP et le soft démarre avec ces paramètres.
L'organisation devra disposer d'un groupe "utdon_admin" (ou pattern fixé dans la configuration), puis de un ou plusieurs groupes selon les besoins "utdon\_\*" (pattern défini dans la configuration LDAP de l'application). Donc deux types basiques :

- admins
- users

L'application Utdon doit s'adapter à la configuration sécurité de l'environnement dans lequel elle est exécutée.

Chaque groupe se verra assigné un rôle :

- read
- write
- execution (actions)
- All

Le POC et la matrice d'autorisations sont en cours d'élaboration.

Je mettrai à disposition un container "openldap", pré-chargé pour les tests automatisés.
