'use strict';

/**
 * Helper functions for getting and setting data to redis
 */
module.exports = {

  parse: data => {
    if (!data) return false;
    try {
      if (Array.isArray(data)) {
        return data.map(el => JSON.parse(el));
      }
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  },

  mget: async (...keys) => {
    const data = await strapi.connections.redis.mget(...keys);
    return strapi.services.redis.parse(data);
  },

  get: async key => {
    const data = await strapi.connections.redis.get(key);
    return strapi.services.redis.parse(data);
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
