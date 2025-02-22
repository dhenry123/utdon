# Installation

The application does not support HTTPS, so you'll need to use this product behind a reverse proxy.

## Self-signed SSL certificates

If you don't have a Public Key Infrastructure (PKI), and are using self-signed SSL certificates for your services, you'll need to disable certificate checking by Nodejs, by supplying the environment variable :
NODE_TLS_REJECT_UNAUTHORIZED=0

Otherwise, you'll need to :

- Copy the required CA certificates (PEM format) into the “cacerts” directory of the installation.
- Provide the list of CA certificates to be used via the environment variable: NODE_EXTRA_CA_CERTS
  Example:

With a container, CA certificates are available in “/app/cacerts”, you deposit two CA certificates: “proxy.ca” and “mydomain.ca”.
The environment variable will be composed as follows:

NODE_EXTRA_CA_CERTS=“/app/certs/proxy.ca,/app/certs/mydomain.ca”`.

In the case of a standard installation, specify the absolute path of all additional CA certificates.

According to the documentation, this environment variable cannot be modified during NodeJS execution [Doc](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).

## Corporate proxy

If your organization implements a proxy (Squid, Trafficserver, ...), you'll need to provide the necessary environment:

- Proxy (non SSL) :

  - HTTP requests : **HTTP_PROXY**=“http://[ip or hostname of proxy]:[port]”. Ex: HTTP_PROXY="http://monproxy:3128”
  - HTTPS requests: **HTTPS_PROXY**=“http://[ip or proxy host name]:[port]”. Ex : HTTP_PROXY=“Usually the value of HTTP_PROXY”.

- Proxy (SSL) :

  - You will also need to provide the contents of the CA certificate for this connection (“base64” format). Copy (directory “./cacerts”).
    This file must be in PEM format. Enter the file name as the value of the **PROXYCA_CERT** variable.
    **PROXYCA_CERT**="proxy.ca”
  - HTTP requests: **HTTP_PROXY**=“http://[ip or hostname of proxy]:[port]”. Ex : HTTP_PROXY="http://monproxy:3128”
  - HTTPS requests: **HTTPS_PROXY**=“https://[ip or proxy host name]:[port]”. Ex: HTTP_PROXY="https://monproxy:31283”

- - Exclusions, the hosts mentioned in this variable will not transit through the proxy, e.g. :
    NO_PROXY='\*.mytinydc.com,192.168.1.0/24,localhost,127.0.0.1'

## Docker

- By default, the container is “rootless”, executed with the account/group: “1001:1001” (utdon:utdon), **you can specify different values**.
- A volume is required to store databases: user/controls, the owner/group pairing must match the parameters used to run the container (default “1001:1001”).
- An exposure port, the port exposed by the container is: 3015.
- The container can be run “readonly”.

### Service start-up

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

Prepare file **”./install-legacy.sh ”** :

- To manage SSL certificates, adjust the values :

  - NODE_EXTRA_CA_CERTS="”
  - NODE_TLS_REJECT_UNAUTHORIZED="”

- If you're using a corporate **proxy**, adjust the values:

  - HTTP_PROXY="”
  - HTTPS_PROXY="”
  - PROXYCA_CERT="”

Start installation by running :

```shell
# Execute
./install-legacy.sh

# Follow output instructions

```
