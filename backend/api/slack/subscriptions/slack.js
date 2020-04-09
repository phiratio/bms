'use strict';

module.exports = {
  initialize: () => {
    /**
     * Slack Service Message Queue
     */
    strapi.services.mq.get('services.slack').process(async (job, done) => {
      strapi.log.info('services.slack', `Job id: ${job.queue.token}`, `Started processing` );
      return strapi.services.slack.post(job.data).then(result => {
        done(null, result);
      }).catch(e => done(new Error(e)));
    });

    strapi.services.mq.get('services.slack').on('completed', (job, result) => {
      strapi.log.info('services.slack', `Slack message sent to ${result.channel}`, `Job id: ${job.queue.token}` );
    });

    strapi.services.mq.get('services.slack').on('failed', (job, result) => {
      strapi.log.fatal('services.slack ', `Job id: ${job.queue.token}`, result.message, result);
    });
  },
};
