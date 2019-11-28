'use strict';

/**
 *  Helper set of functions to set, cache, update settings
 *  strapi.services.config.get('waitinglist').key()
 */

const CONFIG_NAMESPACE = 'config';

module.exports = {
  get: name => {
    return {
      key: async key => {
        const namespace = `${CONFIG_NAMESPACE}:${name}:${key}`;
        // get cached config
        const cachedConfig = await strapi.connections.redis.get(namespace);

        if (cachedConfig) {
          try {
            return JSON.parse(cachedConfig);
          } catch (e) {
            return cachedConfig;
          }
        }
        const store = await strapi.store({ environment: '', type: 'plugin', name });
        const value = await store.get({ key });
        if (!value) return undefined;
        await strapi.connections.redis.set(namespace, typeof value === 'object' && value.constructor ? JSON.stringify(value) : value );
        return value;
      },
    };
  },
  set: name => {
    return {
      key: async (key, value) => {
        const namespace = `${CONFIG_NAMESPACE}:${name}:${key}`;
        await strapi.connections.redis.del(namespace);
        const store = await strapi.store({ environment: '', type: 'plugin', name });
        if (store === null) return null;
        return store.set({ key, value });
      }
    };
  }
};
