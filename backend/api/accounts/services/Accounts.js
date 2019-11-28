/**
 * Accounts.js service
 */

const USER_FIELDS = ['items', 'schedule', 'vacationDates', 'enableSchedule', 'customAppointmentsSchedule', 'customAppointmentsHours', 'avatar', 'priorTimeBooking', 'futureBooking', 'autoConfirmAppointments', 'schedule', 'acceptAppointments', 'firstName', 'lastName', 'username', 'email', 'confirmed','blocked','useGravatar', 'createdAt','mobilePhone', 'updatedAt', 'description'];
const moment = require('moment');
const ObjectId = require('bson-objectid');
const _ = require('lodash');

const { WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_RESERVED } = require('../../constants');

module.exports = {
  USER_FIELDS,
  /**
   * Promise to fetch all accounts
   * @returns { Promise }
   */
  fetchAll({ skip, limit, query={}, fields=USER_FIELDS }) {
    return strapi
      .plugins['users-permissions']
      .models
      .user
      .find(query)
      .select(fields)
      .skip(skip)
      .limit(limit);
  },

  /**
   *  Promise to fetch one user
   * @param field mongodb document field name
   * @param select array of fields to be selected
   * @returns {Promise}
   */
  fetch(field, select = [...USER_FIELDS, 'role', 'preferredEmployees', 'visits', 'clients']) {
    return strapi
      .plugins['users-permissions']
      .models
      .user
      .findOne(field)
      .select(select)
      .populate([
        { path: 'role'  },
        { path: 'items' },
        // {
        //   path: 'visits',
        //   populate: ['employees']
        // },
        // {
        //   path: 'clients',
        //   populate: ['user', 'employees']
        // }
      ]);
  },

  /**
   * Promise to count records in Users model
   */
  count(query={}) {
    return strapi.plugins['users-permissions'].models.user.find(query).countDocuments();
  },

  /**
   * Promise to delete records from Users model
   * @param query
   * @param callback
   * @returns {*|Promise<*>|Promise<*>}
   */
  deleteMany(query={}, callback) {
    return strapi.plugins['users-permissions'].models.user.deleteMany(query, callback);
  },

  /**
   * Promise to delete a record
   * @param params
   * @returns {*|Promise<*>|Promise<*>}
   */
  delete(params) {
    return strapi.plugins['users-permissions'].services.user.remove(params);
  },

  /**
   * Gets list of roles from users-permissions plugin
   * @returns {Promise}
   */
  getRoles() {
    return strapi.plugins['users-permissions'].services.userspermissions.getRoles();
  },

  /**
   * Get one role based on ObjectId
   * @param roleID ObjectId
   * @returns {Promise}
   */
  getRole(roleID) {
    return strapi.plugins['users-permissions'].models.role.findOne({ _id: roleID });
  },

  /**
   * Gets one role based on its name
   * @param name string
   * @returns {*}
   */
  getRoleByName(name) {
    return strapi.plugins['users-permissions'].models.role.findOne({ name: name });
  },

  /**
   * Creates user
   * @param values object
   * @returns {Promise<values>}
   */
  async create(values) {
    if (values.role) values.role = values.role._id;
    if (!values.provider) values.provider = 'local';
    if (values.password) {
      values.password = await strapi.plugins['users-permissions'].services.user.hashPassword(values);
    }
    values.createdAt = Date.now();
    return strapi.plugins['users-permissions'].services.user.add(values);
  },

  /**
   * Updates user
   * @param params
   * @param values object
   * @returns {Promise<values>}
   */
  update(params, values) {
    return strapi
      .plugins['users-permissions']
      .services
      .user
      .edit(params, values)
  },
  /**
   * Returns and array of employee roles names
   * @returns {Promise<*>}
   */
  async getEmployeeRoles() {
    const groupsNames = (await strapi.services.config.get('users-permissions').key('employee-groups')).groups;
    return strapi.plugins['users-permissions'].models.role.find({ name: groupsNames });
  },

  /**
   * Returns an array of employees
   * @returns {Promise<void>}
   */
  async getEmployees(params={}, query={}) {
    const employeeRoles = await strapi.services.accounts.getEmployeeRoles();
    return strapi.plugins['users-permissions'].models.user.find().select(params).where({ ...{ role: employeeRoles.map(el => el.id), blocked: false }, ...query });
  },

  /**
   * Check weather provided role belongs to employee groups
   * @param roleName
   * @returns {Promise<void>}
   */
  async isEmployeeRole(roleName) {
    const employeeRoles = await strapi.services.accounts.getEmployeeRoles();
    return employeeRoles.findIndex(el => el.name === roleName) > -1;
  },

  /**
   * Checks weather store if closed on a provided date
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

  /**
   * Checks weather employee is on vacation
   * @param userId
   * @param timeStamp
   * @returns {Promise<boolean>}
   */
  async isOnVacation(userId, timeStamp) {
    const startOfDay = moment(timeStamp, 'X').startOf('day');
    const endOfDay = moment(timeStamp, 'X').endOf('day');
    const vacationDates = (await strapi.services.accounts.fetch({ _id: ObjectId(userId) })).vacationDates;
    let result = false;
    if (Array.isArray(vacationDates) && vacationDates.length > 0) {
      vacationDates.forEach(el => {
        const from = moment(el[0], 'X');
        const to = moment(el[1], 'X').add(1, 'days').subtract(1, 'second');
        const range = moment.range(from, to);
        if (range.overlaps( moment.range(startOfDay, endOfDay ) )) {
          result = true;
        }
      });
    }

    return result;
  },

  /**
   * Gets services that employee can provide
   * @param userId
   * @returns {Promise<Array>}
   */
  async getEmployeeServices(userId) {
    const user = await strapi.services.accounts.fetch({ _id: ObjectId(userId) });
    if (user.items && Array.isArray(user.items) && user.items.length > 0) return user.items;
    return strapi.services.items.getAllItems() || [];
  },

  /**
   * Gets timeline of an employee
   * @param userId User account id
   * @param day Unix timestamp Day for a timeline that should be returned
   * @returns {Promise<{timeBlock: *, type: number}[]>}
   */
  async getEmployeeTimeline(userId, day = strapi.services.time.unixTimestamp()) {
    const FROM_TIME = 0;
    const TO_TIME = 1;
    const selectedDay = moment(day, 'X').startOf('day').toDate();
    const weekDay = moment(day, 'X').format('dddd').toLowerCase(); // Get day of the week

    const storeHours = await strapi.services.config.get('general').key('workingHours');
    const user = await strapi.services.accounts.fetch({ _id: ObjectId(userId) });

    const currentDay = storeHours[weekDay];
    const startOfWorkingDay = _.get(currentDay, `[0][${FROM_TIME}]`);
    const endOfWorkingDay = _.get(currentDay, `[0][${TO_TIME}]`);

    const enableSchedule = _.get(user, 'enableSchedule');
    const daySchedule = _.get(user, `schedule.${weekDay}`, {});
    const customDaySchedule = _.get(user, `customAppointmentsSchedule.${weekDay}.timeRanges`, []);
    const customDayScheduleStatus = _.get(user, `customAppointmentsSchedule.${weekDay}.status`);
    const customAppointmentsHours = _.get(user, 'customAppointmentsHours');
    const acceptAppointments = _.get(user, 'acceptAppointments');

    if (await strapi.services.accounts.isStoreClosed(day) || !startOfWorkingDay || !endOfWorkingDay) {
      return [];
    }

    if (await strapi.services.accounts.isOnVacation(userId, day)) {
      return [];
    }

    let hours;
    if (acceptAppointments && customAppointmentsHours && customDayScheduleStatus && Array.isArray(customDaySchedule) && customDaySchedule.length > 0) { // Custom appointment hours set in profile
      hours = customDaySchedule
    } else if (enableSchedule && daySchedule.status && Array.isArray(daySchedule.timeRanges) && daySchedule.timeRanges.length > 0) { // Schedule
      hours = daySchedule.timeRanges;
    } else if (enableSchedule && daySchedule.status && (Array.isArray(daySchedule.timeRanges) && daySchedule.timeRanges.length === 0) || (enableSchedule && daySchedule.status && !daySchedule.timeRanges )) { // Schedule: Day was selected but hours were not set - regular store hours will be used
      hours = currentDay;
    } else {
      return [];
    }

    const timeStep = (await strapi.services.config.get('appointments').key('timeStep')).id;

    let accountTimeline = [];

    hours.forEach(el => {
      const start = moment(selectedDay).add(el[FROM_TIME], 'seconds');
      const end   = moment(selectedDay).add(el[TO_TIME], 'seconds');
      const range = moment.range(start, end);
      accountTimeline = [...accountTimeline, ...Array.from(range.by('minutes', { step: timeStep / 60 })).map(m => ({ timeBlock: Number(m.format('X')) }))];
    });

    const appointments = await strapi.services.appointments.fetchAll(userId, day);

    let appointmentTimeline = [];

    for (let i=0; i < appointments.length; i++) {
      const appointment = appointments[i];
      let startTime = moment(appointment.apptStartTime);
      let endTime = moment(appointment.apptEndTime);

      const remainderStart = startTime.unix() % timeStep;
      if (remainderStart > 0) {
        startTime =  moment(appointment.apptStartTime).subtract(remainderStart, 'seconds');
      }

      const remainderEnd = endTime.unix() % timeStep;
      if (remainderEnd > 0) {
        endTime =  moment(appointment.apptEndTime).add(remainderEnd, 'seconds');
      }

      appointmentTimeline = [
        ...appointmentTimeline,
        ...Array.from(
          moment.range(startTime, endTime.subtract(timeStep, 'seconds')).by('minutes', { step: timeStep / 60 })
        ).map(m => ({
          timeBlock: Number(m.format('X')),
          id: appointment.id,
          type: appointment.type,
        }))
      ];

    }

    const merge = (arr, appointment) => {
      const timeStep = arr[1].timeBlock - arr[0].timeBlock;
      arr.forEach((timeline, index) => {
        if (timeline.timeBlock === appointment.timeBlock ) {
          arr[index] = appointment;
        } else if ( (timeline.timeBlock < appointment.timeBlock) && (appointment.timeBlock < timeline.timeBlock + timeStep) ) {
          arr[index] = {...appointment, timeBlock: timeline.timeBlock };
        }
      });
    };

    appointmentTimeline.forEach(timeBlock => {
      merge(accountTimeline, timeBlock);
    });

    return accountTimeline;
  }

};
