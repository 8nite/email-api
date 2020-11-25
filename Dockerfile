FROM mhart/alpine-node
RUN apk add --update git && \
  rm -rf /tmp/* /var/cache/apk/*
RUN npm install -g yarn && \
  npm install -g npm-run-all && \
  npm install -g forever
RUN mkdir /app && \
  cd /app && \
  git clone https://github.com/herberttung/email-api.git
RUN cd /app/email-api && \
  git checkout master && \
  yarn install && \
  yarn build
WORKDIR /app/email-api/
ENV LD_LIBRARY_PATH /opt/oracle/instantclient_19_6 && node ./dist-server/app
CMD ["npm", "start"]