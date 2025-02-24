# Installation

L'application ne supporte pas "HTTPS", vous devrez utiliser ce produit derrière un "reverse proxy".

## Certificats SSL auto-signés

Si vous ne disposez pas d'une Infrastructure à Clé Publique (PKI), et que vous utilisez des certificats SSL auto-signés pour vos services, vous devrez désactiver le contrôle des certificats opéré par Nodejs, en fournissant la variable d'environnement :
NODE_TLS_REJECT_UNAUTHORIZED=0

Dans le cas contraire, vous devrez :

- Copier les certificats CA nécessaires (format PEM), dans le répertoire "cacerts" de l'installation.
- Fournir la liste des certificats CA à utiliser au travers de la variable d'environnement : NODE_EXTRA_CA_CERTS

Exemple :

Avec un container, les certificats CA sont disponibles dans "/app/cacerts", vous déposez deux certificats CA : "proxy.ca" et "mydomain.ca".
La variable d'environnement sera composée ainsi :

`NODE_EXTRA_CA_CERTS="/app/certs/proxy.ca,/app/certs/mydomain.ca"`

Dans le cas d'une installation standard, indiquer le chemin absolu de tous les certificats CA additionnels.

Conformément à la documentation, cette variable d'environnement ne peut être modifiée durant l'exécution de NodeJS [Doc](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).

## Proxy Corporate

Si votre organisation implémente un proxy (Squid, Trafficserver, ...), vous devrez fournir l'environnement nécessaire :

- Proxy (non SSL) :

  - Requêtes HTTP : **HTTP_PROXY**="http://[ip ou nom hôte du proxy]:[port]". Ex : HTTP_PROXY="http://monproxy:3128"
  - Requêtes HTTPS : **HTTPS_PROXY**="http://[ip ou nom hôte du proxy]:[port]". Ex : HTTP_PROXY="Généralement la valeur de HTTP_PROXY"

- Proxy (SSL) :

  - Vous devrez également fournir le contenu du certificat CA pour cette connexion (Format "base64"). Copier (répertoire "./cacerts").
    Ce fichier doit être au format PEM. Indiquer le nom du fichier comme valeur de la variable **PROXYCA_CERT**.
    **PROXYCA_CERT**="proxy.ca"
  - Requêtes HTTP : **HTTP_PROXY**="http://[ip ou nom hôte du proxy]:[port]". Ex : HTTP_PROXY="http://monproxy:3128"
  - Requêtes HTTPS : **HTTPS_PROXY**="https://[ip ou nom hôte du proxy]:[port]". Ex : HTTP_PROXY="https://monproxy:31283"

- Exclusions, les hôtes mentionnés dans cette variable d'environnement ne transiteront pas par le proxy, exemple :
  NO_PROXY='\*.mytinydc.com,192.168.1.0/24,localhost,127.0.0.1'

## Docker

- Par défaut, le container est "rootless", exécuté avec le compte/group : "1001:1001" (utdon:utdon), **vous pouvez spécifier des valeurs différentes**.
- Un volume est nécessaire pour stocker les bases de données : user/controls, le couple propriétaire/groupe doit correspondre aux paramètres utilisés pour exécuter le container (par défaut "1001:1001").
- Un port d'exposition, le port exposé par le container est : 3015.
- Le container peut être exécuté "readonly".

### Démarrage du service

```
# tag version
tag="1.9.0"
# Which port do you expose the service on?
port=3015
# Generate secrets
USER_ENCRYPT_SECRET=$(openssl rand -base64 32)
echo "1st secret : USER_ENCRYPT_SECRET = $USER_ENCRYPT_SECRET"
DATABASE_ENCRYPT_SECRET=$(openssl rand -base64 32)
echo "2nd secret : DATABASE_ENCRYPT_SECRET = $DATABASE_ENCRYPT_SECRET"
echo "Keep both secrets safe...."
# CA certs
NODE_EXTRA_CA_CERTS=""
# NODEJS ssl certificates check 0: disabled, default: enabled
NODE_TLS_REJECT_UNAUTHORIZED=""
# Proxy environment - set values if required
HTTP_PROXY="
HTTPS_PROXY="
# if ssl proxy ca certificats name
PROXYCA_CERT=""
# Creating local volume
mkdir data cacerts

# Generic
chown 1001:1001 data cacerts
sudo docker run -d -v $(pwd)/cacerts:/app/cacerts -v $(pwd)/data:/app/data -p $port:3015 -e USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET -e DATABASE_ENCRYPT_SECRET=test -e NODE_TLS_REJECT_UNAUTHORIZED=$NODE_TLS_REJECT_UNAUTHORIZED -e NODE_EXTRA_CA_CERTS=$NODE_EXTRA_CA_CERTS -e HTTP_PROXY=$HTTP_PROXY -e HTTPS_PROXY=$HTTPS_PROXY -e PROXYCA_CERT=$PROXYCA_CERT ghcr.io/dhenry123/utdon:$tag

# or “Hardened” mode - User/group arbitrary and read-only
# USER=1250036
# GROUP=1300006
# chown $USER:$GROUP data
# sudo docker run -d -u $USER:$GROUP --read-only -p $port:3015 -v $(pwd)/cacerts:/app/cacerts -v $(pwd)/data:/data -e USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET -e NODE_TLS_REJECT_UNAUTHORIZED=$NODE_TLS_REJECT_UNAUTHORIZED -e DATABASE_ENCRYPT_SECRET=$DATABASE_ENCRYPT_SECRET -e NODE_EXTRA_CA_CERTS=$NODE_EXTRA_CA_CERTS -e HTTP_PROXY=$HTTP_PROXY -e HTTPS_PROXY=$HTTPS_PROXY -e PROXYCA_CERT=$PROXYCA_CERT ghcr.io/dhenry123/utdon:$tag

```

## Legacy

Préparer le fichier **"./install-legacy.sh"** :

- Pour gérer les certificats SSL, ajuster les valeurs :

  - NODE_EXTRA_CA_CERTS=""
  - NODE_TLS_REJECT_UNAUTHORIZED=""

- Si vous utilisez un **proxy** corporate, ajuster les valeurs :

  - HTTP_PROXY=""
  - HTTPS_PROXY=""
  - PROXYCA_CERT=""

Démarrer l'installation en exécutant :

```shell
# Execute
./install-legacy.sh

# Follow output instructions

```
