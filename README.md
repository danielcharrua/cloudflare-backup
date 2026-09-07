<p align="center"><img src="/art/socialcard.png" alt="Social Card of Laravel Nice Error Pages"></p>

Simple console tool for backing up your CloudFlare hosted DNS records.

[🇪🇸 Spanish guide here](https://charrua.es/blog/automatiza-backups-dns-cloudflare/).

## Installation

`npm install -g danielcharrua/cloudflare-backup`

## Usage

### Credentials

Two ways to authenticate. **Prefer a scoped API token.**

**API token (recommended).** In the CloudFlare dashboard: *My Profile → API Tokens → Create Token → Create Custom Token*. Give it only:

- Permissions: **Zone → Zone → Read** and **Zone → DNS → Read**
- Zone Resources: **Include → All zones from all accounts**, so zones in client accounts you have access to are covered too

Then set `CF_API_TOKEN`. Nothing else is needed — the token identifies you on its own.

**Global API Key (legacy).** Set `CF_EMAIL` and `CF_TOKEN`. This key grants full control of your entire account — every zone, SSL, billing — so only use it if a scoped token is not an option.

### Local machine

Every DNS record of every zone the credential can reach is dumped to stdout in a BIND compatible format, grouped by account and sorted by name, so two backups can be diffed to see what changed. It also saves zone's comments ✌️

```
CF_API_TOKEN=<cf-api-token> cf-backup > zones.bind.txt
```

Or with the legacy key:

```
CF_EMAIL=<cf-account-email-address> CF_TOKEN=<cf-account-global-api-key> cf-backup > zones.bind.txt
```

On failure the reason goes to stderr and the exit code is non-zero, with stdout left empty. The tool never exits successfully with an empty dump, so a rejected or under-permissioned credential cannot quietly produce an empty backup file.

### Docker

The package can be run inside a container that runs a cronjob every 24h. 
You can download and use the image https://hub.docker.com/r/danielpcostas/cloudflare-backup
The output txt file will be placed on `/app` directory.

```
docker run \
    --name cloudflare-backup \
    --env 'CF_API_TOKEN=<cf-api-token>' \
    --restart=always \
    danielpcostas/cloudflare-backup
```

#### Data persistency

For data persistency of the output file create a volume and mount it in `/storage`. In this case the output txt file will be placed on `/home/username/cloudflare-backup`. Change this route to match some folder on your filesystem.

```
docker run \
    --name cloudflare-backup \
    --volume /home/username/cloudflare-backup:/storage \
    --env 'CF_API_TOKEN=<cf-api-token>' \
    --restart=always \
    danielpcostas/cloudflare-backup
```

#### Auto delete backups

By default the backup zones files will be persisted for 6 months (180 days). This will give you plenty of time to have and manage old records. You can customize this value to fit your needs.

```
docker run \
    --name cloudflare-backup \
    --volume /home/username/cloudflare-backup:/storage \
    --env 'CF_API_TOKEN=<cf-api-token>' \
    --env 'BACKUP_DAYS=365' \
    --restart=always \
    danielpcostas/cloudflare-backup
```

### NAS (with Docker)

You can use this package with with your NAS after installing docker and adding the docker image. When running the container you can add the `.env` variables, mount the volume and the restart policy.

## Credits

Special thanks to [🦊🥕 Satoshiba 🔑⚡️](https://twitter.com/satoshiba21) for the help with Docker.<br />
This package is a fork of [rmg/cloudflare-backup](https://github.com/rmg/cloudflare-backup). Originally created by Ryan Graham.

## Send some love

To keep working and maintainig this free package [please consider buying me a coffee](https://charrua.es/donaciones). Thank you ✌️