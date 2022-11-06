FROM node:16.17.0-alpine3.16
WORKDIR /app

# Install bash for using terminal from DSM
RUN apk add --no-cache bash

COPY backup.sh .

# Install all the service node dependencies
RUN npm install -g cloudflare-backup

# Add crontab entry to run all days at 2AM
RUN echo "0 2 * * * /bin/bash /app/backup.sh" >> /var/spool/cron/crontabs/root

CMD ["crond", "-f"]