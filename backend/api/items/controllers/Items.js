'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  services: ctx => {
    return strapi.services.items.getAllServices();
  },
};
