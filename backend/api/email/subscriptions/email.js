'use strict';

module.exports = {
  initialize: () => {
    /**
     * Email Service Message Queue
     */
    strapi.services.mq.get('services.email').process(async (job, done) => {
      strapi.log.info('services.email', `Job id: ${job.queue.token}`, `Started sending` );
      strapi.services.email.send(job.data).then(result => {
        done(null, result);
      }).catch(e => {
        done(new Error(e));
      });
    });

    strapi.services.mq.get('services.email').on('completed', (job, result) => {
      strapi.log.info('services.email', `Job id: ${job.queue.token}`, `Email sent to ${result.accepted} with message id: ${result.messageId}` );
    });

    strapi.services.mq.get('services.email').on('failed', (job, result) => {
      strapi.log.fatal('services.email', `Job id: ${job.queue.token}`, result.message, result);
    });
  },
};
