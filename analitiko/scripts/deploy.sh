#!/bin/bash

# This bash script starts monerod and analitiko blockchain
# analytics middleware. The the shiny server for the associated model
# will also be deployed. Automated model deployments will not
# have accurate information until both Monero LMDB and Analitiko
# PGDB have completed synchronization.
MODEL=$1
cd /infosec/analitiko && git pull && npm run clean && npm run build
echo "Starting monerod..."
cd / && ./xmr/monero*/monerod --prune-blockchain --detach
echo "Starting analitko..."
cd /infosec/analitiko && node dist/analitiko.js -u $2 -c $3 -h $4 -p 5432 -n $5 \
-l ERROR,INFO,PERF --num-blocks $6 --daemon-host $7 &
echo "deploying $MODEL..."
Rscript scripts/$MODEL/app.R
