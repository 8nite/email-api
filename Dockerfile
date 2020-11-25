FROM mhart/alpine-node
RUN apk add --update git && \
  rm -rf /tmp/* /var/cache/apk/*
RUN npm install -g yarn && \
  npm install -g npm-run-all && \
  npm install -g forever && \
  yarn install && \
  yarn build
WORKDIR /
ENV LD_LIBRARY_PATH /opt/oracle/instantclient_19_6 && node ./dist-server/app
CMD ["npm", "start"]
