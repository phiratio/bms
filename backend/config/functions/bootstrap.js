'use strict';
const EventEmitter = require('events');
const path = require('path');
const _ = require('lodash');
const glob = require('glob');
const Redis = require("ioredis");

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = async cb => {
  // Initialize Redis
  strapi.connections['redis'] = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    db: process.env.REDIS_DATABASE || 0,
  });

  // Search for all classes in api directory
  const classes = glob.sync("api/**/classes/*.js");

  strapi.classes = {};

  // import classes and make the accessible globally
  classes.forEach( filePath => {
    const fileName = path.basename(filePath, '.js');
    strapi.classes[ _.toLower(fileName.charAt(0)) + fileName.slice(1) ] = require(path.resolve(filePath));
  });

  // initialize all available subscriptions
  glob("api/**/subscriptions/*.js", (err, files) => {
    if (err) {
      console.trace(err);
      strapi.log.fatal('bootstrap', err.message);
    } else {
      files.forEach( file => {
        const subscription = require(path.resolve(file));
        subscription.initialize();
      });
    }
  });

  // Initialize Socket.io server
  strapi.services['socket-io'].server();
  // Make instance of Event Emitter globally accessible
  strapi.services.eventemitter = new EventEmitter();

  // Initialize message queues
  strapi.services.mq.new('services.email', {
    limiter: {
      // 3 per 5 seconds
      max: 3,
      duration: 5000,
    }
  });
  strapi.services.mq.new('services.slack');

  // retry failed jobs
  await strapi.services.mq.retryFailed();

  // Clear all sockets on startup
  // console.log('strapi', strapi);
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

  // run bootstrap scripts
  glob("api/**/bootstrap/*.js", (err, files) => {
    if (err) {
      console.trace(err);
      strapi.log.fatal('bootstrap', err.message);
    } else {
      files.forEach( async file => {
        const bootstrapConfig = require(path.resolve(file));
        await bootstrapConfig.initialize();
      });
    }
  });
};

