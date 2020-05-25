'use strict';

module.exports = {
  initialize: async () => {
    const disposableEmails = await strapi.services.email.disposable.get();
    if (disposableEmails.length === 0) {
      strapi.log.info("Refreshing list of disposable emails");
      await strapi.services.email.disposable.refreshList();
    }
  }
};
