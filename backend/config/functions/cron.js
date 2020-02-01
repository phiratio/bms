'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK] [YEAR (optional)]
 */

const { GROUP_NAME_CLIENT } = require('../../api/constants');

module.exports = {
  // Midnight everyday
  '0 0 * * *': async () => {
    /**
     * Clear queue every midnight.
     */
    const queue = strapi.services.queue;
    const clearQueue = await strapi.services.config.get('queue').key('scheduleClearQueue');
    if (clearQueue) {
      strapi.log.info('system.cron `Clear queue` job fired');
      await queue.clear();
      const listOfEmployees = await strapi.controllers.queue.getEmployees();
      strapi.io.sockets.emit('queue.setEmployees', listOfEmployees);
      strapi.io.sockets.emit('waitingList.setClients', true);
    }

    /*
    * Get list of users from Slack and assign ids to existing accounts
     */
    await strapi.services.slack.assignSlackIdsToAccounts();

    /**
     * Refreshes list of disposable email domains
     */
    await strapi.services.email.disposable.refreshList();

    /*
    * Remove unused accounts
     */
    const deleteUnusedAccounts = await strapi.services.config.get('accounts').key('deleteUnusedAccounts');
    if (deleteUnusedAccounts) {
      strapi.log.info('system.cron `Clear unused accounts` job fired');
      const cleanupDays = (await strapi.services.config.get('accounts').key('cleanupDays')).id;
      const employeesRole = await strapi.plugins['users-permissions'].models.role.findOne({ name: GROUP_NAME_CLIENT });
      const query = {
        confirmed: false,
        role: employeesRole.id,
        updatedAt: {$lt: new Date((new Date()) - 1000 * cleanupDays)}
      };
      const unusedAccounts = await strapi.services.accounts.fetchAll({
        query: {
          $or: [
            query,
            {...query, ...{updatedAt: {$exists: false}}}
          ]
        }
      });
      // loop through each, so `afterDestroy` hook can be executed
      unusedAccounts.forEach(el => strapi.services.accounts.delete({_id: el._id}));
    }
  },
  // pause youtube every day at 20:30
  '30 20 * * *': async () => {
    strapi.io.sockets.emit('tv.youtube.pauseVideo', true);
  },
};
