'use strict';

/**
 * Buttons.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const REDIS_NAMESPACE = 'buttons:tokens:';
const objetId = require('bson-objectid')

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
};
