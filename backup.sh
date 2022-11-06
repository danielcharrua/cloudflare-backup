#!/bin/bash
DIR="/storage/"
if [ -d "$DIR" ]; then
    # volume exists
    /usr/local/bin/cf-backup > /storage/zones-$(date +'%Y%m%d-%s').txt
else
    /usr/local/bin/cf-backup > /app/zones-$(date +'%Y%m%d-%s').txt
fi