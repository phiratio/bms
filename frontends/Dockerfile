FROM node:11.10.0-alpine
ARG app
# Set a working directory
WORKDIR /usr/src/app

COPY ./apps/build/${app}/ .
COPY ./apps/build/${app}/ .

# Install Node.js dependencies
RUN yarn install --production --no-progress

# Copy application files
COPY ./apps/build/${app}/ .

# Run the container under "node" user by default
USER node

CMD [ "node", "server.js" ]
