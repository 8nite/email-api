FROM mhart/alpine-node
RUN apk add --update git && \
  rm -rf /tmp/* /var/cache/apk/*
RUN npm install -g yarn && \
  npm install -g npm-run-all
RUN mkdir /app && \
  cd /app && \
  git clone https://0206a657b317ae155248d53becfedaccc14c0859@github.com/herberttung/jira-api.git && \
  cd /app/jira-api && \
  yarn install && \
  yarn build
WORKDIR /app/jira-api/
EXPOSE 0.0.0.0:3000:3000
COPY .env .
ENV LD_LIBRARY_PATH /opt/oracle/instantclient_19_6 && node ./dist-server/app
CMD ["npm", "server"]
