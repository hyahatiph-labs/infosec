# This is the image for bootstrapping the himitsu development environment
# Uses the latest stable ubuntu and node.js 16.x+
# Command to build is <docker build -t himitsu:v0.1.0 .>
# Docker version 20.10.9, build c2ea9bc
FROM ubuntu 
LABEL name = support@hiahatf.org

# update ubuntu
RUN apt-get update -y && apt-get upgrade -y
# install wget curl and git
RUN apt-get install -y wget curl git
# Installing Node and build the extension from source
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN source /root/.bashrc && nvm install 16 && git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/himitsu && npm i && npm run build
SHELL ["/bin/bash", "--login", "-c"]