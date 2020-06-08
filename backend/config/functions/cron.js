'use strict';
const moment = require("moment");
const migrationScript = require("../../migrations/init");
const ObjectID = require("bson-objectid");

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

  '*/59 * * * *': async () => {
    strapi.io.sockets.emit('notifications.flash.warning', "Demo will reset in 1 minute");
  },

  '*/55 * * * *': async () => {
    strapi.io.sockets.emit('notifications.flash.warning', "Demo will reset in 5 minutes");
  },

  '*/50 * * * *': async () => {
    strapi.io.sockets.emit('notifications.flash.warning', "Demo will reset in 10 minutes");
  },

  // Reset demo every hour
  '0 * * * *': async () => {
    strapi.log.info('system.cron `Resetting DB`');

    try {
      await migrationScript.clearAndImportDB({...migrationScript.config, ...{ collections: ["waitinglist", "users-permissions_user"] }});
    } catch(e) {
      console.log('e', e);
    }

    const waitinglist = await strapi.services.waitinglist.all();

    for (const record of waitinglist) {
      let apptStartTime;
      let apptEndTime;

      const createdAt = moment(record.createdAt);
      const updatedAt = moment(record.updatedAt);

      if (record.apptStartTime && record.apptEndTime) {
        apptStartTime = moment(record.apptStartTime);
        apptEndTime = moment(record.apptEndTime);

        apptStartTime = moment().startOf('day').add(apptStartTime.hour(), 'hour').add(apptStartTime.minute(), 'minute').unix();
        apptEndTime =  moment().startOf('day').add(apptEndTime.hour(), 'hour').add(apptEndTime.minute(), 'minute').unix();
      }

      const doc = record._doc;

      const update = {
        ...doc,
        employees: [...doc.employees.map(el => ({ id: ObjectID(el) }))],
        ...(apptStartTime && apptEndTime && { timeRange:[[apptStartTime, apptEndTime]], }),
        services: doc.services.map(el => ObjectID(el)),
        createdAt: moment().startOf('day').add(createdAt.hour(), 'hour').add(createdAt.minute(), 'minute').toDate(),
        updatedAt: moment().startOf('day').add(updatedAt.hour(), 'hour').add(updatedAt.minute(), 'minute').toDate()
      };

      await strapi.services.waitinglist.remove({ _id: doc._id });
      await strapi.services.waitinglist.add(update);
    }

    await strapi.services.queue.clear();
    const allEmployees = await strapi.controllers.queue.getAllEmployees();
    await strapi.services.queue.set({ enabled: allEmployees, disabled: [] });
    const listOfEmployees = await strapi.controllers.queue.getEmployees();
    strapi.io.sockets.emit('queue.setEmployees', listOfEmployees);
    strapi.io.sockets.emit('waitingList.setClients', true);
    strapi.io.sockets.emit('notifications.flash.warning', "Demo reset successful");
  },

};
