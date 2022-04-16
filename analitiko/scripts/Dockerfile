# This is the image for analitiko automated model deployment
# Uses fedora:35 image and node.js 16.x.x+, podman version 3.4.4
# Command to build:
# podman build --network host -t analitiko:vx.x.x .
# Command to run:
# > podman run --rm -P -p 127.0.0.1:4242:4242 --name analitiko \
# > analitiko:v0.1.0 /bin/bash -c "sh sync-analitiko.sh <MODEL_DIR> \
# > <PG_USERNAME> <PG_PASSWORD> <DEVICE_IP> <DB_NAME> \ 
# > <NUM_BLOCKS> http://<DEVICE_IP>:38081 <SHINY_PORT>"

FROM fedora
LABEL name = support@hiahatf.org
# Update fedora
RUN dnf -y update
# Install necessary packages
RUN dnf install -y wget curl git gnupg cmake postgresql-odbc.x86_64 R.x86_64 \
    g++ libjpeg-turbo.x86_64 libjpeg-turbo-devel.x86_64 openjpeg2.x86_64 R-RODBC.x86_64 \
    unixODBC.x86_64 unixODBC-devel.x86_64 postgresql postgresql-server nodejs.x86_64 bzip2
# Clone Analitiko source code
RUN git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/analitiko && npm i
# Install monero
RUN mkdir xmr
RUN cd xmr && wget https://downloads.getmonero.org/cli/monero-linux-x64-v0.17.3.0.tar.bz2
RUN cd xmr && tar xvf monero-linux-x64*.tar.bz2
# Manually build the R library
COPY Rpackages/ /usr/lib64/R/library/
# Install Process Manager 2 for fault tolerance
RUN npm i pm2 -g
# Bake in the deployment bash scripts
COPY ./deploy.sh .
COPY ./sync-analitiko.sh .
RUN chmod +x sync-analitiko.sh && chmod +x /deploy.sh
