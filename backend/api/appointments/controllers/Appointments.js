'use strict';


const _ = require('lodash');
const ObjectId = require('bson-objectid');
const moment = require('moment');
const {DAY_7} = require("../../constants");
const { WAITING_LIST_STATUS_CONFIRMED, WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_WALKINS, WAITING_LIST_STATUS_CANCELED } = require("../../constants");

/**
 * A set of functions called "actions" for `Appointments`
 */

module.exports = {
  terms: async () => strapi.services.business.terms(),
  contacts: async () => strapi.services.business.info(),
  createAppointment: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, {
        notifications: {
          flash: {
            msg:  'No Authentication was provided',
            type: 'error',
          }
        }
      });
    }
    const profile = _.omit(user.toJSON ? user.toJSON() : user, ['blocked','confirmed','description', 'password', 'resetPasswordToken', 'tokens', 'preferredEmployees', 'linkedTokens', 'visits']);
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .services({ returnDBObject: true })
      .string('note', { label: 'Note', optional: true, regex: /^(?!-)(?!.*--)[A-Za-z0-9 -,.@]+(?<!-)$/ })
      .number('time', { min: strapi.services.time.unix().startOfDay, max: strapi.services.time.unix().startOfDay + DAY_7 , error: 'Wrong time provided' })
      .employees({ max: 1 })
      .result()
      .then(async values => {

          // return ctx.badRequest(null, {
          //   notifications: {
          //     flash: {
          //       msg:  'Wrong appointment',
          //       type: 'error',
          //     }
          //   }
          // });

        // check employee services and check if employee can provide appointments
        // check time modulo

        const totalRequiredTime = values.services.reduce((acc,curr) => acc+curr.time.id, 0);

        const timeline = await strapi.services.accounts.getTimeline(_.get(values, 'employees[0].id'), values.time) || [];
        if (timeline.length === 0) {
          return ctx.badRequest(`Unable to find timeline for specified employee`);
        }
        const isEmployeeTimeAvailable = await strapi.services.accounts.isTimeAvailable(timeline, values.time, values.time+totalRequiredTime);

        if (!isEmployeeTimeAvailable) {
          return ctx.badRequest(`Selected time is no longer available`);
        }

        const appointmentValues = {
          ...values,
          user,
          timeRange: [[values.time, values.time + totalRequiredTime]],
          type: WAITING_LIST_TYPE_APPOINTMENT,
          status: WAITING_LIST_STATUS_CONFIRMED,
          flag: false,
          notifyClient: true,
        };

        return strapi
          .services
          .waitinglist
          .add(appointmentValues)
          .then(async WaitingListRecord => {
            strapi.services.eventemitter.emit('waitingList.create', WaitingListRecord, appointmentValues, ctx);
            return {
              notifications: {
                flash: {
                  msg:  'Successfully created',
                }
              },
              record: {
                id: WaitingListRecord.id,
              }
            }
          });
      }).catch((e) => {
        console.log('e', e);
        if (e.message) strapi.log.error('appointments.createAppointment Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },
  getAppointment: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, {
        notifications: {
          flash: {
            msg:  'No Authentication was provided',
            type: 'error',
          }
        }
      });
    }
    const profile = _.omit(user.toJSON ? user.toJSON() : user, ['blocked','confirmed','description', 'password', 'resetPasswordToken', 'tokens', 'preferredEmployees', 'linkedTokens', 'visits']);
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(async values => {
        const appointment = await strapi.services.waitinglist.fetch({ _id: values.id, type: WAITING_LIST_TYPE_APPOINTMENT });
        if (!appointment || profile.id !== _.get(appointment, 'user.id')) {
          return ctx.badRequest(null, {
            notifications: {
              flash: {
                msg:  'Wrong appointment',
                type: 'error',
              }
            }
          });
        }

        return {
          ..._.pick(appointment, ['status', 'type', 'services', 'id',  'note', 'check']),
          time: moment(appointment.apptStartTime).unix(),
          selectedEmployee: _.map(appointment.employees, _.partialRight(_.pick, ['username', 'id', 'avatar'])),
          services: _.map(appointment.services, _.partialRight(_.pick, ['name', 'priceAppt', 'time', 'description']))
        };

      }).catch((e) => {
        if (e.message) strapi.log.error('appointments.cancel Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },
  cancelAppointment: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, {
        notifications: {
          flash: {
            msg:  'No Authentication was provided',
            type: 'error',
          }
        }
      });
    }
    const profile = _.omit(user.toJSON ? user.toJSON() : user, ['blocked','confirmed','description', 'password', 'resetPasswordToken', 'tokens', 'preferredEmployees', 'linkedTokens', 'visits']);

    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(async values => {
        const appointment = await strapi.services.waitinglist.fetch({ _id: values.id, type: WAITING_LIST_TYPE_APPOINTMENT });
        if (!appointment || appointment.status === WAITING_LIST_STATUS_CANCELED || appointment.check || profile.id !== _.get(appointment, 'user.id')) {
          return ctx.badRequest(null, {
            notifications: {
              flash: {
                msg:  'Wrong appointment',
                type: 'error',
              }
            }
          });
        }

        if (moment(appointment.apptStartTime).unix() <= strapi.services.time.unix().now) {
          return ctx.badRequest(null, {
            notifications: {
              flash: {
                msg:  'Changing status on past appointments is not allowed',
                type: 'error',
              }
            }
          });
        }

        return strapi
          .services
          .waitinglist
          .edit({ _id: values.id }, { ...appointment._doc, ...{ status: WAITING_LIST_STATUS_CANCELED, check: true  } })
          .then(async WaitingListRecord => {
            strapi.services.eventemitter.emit('waitingList.update',  WaitingListRecord, values, ctx);
            return strapi.services.response.flash('Successfully canceled');
          });
      }).catch((e) => {
        if (e.message) strapi.log.error('appointments.cancel Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },
  getProfileAppointments: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }
    const profile = _.omit(user.toJSON ? user.toJSON() : user, ['blocked','confirmed','description', 'password', 'resetPasswordToken', 'tokens', 'preferredEmployees', 'linkedTokens', 'visits']);

    return strapi
      .services
      .joi
      .validate(ctx.query)
      .number('page', { optional: true, positive: true })
      .result()
      .then(async values => {
        const appointments = await strapi.services.waitinglist.appointments(
          {
            type: [ WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_WALKINS ],
            check: [ true, false ],
            user: profile.id,
          },
          {
            ...values,
            ...{
              $exclude: {
                user: 0,
                flag: 0,
              },
              $employees: 'username'
            }
          },
          { apptStartTime: -1 });
        return appointments || [];
      }).catch(e => strapi.services.utils.errorHandler('appointments.get', e, ctx));
  },
  meta: async () => {

    const socialAuth = await strapi.services.config.get('users-permissions', { bypassCache: true }).key('grant');

    return {
      signIn: await strapi.services.config.get('accounts').key('signIn'),
      signUp: await strapi.services.config.get('accounts').key('signUp'),
      forgotPassword: await strapi.services.config.get('accounts').key('forgotPassword'),
      mobilePhoneVerification: await strapi.services.config.get('accounts').key('mobilePhoneVerification'),
      socials: await strapi.services.config.get('general').key('socials'),
      website: (await strapi.services.config.get('general').key('storeInfo')).website,
      socialAuth: {
        facebook: _.get(socialAuth, 'facebook.enabled')
      }
    }
  },

  services: async () => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    const services = await strapi.services.items.getAllServices();
    const redirect = await strapi.services.config.get('appointments').key('redirect');
    const enabled = await strapi.services.config.get('appointments').key('enabled');

    return {
      ...enabled && !redirect && { services },
      meta: await strapi.services.appointments.appointmentsMeta(),
    }
  },
  employees: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    return strapi
      .services
      .joi
      .validate(ctx.query)
      .services({ returnObjectId: false })
      .result()
      .then(async values => {
        const acceptAppointmentsEmployees = await strapi.services.accounts.employees.acceptAppointments();
        const employeesWithCorrectServices = [];
        for (const employee of acceptAppointmentsEmployees) {
          if (Array.isArray(employee.items) && employee.items.length > 0) {
            let include = false;
            values.services.map(el => {
              include = _.includes(employee.items, el);
            });
            if (include) {
              employeesWithCorrectServices.push(employee);
            }
          } else {
            employeesWithCorrectServices.push(employee);
          }
        }

        return employeesWithCorrectServices || [];

      }).catch(e => strapi.services.utils.errorHandler('appointments.employees', e, ctx));

  },
  schedule: async ctx => {
    const appointmentsMeta = await strapi.services.appointments.appointmentsMeta();
    if (!appointmentsMeta.enabled) {
      return {
        meta: appointmentsMeta,
      }
    }
    return strapi
      .services
      .joi
      .validate({...ctx.query, ...ctx.params})
      .objectId('id')
      .services({ returnDBObject: true })
      .result()
      .then(async values => {
        const account = await strapi.services.accounts.employees.getById(values.id);
        if (!account) return ctx.notFound();
        // const vacationDates = Array.isArray(account.vacationDates) && account.vacationDates.filter(range =>  range[0] >= strapi.services.time.unix().startOfDay);
        return {
          ...await strapi.services.appointments.availableHours(account, values.services),
          // ... vacationDates.length > 0 && { vacationDates },
        }
      }).catch(e => strapi.services.utils.errorHandler('appointments.schedule', e, ctx));
  },
};
