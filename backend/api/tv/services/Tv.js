'use strict';

const _ = require('lodash');

module.exports = {
  /**
   * Helper function that emits an event that shows WaitingList record on TV Screen
    * @param record
   * @returns {Promise<void>}
   */
  showOnTv: async record => {
      const object = {
        user: {
          firstName: _.get(record, 'client.firstName'),
          lastName: _.get(record, 'client.lastName'),
          avatar: _.get(record, 'client.avatar'),
          email: _.get(record, 'client.email'),
          facebookId: _.get(record, 'client.facebookId'),
        },
        employees: record.employees.map(el => ({ username: el.username })),
      ...record.startTime && { apptStartTime: record.startTime.toDate() },
      ...record.status && { status: record.status },
      ...record.endTime && { apptEndTime: record.endTime.toDate() },
      };
    strapi.io.sockets.emit('tv.show.waitingList', object);
    }
};
