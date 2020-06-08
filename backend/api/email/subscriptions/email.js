'use strict';
const _ = require("lodash");

module.exports = {
  initialize: () => {
    /**
     * Email Service Message Queue
     */
    strapi.services.mq.get('services.email').process(async (job, done) => {
      const cfg = await strapi.services.config.get('email', { bypassCache: true, environment: process.env.NODE_ENV }).key("provider");
      if (_.isEmpty(cfg)) done(null);
      else {
        strapi.log.info('services.email', `Job id: ${job.queue.token}`, `Start sending` );
        strapi.services.email.send(job.data).then(result => {
          done(null, result);
        }).catch(e => {
          done(new Error(e));
        });
      }
    });

    strapi.services.mq.get('services.email').on('completed', (job, result) => {
      strapi.log.info('services.email', `Job id: ${job.queue.token}`, `Email sent to ${result.accepted} with message id: ${result.messageId}` );
    });

    strapi.services.mq.get('services.email').on('failed', (job, result) => {
      strapi.log.fatal('services.email', `Job id: ${job.queue.token}`, result.message, result);
    });
  },
};
