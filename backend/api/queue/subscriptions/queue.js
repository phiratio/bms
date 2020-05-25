'use strict';

const { EMPLOYEES_DISABLED_LIST } = require('../../constants');

module.exports = {
  initialize: () => {

    strapi.services.eventemitter.on('queue.add', async account => {
      strapi.log.debug('queue.add', 'Event fired');
      await strapi.controllers.queue.addToCache(account, EMPLOYEES_DISABLED_LIST);
      strapi.io.sockets.emit(
        'queue.setEmployees',
        await strapi.controllers.queue.getEmployees(),
      );
    });

    strapi.services.eventemitter.on('queue.update', async account => {
      strapi.log.debug('queue.update', 'Event fired');
      await strapi.services.queue.updateCache(account);
      await strapi.services.queue.setEmployees();
    });

    strapi.services.eventemitter.on('queue.remove', async account => {
      strapi.log.debug('queue.remove', 'Event fired');
      await strapi.services.queue.removeFromCache(account);
      return strapi.services.queue.setEmployees();
    });

    strapi.services.eventemitter.on('queue.setEmployees', async () => {
      await strapi.services.queue.setEmployees();
    });

  },
};
