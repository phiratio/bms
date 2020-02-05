'use strict';
/**
 * Socket.io/utils/index.js
 *
 * @description: A set of functions to avoid code duplications
 */
const cookie = require('cookie');
const _ = require('lodash');
const semver = require('semver');
const appVersion = require('../../../package').version;

module.exports = {
  /**
   * Socket io Authentication function
   * @param socket
   * @param next
   * @returns {Promise<void>}
   */
  authentication: async (socket, next) => {
    const notAuthorizedMesage = { statusCode: 401, error: 'You are not authorized' };
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    let token = cookies['id_token']; // TODO: Move name of the cookie to config file
    let version = null;
    const clientVersion = _.get(socket.handshake, 'query.version') || false;
    // Get token from provided query string
    if (token  === undefined) token = _.get(socket.handshake, 'query.id_token') || false;
    if (clientVersion && semver.valid(clientVersion) && semver.satisfies(clientVersion,`<=${appVersion.slice(0,3)}.x`)) {
      version = semver.clean(clientVersion);
    }
    if (token && version) {
      // verify if provided JWT is valid
      await strapi.plugins['users-permissions'].services.jwt.verify(token)
        .then(async userSignature => {
          const user = await strapi.services.accounts.fetch({ _id: userSignature.id });
          if (user && !user.blocked) {
            socket.state = {
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar,
              email: user.email,
              id: userSignature.id,
              role: user.role,
              version,
            };
            // Log socket connection to redis
            await strapi.connections.redis.set(`accounts:${userSignature.id}:sockets:${socket.id}`, JSON.stringify({ socketid: socket.id, version, jwtSignature: token.split('.')[2] }));
            next();
          } else {
            socket.emit('disconnect', notAuthorizedMesage);
            next(new Error(JSON.stringify(notAuthorizedMesage)));
          }
        })
        .catch(() => {
          socket.emit('disconnect', notAuthorizedMesage);
          next(new Error(JSON.stringify(notAuthorizedMesage)));
        });
    } else {
      socket.emit('disconnect', notAuthorizedMesage);
      next(new Error(JSON.stringify(notAuthorizedMesage)));
    }
  },
};
