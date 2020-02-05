'use strict';

/**
 * Helper functions for getting and setting data to redis
 */
module.exports = {

  get: async key => {

    const data = await strapi.connections.redis.get(key);

    if (!data) return false;

    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }

  },

  set: (key, value, optionName, optionValue) => {
    if (optionName && optionValue) {
      return strapi.connections.redis.set(key, typeof value === 'object' && value.constructor ? JSON.stringify(value) : value, optionName, optionValue );
    }
    return strapi.connections.redis.set(key, typeof value === 'object' && value.constructor ? JSON.stringify(value) : value);
  },

  del: key => {
    return strapi.connections.redis.del(key);
  },

};
