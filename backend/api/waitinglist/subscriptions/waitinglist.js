'use strict';

const moment = require('moment');
const { WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_STATUS_CANCELED } = require('../../constants');

module.exports = {
  initialize: () => {

    /**
     * Event Emitter subscriptions
     */
    /**
     * Event Emitter subscription: Event fires when waitingList record was created
     * @param ctx Koa context
     * @param WaitingListRecord WaitingList object
     */
    strapi.services.eventemitter.on('waitingList.create', async (WaitingListRecord, values, ctx) => {
      strapi.log.info('waitingList.create Waitinglist record created: %s ', WaitingListRecord.client.fullName);
      try {
        WaitingListRecord.events.setClients();
        await WaitingListRecord.notifications.sound();
        await WaitingListRecord.notifications.tv();

        if (WaitingListRecord.type === WAITING_LIST_TYPE_APPOINTMENT && values.notifyClient) {
          WaitingListRecord.client.notifications.email( await WaitingListRecord.templates.email.new(), { jobId: `${WaitingListRecord.id}:email:new` } );
          await WaitingListRecord.addEmailRemindForClient();
        }

        await WaitingListRecord.notifications.slack().new();
        await WaitingListRecord.employees.notify().slack({ extraText: values.notifyEmployeeNote }, { jobId: `${WaitingListRecord.id}:slack:new` }).new();
      } catch(e) {
        console.trace(e);
        strapi.log.error(`waitingList.create`, e.message);
      }
    });

    /**
     * Event Emitter subscription: Event fires when waitingList record was updated
     * @param ctx Koa context
     * @param record Waitinglist object
     */
    strapi.services.eventemitter.on('waitingList.update', async (WaitingListRecord, values, ctx) => {
      try {
        if (WaitingListRecord.changed) {
          WaitingListRecord.events.setClients();
          strapi.log.info('waitingList.update Waitinglist record updated: %s', WaitingListRecord.client.fullName);

          await WaitingListRecord.notifications.sound();
          await WaitingListRecord.notifications.tv();

          if (WaitingListRecord.type === WAITING_LIST_TYPE_APPOINTMENT) {
            WaitingListRecord.notifications.slack().update();

            if (WaitingListRecord.status === WAITING_LIST_STATUS_CANCELED) {
              await WaitingListRecord.cancelClientEmailReminder();
              if (values.notifyClient)
                WaitingListRecord.client.notifications.email( await WaitingListRecord.templates.email.cancel(), { jobId: `${WaitingListRecord.id}:email:cancel` } );
              await WaitingListRecord.originalRecord.employees.notify().slack({ extraText: '' }, { jobId: `${WaitingListRecord.id}:slack:cancel` }).cancel();

            } else {
              await WaitingListRecord.addEmailRemindForClient();
              if (WaitingListRecord.employees.toString() === WaitingListRecord.originalRecord.employees.toString()) {
                WaitingListRecord.employees.notify().slack({ extraText: values.notifyEmployeeNote }).update();
              } else {
                await WaitingListRecord.originalRecord.employees.notify().slack({ extraText: '' }).cancel();
                await WaitingListRecord.employees.notify().slack({ extraText: values.notifyEmployeeNote }).new();
              }

              if (values.notifyClient)
                WaitingListRecord.client.notifications.email( await WaitingListRecord.templates.email.update(), { jobId: `${WaitingListRecord.id}:email:update:${moment().unix()}` } );
            }

          }

          await strapi
            .services
            .accounts
            .update({ id: WaitingListRecord.client.id }, { preferredEmployees: WaitingListRecord.employees.map(el => el.id) });
        }
      } catch(e) {
        strapi.log.error(`waitingList.update`, e.message);
        console.error(e);
      }
    });


  },
};
