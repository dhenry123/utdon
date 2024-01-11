# Installation

L'appplication ne supporte pas "https", vous devrez utiliser ce produit derrière un reverse proxy.

## Docker

- Par défaut, le container est "rootless", exécuté avec le compte/group : 1001:1001 (utdon:utdon), **vous pouvez spécifier des valeurs différentes**
- Un volume est nécessaire pour stocker les bases de données: user/controls, son propriétaire/groupe doivent correspondre à vos paramètres (par défaut 1001:1001)
- Un port d'exposition, le port exposé par le container est 3015
- Le container peut-être exécuté "ReadOnly"

### Démarrage du service

```
# tag version
tag="1.2.0"
# Which port do you expose the service on?
port=3015
# Generate secrets
USER_ENCRYPT_SECRET=$(openssl rand -base64 32)
echo "1st secret : USER_ENCRYPT_SECRET = $USER_ENCRYPT_SECRET"
DATABASE_ENCRYPT_SECRET=$(openssl rand -base64 32)
echo "2nd secret : DATABASE_ENCRYPT_SECRET = $DATABASE_ENCRYPT_SECRET"
echo "Keep both secrets safe...."
# Creating local volume
mkdir data

# Générique
chown 1001:1001 data
sudo docker run -d -v $(pwd)/data:/app/data -p $port:3015 -e USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET -e DATABASE_ENCRYPT_SECRET=test ghcr.io/dhenry123/utdon:$tag

# ou mode "Durci" - Utilisateur/groupe arbitraires et lecture seule
# USER=1250036
# GROUP=1300006
# chown $USER:$GROUP data
# sudo docker run -d -u $USER:$GROUP --read-only -p   port:3015 -v $(pwd)/data:/data -e USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET -e DATABASE_ENCRYPT_SECRET=$DATABASE_ENCRYPT_SECRET ghcr.io/dhenry123/utdon:$tag

```

## Legacy

```shell
# Execute
./install-legacy.sh

# Follow output instructions

```
