# Installation - [Translated by deepl.com]

The appplication doesn't support "https", so you'll need to use this product behind a reverse proxy.

## Docker

- By default, the container is rootless, run with account/group: 1001:1001 (utdon:utdon), **you can specify different values**.
- A volume is required to store databases: user/controls, its owner/group must match your settings (default 1001:1001)
- An exposure port: the port exposed by the container is 3015.
- The container can be run "ReadOnly".

### Service startup

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

# Generic
chown 1001:1001 data
sudo docker run -d -v $(pwd)/data:/app/data -p $port:3015 -e USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET -e DATABASE_ENCRYPT_SECRET=test ghcr.io/dhenry123/utdon:$tag

# or "Hardened" mode - User/group arbitrary and read-only
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
