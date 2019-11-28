'use strict';
const EventEmitter = require('events');
/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = async cb => {
  // Initialize Socket.io server
  strapi.services['socket-io'].server();
  // Make instance of Event Emitter globally accessible
  strapi.services.eventemitter = new EventEmitter();
  // Initialize Redis
  strapi.hook.redis.load.initialize(cb);
  // Clear all sockets on startup
  const stream = await strapi.connections.redis.scanStream({
    match: 'accounts:*:sockets:*',
  });
  await stream.on('data', async resultKeys => {
    for (let i=0; i < resultKeys.length; i++) {
      strapi.connections.redis.del(resultKeys[i]);
    }
  });
  // Initialize Event listener subscriptions and message broker subscriptions
  strapi.services.subscribtions.initialize();
};

