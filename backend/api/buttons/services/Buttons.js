'use strict';

const objectId = require('bson-objectid');
/**
 * Buttons.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const REDIS_NAMESPACE = 'buttons:tokens:';

module.exports = {
  /**
   * Deleted cached data fro a specified button
   * @param buttonId
   * @returns {Promise<*|void|request.Request>}
   */
  clearCache: buttonId => {
    return strapi.services.redis.del(`${REDIS_NAMESPACE}${buttonId}`)
  },

  /**
   * Gets user associated with token
   * @param token
   * @returns {Promise}
   */
  getAssignedUser: async token => {
    const cachedToken = await strapi.services.redis.get(`${REDIS_NAMESPACE}${token.id}`);
    if (cachedToken) {
      return cachedToken.user;
    } else {
      const tokenToAccount = await strapi.services.tokens.fetch({ generatedBy: token.id, type: 'button' });
      if (tokenToAccount && tokenToAccount.user) {
        await strapi.services.redis.set(`${REDIS_NAMESPACE}${token.id}`, tokenToAccount);
        return tokenToAccount.user;
      }
    }

    return false;
  },

  /**
   * Checks if functionality is enabled
   * @returns {Promise<*>}
   */
  isEnabled: () => {
      return  strapi.services.config.get('buttons').key('enabled');
  },

  add: async () => {
    const counter = await strapi.services.tokens.count() + 1;
    const name = `Flic #${counter}`;
    const role = await strapi.services.accounts.getRoleByName("Flic Buttons");

    const user = await strapi
      .plugins['users-permissions']
      .services
      .user
      .add({ firstName: 'Flic', lastName: `#${counter}`, description: "Service account", username: `Flic${counter}`, role: role._id, confirmed: true });

    const token = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    const data = {
      token,
      name,
      type: 'button',
      generatedBy: user._id,
    };

    return strapi.services.tokens.add(data);
  },

  remove: async id => {
    const _id = objectId(id);
    const button = await strapi.services.tokens.fetch({ _id, type: "button" });
    if (!button) return;

    await strapi
      .plugins['users-permissions']
      .services
      .user
      .remove({ _id: button.generatedBy });

    return strapi.services.tokens.remove({ _id });
  },

};
