'use strict';

/**
 * Appointments.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const ObjectId = require('bson-objectid');
const moment = require('moment');
const { WAITING_LIST_STATUS_CONFIRMED, WAITING_LIST_STATUS_NOT_CONFIRMED, WAITING_LIST_STATUS_CANCELED, WAITING_LIST_TYPE_RESERVED , WAITING_LIST_TYPE_APPOINTMENT } = require('../../constants');
const { DAY_1 } = require('../../constants');

module.exports = {
  appointmentsMeta: async () => {
    const redirect = await strapi.services.config.get('appointments').key('redirect');
    const redirectCfg = await strapi.services.config.get('appointments').key('redirectCfg');
    const enabled = await strapi.services.config.get('appointments').key('enabled');

    return {
      enabled,
      redirect,
      ...redirect && { redirectCfg },
    }
  },

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
      sorting: { apptStarTime: -1 },
      check: false,
      status: [ WAITING_LIST_STATUS_CONFIRMED, WAITING_LIST_STATUS_NOT_CONFIRMED ]
    }) => {

    const list = await strapi.services.waitinglist.getList({
      ... userId && { employees: Array.isArray(userId) ? userId.map(e => ObjectId(e)) : userId },
      apptStartTime: {
        $gte: params.date.from? params.date.from : moment(date, 'X').startOf('day'),
        $lt: params.date.to ? params.date.to : moment(date, 'X').endOf('day'),
      },
      type: params.type,
      check: params.check,
      status: params.status,
    }, false, params.sorting);

    return _.get(list, 'records', []);
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

    const appointments = await strapi.services.appointments.fetchAll(userId, date, {
      date: {},
      type: [ WAITING_LIST_TYPE_RESERVED, WAITING_LIST_TYPE_APPOINTMENT ],
      sorting: { apptStarTime: -1 },
      check: [ false ],
      status: [ WAITING_LIST_STATUS_CANCELED, WAITING_LIST_STATUS_CONFIRMED, WAITING_LIST_STATUS_NOT_CONFIRMED ]
    });

    const resourcesObject = {};

    accounts.forEach(el => resourcesObject[el._id] = { resourceId: el._id, resourceTitle: el.username });

    const events = appointments.map(el => {

      const userId = _.get(el, 'employees.[0]._id');
      const userName = _.get(el, 'employees.[0].username');
      resourcesObject[userId] = { resourceId: userId, resourceTitle: userName };

      return {
        id: el._id,
        _id: el._id,
        title: `${_.get(el, 'user.firstName', '-')} ${_.get(el, 'user.lastName', '-')}`,
        start: el.apptStartTime,
        end: el.apptEndTime,
        resourceId: _.get(el, 'employees.[0]._id'),
        type: el.type,
        check: el.check,
        status: el.status,
      };
    });

    const weekDay = moment(date, 'X').format('dddd').toLowerCase(); // Get day of the week
    const storeHours = await strapi.services.config.get('general').key('workingHours');
    const currentDay = storeHours[weekDay];

    return {
      currentDayHours: {
        start: moment(date, 'X').tz(strapi.services.time.timeZone()).startOf('day').add(_.get(currentDay, '[0][0]'), 'seconds').unix(),
        end: moment(date, 'X').tz(strapi.services.time.timeZone()).startOf('day').add(_.get(currentDay, '[0][1]'), 'seconds').unix(),
      },
      dayStatus: await strapi.services.appointments.getDayStatus(Object.values(resourcesObject).map(el => el.resourceId), date),
      resources: Object.values(resourcesObject),
      events,
      viewDate: date,
    }

  },

  /**
   * Change status of specific day
   * @param accountId
   * @param timestamp
   * @param status<boolean>
   */
  changeDayStatus(accountId, timestamp, status) {
    console.log('acc', accountId);
    return strapi.services.redis.set(`accounts:${accountId}:schedule:${moment(timestamp).startOf('day').unix()}`, { id: accountId, status });
  },

  /**
   * Open specific day
   * @param accountId
   * @param timestamp
   */
  openDay(accountId, timestamp) {
    return strapi.services.appointments.changeDayStatus(accountId, timestamp, true);
  },

  /**
   * Close specific day
   * @param accountId
   * @param timestamp
   */
  closeDay(accountId, timestamp) {
    return strapi.services.appointments.changeDayStatus(accountId, timestamp, false);
  },

  /**
   * Checks if employee closed specific day
   * if accountId
   * @param accountIds
   * @param timeStamp
   * @return {Promise}
   */
  async getDayStatus(accountIds , timeStamp) {
    if (accountIds.length === 0) return false;
    const startOfDay = moment(timeStamp, 'X').startOf('day').unix();
    if (Array.isArray(accountIds)) {
      const mappedAccountIds = accountIds.map(el => `accounts:${el}:schedule:${startOfDay}`);
      const accountStatuses = await strapi.services.redis.mget(mappedAccountIds);
      const response = {};
      accountIds.forEach(el => response[el] = true);
      accountStatuses.forEach(el => el && (response[el.id] = el.status));
      return response;
    }
    const response = await strapi.services.redis.get(`accounts:${accountIds}:schedule:${startOfDay}`);
    return _.get(response, 'status', true);
  },

  /**
   * Checks weather store closed on a provided date
   * @param timeStamp
   * @returns {Promise<boolean>}
   */
  async isStoreClosed(timeStamp) {
    const startOfDay = moment(timeStamp, 'X').startOf('day');
    const endOfDay = moment(timeStamp, 'X').endOf('day');
    // Extract year from the date
    const year = moment(timeStamp, 'X').format('YYYY');
    // Get closed dates
    const closedDays = await strapi.services.config.get('general').key('closedDates');
    let result = false;
    closedDays.forEach(el => {
      let from = moment(el[0], 'X');
      // Closed days reoccurre every year so we have to replace year in closed day
      from = moment(`${year}/${from.format('MM')}/${from.format('DD')}`, 'YYYY/MM/DD');
      let to = moment(el[1], 'X');
      to = moment(`${year}/${to.format('MM')}/${to.format('DD')}`, 'YYYY/MM/DD').add(1, 'days').subtract(1, 'second');
      const range = moment.range( from, to);
      if (range.overlaps( moment.range(startOfDay, endOfDay ) )) {
        result = true;
      }
    });

    return result;
  },

  async availableHours(account, services) {

    const futureBookingConfig = account.futureBooking || await strapi.services.config.get('appointments').key('futureBooking');
    const priorBookingHoursConfig = account.priorTimeBooking || await strapi.services.config.get('appointments').key('priorTime');
    const priorTimeBooking = priorBookingHoursConfig.id;
    const futureBooking =  futureBookingConfig.id / DAY_1;
    const totalTime = services.reduce((acc, curr) => acc+curr.time.id, 0);

    const timeStep = (await strapi.services.config.get('appointments').key('timeStep')).id;
    const totalBlocks = Math.ceil(totalTime / timeStep);

    const schedule = {};

    const now = moment().unix();
    const numberOfTimeBlocksToSkip = Math.ceil( priorTimeBooking / timeStep);

    for (let dayNumber = 0; dayNumber <= futureBooking; dayNumber++) {
      const day = moment().startOf('day').add(dayNumber, 'day').unix();
      schedule[ day ] = [];
      const timeline = await strapi.services.accounts.getTimeline(account.id, day);

      if ( _.get(timeline, '[0].timeBlock') && timeline[0].timeBlock < now + priorTimeBooking) {
        timeline.splice(0, numberOfTimeBlocksToSkip);
      }

      let i = 0;
      while (i <= timeline.length) {
        if (timeline[i] && !timeline[i].type) {
          let j = i;
          let counter = 0;

          while (j <= i + totalBlocks) {
            if (timeline[j] && !timeline[j].type &&
              timeline[j+1] && timeline[j].timeBlock !== timeline[j+1].timeBlock) {
              counter++;
            }
            j++;
          }

          if (counter >= totalBlocks) {
            schedule[ day ].push( timeline[i].timeBlock );
          }
          counter += 0;
        }
        i++;
      }

      if (schedule[ day ].length === 0) {
        delete schedule[ day ];
      }

    }

    return schedule;
  },

};
