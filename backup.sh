#!/bin/bash
DIR="/storage"

if [ -d "$DIR" ]; then

    # volume exists
    # delete files older than ${BACKUP_DAYS} days
    echo "== Deleting files older than ${BACKUP_DAYS} days =="
    find ${DIR} -type f -name 'zones-*.txt' -mtime +${BACKUP_DAYS} -exec rm {} \;
    echo "== Files deleted =="

    /usr/local/bin/cf-backup > ${DIR}/zones-$(date +'%Y%m%d-%s').txt
else
    /usr/local/bin/cf-backup > /app/zones-$(date +'%Y%m%d-%s').txt
fi