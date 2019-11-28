'use strict';

/**
 * Buttons.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {

  /**
   * Gets user associated with token
   * @param token
   * @returns {Promise}
   */
  getAssignedUser: async token => {
    const tokenToAccount = await strapi.services.tokens.fetch({ token, type: 'button' });
    if (tokenToAccount && tokenToAccount.user) return tokenToAccount.user;
    return false;
  },

  /**
   * Checks if functionality is enabled
   * @returns {Promise<*>}
   */
  isEnabled: () => {
      return strapi.store({
        environment: '',
        type: 'plugin',
        name: 'buttons',
        key: 'enabled',
      }).get();
  },
};
