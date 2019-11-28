'use strict';

const { WAITING_LIST_STATUS_CONFIRMED } = require('../../constants');

/**
 * Appointments.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const ObjectId = require('bson-objectid');
const moment = require('moment');
const { WAITING_LIST_TYPE_RESERVED , WAITING_LIST_TYPE_APPOINTMENT } = require('../../constants');

module.exports = {

  /**
   * Promise to fetch all appointments of a user for a certain day
   *
   * @return {Promise}
   */

  fetchAll: async (
    userId,
    date = strapi.services.time.now().unix(),
    params = {
      date: {},
      type: [ WAITING_LIST_TYPE_RESERVED, WAITING_LIST_TYPE_APPOINTMENT ],
      sorting: { apptStarTime: -1 }
    }) => {

    const list = await strapi.services.waitinglist.getList({
      ... userId && { employees: Array.isArray(userId) ? userId.map(e => ObjectId(e)) : userId },
      apptStartTime: {
        $gte: params.date.from? params.date.from : moment(date, 'X').startOf('day'),
        $lt: params.date.to ? params.date.to : moment(date, 'X').endOf('day'),
      },
      type: params.type,
      check: false,
      status: WAITING_LIST_STATUS_CONFIRMED,
    }, false, params.sorting);

    return _.get(list, 'clients', []);
  },

  /**
   * Returns a list of appointments for a specific user for a specified date
   * @param userId
   * @param date
   * @returns {Promise<void>}
   */
  calendar: async(userId, date = strapi.services.time.now().unix()) => {

    let accounts = [];

    if (userId)
      accounts = await strapi.services.accounts.getEmployees([ '_id', 'username' ], { _id: ObjectId(userId), acceptAppointments: true, blocked: false });
    else
      accounts = await strapi.services.accounts.getEmployees([ '_id', 'username' ], { acceptAppointments: true, blocked: false });

    const resources = accounts.map(el => ({ resourceId: el._id, resourceTitle: el.username }));
    const appointments = await strapi.services.appointments.fetchAll(userId, date);

    const events = appointments.map(el => ({
      id: el._id,
      title: `${_.get(el, 'user.firstName', '-')} ${_.get(el, 'user.lastName', '-')}`,
      start: el.apptStartTime,
      end: el.apptEndTime,
      resourceId: _.get(el, 'employees.[0]._id'),
      type: el.type,
      status: el.status,
    }));

    return {
      resources,
      events
    }

  },

};
