#!/bin/bash

# This bash script starts monerod and analitiko blockchain
# analytics middleware. The the shiny server for the associated model
# will also be deployed. Automated model deployments will not
# have accurate information until both Monero LMDB and Analitiko
# PGDB have completed synchronization
MODEL=$1
echo "Starting monerod..."
./root/monero*/monerod --prune-blockchain --detach
echo "Starting analitko..."
/usr/bin/node /root/infosec/analitiko/dist/analitiko.js -u $2 -c $3 -h localhost -p 5432 -n $4 -l ERROR,INFO
echo "deploying $MODEL..."
Rscript /root/infosec/analitiko/scripts/$MODEL/app.R
