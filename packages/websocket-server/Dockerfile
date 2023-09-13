ARG NODE_VERSION=18.17.1
ARG GUACD_VERSION=1.5.3

FROM node:${NODE_VERSION}-alpine AS node

FROM guacamole/guacd:${GUACD_VERSION}

# Copy nodejs from node alpine image
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

# Install environment dependencies
USER root
RUN apk update && apk add --no-cache pulseaudio supervisor

# Setup pulseaudio to listen without authentication on private network
RUN sed -ie 's|#load-module module-native-protocol-tcp|load-module module-native-protocol-tcp auth-ip-acl=172.17.0.3/16 auth-anonymous=1|g' /etc/pulse/default.pa

RUN mkdir -p /tmp/guacd-drives && chown -R guacd:guacd /tmp/guacd-drives
VOLUME /tmp/guacd-drives

USER guacd
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV LOG_LEVEL=info
EXPOSE 8080

CMD [ "supervisord", "-c", "supervisor.conf"]