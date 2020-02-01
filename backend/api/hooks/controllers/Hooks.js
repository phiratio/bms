'use strict';
const _ = require('lodash');

/**
 *  Webhooks.js controller
 *  Used by external services to trigger local services
 */
module.exports = {
  /**
   * Event subscription: Gets triggered by Slack
   * @param ctx Koa object
   * @returns { Promise }
   */
  slack: async ctx => {
    if (!ctx.query.token) return ctx.badRequest(null, { errors: 'Invalid token provided'});
    try {
      const token = await strapi.plugins['users-permissions'].services.jwt.verify(ctx.query.token);
      if (!token) return ctx.badRequest(null);
      const data = ctx.request.body;
      const eventType = _.get(data, 'event.type');
      if (eventType === 'team_join' || eventType === 'user_change') {
        const email = _.get(data, 'event.user.profile.email');
        const id = _.get(data, 'event.user.id');
        strapi.log.info(`webhooks.slack.event.${eventType}`, `${email} ${id}`);
        await strapi.services.slack.assignSlackIdToAccount(email, id);
      }
      return {};
    } catch (e) {
      strapi.log.error('webhooks.slack', e.message, e);
      strapi.log.fatal(e);
      return ctx.badRequest(null, { errors: 'Invalid token' });
    }
    return ctx.badRequest(null, { errors: 'Unable to perform this action' });
  },
};
