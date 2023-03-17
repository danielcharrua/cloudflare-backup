FROM node:lts-alpine3.17
WORKDIR /app

# Define how many days to retain backup
ENV BACKUP_DAYS=180

# Install bash for using terminal from DSM
RUN apk add --no-cache bash

# Install git for using custom npm package
RUN apk add --no-cache git

COPY backup.sh .

# Install all the service node dependencies
RUN npm install -g git+https://github.com/danielcharrua/cloudflare-backup.git

# Add crontab entry to run all days at 2AM
RUN echo "0 2 * * * /bin/bash /app/backup.sh" >> /var/spool/cron/crontabs/root

CMD ["crond", "-f"]