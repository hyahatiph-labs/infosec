# Docker

## Automated Model Deployment

Below is a recipe for spinning up a PostgreSQL docker image followed by the Analitiko
docker image. Feel free to create your own scripts. (Default password is `postgres`)

1. Pull the official PostgreSQL and Analitiko docker images

```bash
docker pull postgres && docker pull hiahatf/analitiko:vX.X.X
```

2. Start the PostgreSQL image

```bash
docker run --rm -P -p <DEVICE_IP>:5432:5432 -e POSTGRES_PASSWORD="<PASSWORD>" --name pg postgres:latest
```

3. Start Analitiko image

```bash
docker run --rm -P -p 127.0.0.1:4242:4242 --name analitiko analitiko:vX.X.X \
/bin/bash -c "sh deploy.sh <MODEL_DIR> <PGDB_USERNAME> <PGDB_PASSWORD> \
<DEVICE_IP> <DB_NAME> <NUM_BLOCKS> http://<MONERO_RPC_HOST:PORT> <SHINY_PORT>"
```

OR if you already have a monero node running

```bash
docker run --rm -P -p 127.0.0.1:4242:4242 --name analitiko analitiko:vX.X.X \
/bin/bash -c "sh sync-analitiko.sh <MODEL_DIR> <PGDB_USERNAME> <PGDB_PASSWORD> \
<DEVICE_IP> <DB_NAME> <NUM_BLOCKS> http://<MONERO_RPC_HOST:PORT> <SHINY_PORT>"
```

### Extra Flavor - TOR

* Install tor for your system
* Add the lines below to `/etc/tor/torrc`

```bash
HiddenServiceDir /var/lib/tor/shiny/
HiddenServicePort 80 127.0.0.1:<SHINY_PORT>
```

That's pretty much it. Sit back and wait for the blockchain and analytics middleware to sync up.
The model should be available at port 4242 in this example. Then you can do some cool stuff such as
running the interactive models with changes on user input. Or put them behind prokurilo and monetize them.
