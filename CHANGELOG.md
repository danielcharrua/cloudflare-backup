# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-07

### Added

- **Scoped API token support** via `CF_API_TOKEN`, sent as `Authorization: Bearer`.
  Create it with `Zone:Read` and `DNS:Read` and nothing else, instead of handing
  a cron job the Global API Key, which grants full control of the account —
  every zone, SSL and billing. `CF_EMAIL` + `CF_TOKEN` keeps working.
- Each zone block now records the **account it belongs to** (`;; Account:`).
  `/zones` spans every account the credential can reach, so a dump can mix
  several; knowing where a domain lives matters when restoring it.

### Fixed

- **TXT records were exported double-quoted.** CloudFlare already returns TXT
  content quoted, and splits values over 255 characters into several quoted
  chunks; quoting that again nested the quotes, so every SPF, DKIM and DMARC
  record carried literal quote characters as part of its value and would restore
  incorrectly.
- **A failed run produced an empty backup and exited 0.** Responses were never
  checked for HTTP status or the API's own `success` flag, so a rejected or
  under-permissioned credential yielded an empty result set, no error, and a
  backup file that looked fine. Failures now carry CloudFlare's own message and
  a non-zero exit code, and an empty zone list is treated as a failure.
- Piping the output into `head` or `less` no longer dies with an `EPIPE` stack
  trace and a non-zero exit.
- An undefined variable turned the zone-records error path into a
  `ReferenceError` instead of reporting the actual problem.

### Changed

- Zones are fetched one at a time and sorted by account and name, so the output
  is stable. Two consecutive backups can be diffed to see exactly what changed.
  They were previously requested in parallel and printed in whatever order the
  responses arrived.

## [1.1.0] - 2023-03-13

### Added

- Docker image, published for `linux/amd64` and `linux/arm64/v8`, running the
  backup on a daily cron.
- Automatic removal of backups older than `BACKUP_DAYS` (defaults to 180).
- DNS record comments are included in the exported zone files.
- Documentation for running it on a NAS.

## [1.0.0] - 2015-04-01

Initial release, forked from [rmg/cloudflare-backup](https://github.com/rmg/cloudflare-backup)
by Ryan Graham. Dumps the DNS records of every CloudFlare zone to stdout in a
BIND compatible format.

[1.2.0]: https://github.com/danielcharrua/cloudflare-backup/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/danielcharrua/cloudflare-backup/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/danielcharrua/cloudflare-backup/releases/tag/v1.0.0
