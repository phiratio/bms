'use strict';

/**
 *  Helper set of functions to set, cache, update settings
 *  e.g. strapi.services.config.get('example_config').key();
 *  strapi.services.config.set('example_config').key('example_key', 'example_value');
 */

const CONFIG_NAMESPACE = 'config';

const stringify = value => {
  if(typeof value === 'object' && value.constructor) {
    return JSON.stringify(value)
  }
  return value;
};

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
        await strapi.connections.redis.set(namespace, stringify(value) );
        return value;
      },
    };
  },
  set: name => {
    return {
      key: async (key, value) => {
        const namespace = `${CONFIG_NAMESPACE}:${name}:${key}`;
        const store = await strapi.store({ environment: '', type: 'plugin', name });
        await strapi.connections.redis.set(namespace, stringify(value) );
        if (store === null) return null;
        return store.set({ key, value });
      }
    };
  }
};
