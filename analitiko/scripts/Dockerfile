# This is the image for analitiko automated model deployment
# Uses ubuntu:20.04 image and node.js 16.x+
# Command to build:
# > docker build --network host -t analitiko:v0.1.0 .
# Docker version 20.10.9, build c2ea9bc
# Spin up a docker postgres image and expose port 5432
# PostgreSQL base image reference: https://hub.docker.com/_/postgres/?tab=description
# Command to run:
# > docker run --expose <SHINY_PORT> /bin/bash -c "/root/deploy.sh <MODEL_DIR> <DB_USERNAME> <DB_PASSWORD> <DB_NAME>"

FROM ubuntu:20.04
LABEL name = support@hiahatf.org
# update ubuntu
RUN apt update -y && apt upgrade -y
# set tzdata non-interactively
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install tzdata
# install wget, curl, R and git
RUN apt install -y wget curl git gnupg
# Installing Node and build analitiko from source
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN source /root/.bashrc && nvm install 16 && git clone https://github.com/hyahatiph-labs/infosec.git \
    && cd infosec/analitiko && npm i && npm run build
RUN cp /root/.nvm/versions/node/v16*/bin/node /usr/bin/
SHELL ["/bin/bash", "--login", "-c"]
# install monero
RUN wget https://downloads.getmonero.org/cli/linux64
RUN tar xvf linux64*
# install r statistical programming and odbc bindings for postgresql
RUN apt install -y r-base r-cran-rodbc odbc-postgresql
# install R packages
COPY ./packages.R /root
RUN Rscript /root/packages.R
# copy the R environment file - create as required
COPY .Renviron /root/infosec/analitiko/.Renviron
# bake in the deployment bash script
COPY ./deploy.sh /root
RUN chmod +x /root/deploy.sh
