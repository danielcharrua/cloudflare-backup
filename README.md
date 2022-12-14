<p align="center"><img src="/art/socialcard.png" alt="Social Card of Laravel Nice Error Pages"></p>

Simple console tool for backing up your CloudFlare hosted DNS records.

## Installation

`npm install -g cloudflare-backup`

## Usage

### Local machine

Set `CF_EMAIL` and `CF_TOKEN` environment variables to your CloudFlare account
email address and API key, respectively, and run `cf-backup`. All of the DNS
records for all of your zones will be dumped to stdout in a BIND compatible
format.

`CF_EMAIL=<cf-account-email-address> CF_TOKEN=<cf-account-global-api-key> cf-backup > zones.bind.txt`

### Docker

The package can be run inside a container that runs a cronjob every 24h. 
You can download and use the image https://hub.docker.com/r/danielpcostas/cloudflare-backup
The output txt file will be placed on `/app` directory.

```
docker run \
    --name cloudflare-backup \
    --env 'CF_EMAIL=<cf-account-email-address>' \
    --env 'CF_TOKEN=<cf-account-global-api-key>' \
    --restart=always \
    cloudflare-backup
```

For data persistency of the output file create a volume and mount it in `/storage`. In this case the output txt file will be placed on `/var/docker-data/cloudflare-backup`. Change this route to the one you use on your filesystem.

```
docker run \
    --name cloudflare-backup \
    --volume /var/docker-data/cloudflare-backup:/storage \
    --env 'CF_EMAIL=<cf-account-email-address>' \
    --env 'CF_TOKEN=<cf-account-global-api-key>' \
    --restart=always \
    cloudflare-backup
```

### Synology DSM (with Docker)

You can use this package with Synology DSM after installing docker and adding the docker image. When running the container from DSM you can add the ENV variables, mount the volume and the restart policy.

## Credits

Special thanks to [🦊🥕 Satoshiba 🔑⚡️](https://twitter.com/satoshiba21) for the help with Docker.
*This package is a fork of [rmg/cloudflare-backup](https://github.com/rmg/cloudflare-backup). Originally created by Ryan Graham.*

## Send some love

If you find this package usefull consider sending some sats using the Lightning Network ⚡️
<p align="center"><a href="lightning:LNURL1DP68GURN8GHJ7MRWW3UXYMM59E3K7MF09EMK2MRV944KUMMHDCHKCMN4WFK8QTMYV9HXJETVWP3K7UM5V9ES4MRMQW"><img width="180" src="/art/qr-lnurl.svg" alt="qr-lnurl"></a></p>