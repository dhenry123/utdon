#!/bin/bash
installdir="/usr/local/utdon"
service="utdon"

# NodeJS is needed
which node >/dev/null 2>&1
if [ "$?" == "1" ]; then
    echo "You have to install nodejs package (==LTS-20)"
    exit 1
fi

# Build application
npm install && npm run build
cd client && npm install && npm run build && cd ..
rm -r node_modules && npm install --omit=dev

sudo mkdir -p $installdir/public $installdir/data
sudo cp -R dist/* $installdir/.
sudo cp ./openapi.yaml $installdir/.
sudo cp -R client/dist/* $installdir/public/.
sudo cp -R node_modules $installdir/.
rm -r node_modules dist client/node_modules client/dist

# Service installation
echo "################"
echo ""
echo "UTDON has been built and installed in the directory '$installdir'"
echo ""
echo "- Create user/group: $service/$service"
echo ""
echo "- Then 'chown $service:$service $installdir/data"
echo ""
echo "- Generate two secrets"
USER_ENCRYPT_SECRET="$(openssl rand -base64 32)"
echo "USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET"
DATABASE_ENCRYPT_SECRET="$(openssl rand -base64 32)"
echo "DATABASE_ENCRYPT_SECRET=$DATABASE_ENCRYPT_SECRET"
echo ""
echo "*** Keep both secrets safe.... ***"
echo ""
echo "- Create service in /etc/systemd/system/$service.service"
echo ""
cat <<EOF
[Unit]
Description=UTDON - Application for tracking obsolete FOSS applications
After=networking.service
[Service]
WorkingDirectory=$installdir
ExecStart=node main.js
User=$service
Group=$service
Environment="USER_ENCRYPT_SECRET=$USER_ENCRYPT_SECRET"
Environment="DATABASE_ENCRYPT_SECRET=$DATABASE_ENCRYPT_SECRET"
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$service
Restart=always
[Install]
WantedBy=multi-user.target
EOF

echo ""
echo ""
# you have to daemon-reload for systemd to recognize the new unit
echo "First, reload systemd: 'systemctl daemon-reload', then"
echo "Start service: 'systemctl start $service'"
echo ""
echo "################"
