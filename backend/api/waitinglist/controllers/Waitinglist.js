'use strict';

const { WAITING_LIST_TYPE_WALKINS, WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_RESERVED} = require('../../constants');

/**
 * Waitinglist.js controller
 *
 * @description: A set of functions called "actions" for managing `Waitinglist`.
 */

const moment = require('moment');
const _ = require('lodash');

module.exports = {

  /**
   * Retrieve waitinglist records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    return strapi
      .services
      .joi
      .validate(ctx.query)
      .number('page', { optional: true, positive: true })
      .isIn('listType', ['all', 'recent', 'checked'], { optional: true })
      .result()
      .then(async values => {
        const listType = values.listType || 'all';
        let recent = { clients: [] };
        let checked = { clients: [] };

        if (listType === 'recent' || listType === 'all') {
          const showInWaitingListTime = await strapi.services.config.get('appointments').key('showInWaitingListTime');
          recent = await strapi.services.waitinglist.getList({
            $or: [
              {
                createdAt: {
                  $gte: strapi.services.time.startOfDay(),
                  $lt: strapi.services.time.endOfDay(),
                },
                type: WAITING_LIST_TYPE_WALKINS,
                check: false,
              },
              {
                apptStartTime: {
                  $gte: strapi.services.time.startOfDay(),
                  $lt: strapi.services.time.now().add(showInWaitingListTime.id, 'seconds').toDate(),
                },
                type: [ WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_RESERVED ],
                check: false,
              }
            ]
          }, values, { apptStarTime: -1, createdAt: 1 }) || {};

          if (listType === 'recent') return {recent};
        }
        if (listType === 'checked' || listType === 'all') {
          checked = await strapi.services.waitinglist.getList({
            updatedAt: {
              $gte: strapi.services.time.startOfDay(),
              $lt: strapi.services.time.endOfDay(),
            },
            check: true,
          }, values, { updatedAt: -1 }) || {};

          if (listType === 'checked') return {checked};
        }
        if (Array.isArray(recent.clients) && recent.clients.length > 0) {
          const lastElementIndex = recent.clients.length - 1;
          recent.clients[lastElementIndex] = {
            ...recent.clients[lastElementIndex]._doc,
            flash: true,
          };
        }

        const appointments =  await strapi.services.appointments.calendar();

        return {
          recent,
          checked,
          appointments,
        };
      }).catch(e => {
        if (e.message) strapi.log.error('waitinglist.find Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Retrieve a waitinglist record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(data=>{
        return strapi.services.waitinglist.fetch({ _id: data.id }).then(async data => {
          strapi.io.sockets.emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
          const waitingRecordData = data.toObject();
          const employeeId = _.get(waitingRecordData, 'employees[0].id', undefined);

          // list of services

          return {
            ...waitingRecordData,
            ... { timeStep: await strapi.services.config.get('appointments').key('timeStep') },
            ...((waitingRecordData.type === WAITING_LIST_TYPE_APPOINTMENT || waitingRecordData.type === WAITING_LIST_TYPE_RESERVED) && employeeId) &&
              { timeline:
                  await strapi.services.accounts.getEmployeeTimeline(employeeId)
              },
              date: moment(waitingRecordData.apptStartTime).unix(),
              meta: {
                ...{ items: await strapi.services.accounts.getEmployeeServices(employeeId)},
              }
          }
        });
      }).catch( e => {
        if (e.message) strapi.log.error('waitinglist.findOne Error: %s', e.message);
        ctx.notFound()
      });
  },

  /**
   * Count waitinglist records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.waitinglist.count(ctx.query);
  },

  /**
   * Create a waitinglist record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    const body = ctx.request.body;
    return strapi
      .services
      .joi
      .validate(body)
      .string('firstName', { label: 'First Name', startCase: true })
      .string('lastName', { label: 'Last Name', startCase: true })
      .email({ optional: true, unique: true })
      .isIn('skipSteps', ['fullName','email','employees'], { optional: true })
      .employees({ optional: true })
      .result()
      .then(async data => {
        const skipSteps = data.skipSteps || [];
        // Verify if user exists
        const user = await strapi.services.accounts.fetch({ firstName: data.firstName, lastName: data.lastName }) || {};

        const askEmail = await strapi.services.config.get('waitinglist').key('askEmail');
        const preSelectEmployees = await strapi.services.config.get('waitinglist').key('preSelectEmployees');
        const allowSelectEmployee = await strapi.services.config.get('waitinglist').key('allowSelectEmployee');
        console.log('askEmail', askEmail,allowSelectEmployee);

        if (askEmail && skipSteps.indexOf('email') === -1 && !data.email && !user.email) {
          return ctx.badRequest('No email was provided', {
            hasEmail: Boolean(user.email),
            nextStep: 'email',
          });
        }

        if (!data.employees && allowSelectEmployee) {
          const allEmployees = await strapi.controllers.queue.getAllEmployees();
          const preferredEmployees = [];
          if (Array.isArray(allEmployees) && user.preferredEmployees) {
            user.preferredEmployees.map(emId => {
              allEmployees.map(el => {
                if (el.id === emId) preferredEmployees.push(el);
              });
            });
          }
          return ctx.badRequest('No employees provided', {
            ...(user.preferredEmployees && preSelectEmployees && {
              preferredEmployees: preferredEmployees,
            }),
            listOfEmployees: await strapi.controllers.queue.getEmployees(),
            hasEmail: askEmail ?  Boolean(user.email) : true,
            ...(askEmail === false) && { hasEmail: true },
            nextStep: 'employees',
          });
        }

        if (!allowSelectEmployee || ( Array.isArray(data.employees) && data.employees.length === 0 )) {
          const employees = await strapi.controllers.queue.getEmployees();
          data.employees = employees.enabled.filter(el => el.name === 'Anyone');
        }
        if (data.employees) data.preferredEmployees = data.employees.filter(el => el.name !== 'Anyone').map(el => el.id);
        let client;
        // Create accounts if does not exist
        if (!user.id) {
          const clientRole = await strapi.services.accounts.getRoleByName('Client');
          const newUserData = {
            firstName: data.firstName,
            lastName: data.lastName,
            ...(data.email && { email: data.email }),
            blocked: true,
            role: clientRole._id,
            ...(data.preferredEmployees.length > 0 && { preferredEmployees: data.preferredEmployees }),
          };
          client = await strapi
            .plugins['users-permissions']
            .services
            .user
            .add(newUserData);
          strapi.services.eventemitter.emit('accounts.create', client);
        } else {
          client = user;
          const toUpdate = {
            preferredEmployees: data.preferredEmployees,
          };
          await strapi.plugins['users-permissions'].services.user.edit({ id: user.id }, toUpdate);
        }
        const newClientRecord = {
          user: client.id,
          employees: data.employees.map(el => el.id),
          check: false,
        };
        return strapi.services.waitinglist.add(newClientRecord).then(async record => {
          strapi.services.eventemitter.emit('waitinglist.create', ctx, record);
          return { message: 'success' };
        });

      }).catch(e => {
        if (e.message) strapi.log.error('waitinglist.create Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Update a/an waitinglist record.
   *
   * @return {Object}
   */

  update: async ctx => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.params, ...ctx.request.body })
      .objectId('id')
      .employees()
      .result()
      .then(data => {
        return strapi
          .services
          .waitinglist
          .edit({ _id: data.id }, { employees: data.employees.map(el => el.id) })
          .then(async data => {
            await strapi
              .plugins['users-permissions']
              .services
              .user
              .edit({ id: data.user._id }, { preferredEmployees: data.employees.map(el => el.id) });

            strapi.io.sockets.emit('waitingList.setClients', true);
            return data;
          });
      }).catch(e => {
        if (e.message) strapi.log.error('waitinglist.update Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Toggles property of waitingList object
   * @param ctx
   * @returns {Promise}
   */
  toggleProperty: async ctx => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.params })
      .objectId('id', { optional: false, return: 'objectId' })
      .isIn('property', ['flag', 'check'], { optional: false })
      .result()
      .then(async result => {
        return strapi.services.waitinglist.fetch({ _id: result.id }).then(async record => {
          if (record.id) {
            const updatedRecord = await strapi.services.waitinglist.edit({ _id: record._id }, { [result.property]: !record[result.property]  });
            if (updatedRecord) {
              strapi.io.sockets.emit('waitingList.setClients', true);
              const emailReviewRequest = await strapi.services.config.get('waitinglist').key('emailReviewRequest');
              let user = {};
              if (record.user) {
                user = {
                  id: record.user.id,
                  firstName: record.user.firstName,
                  lastName: record.user.lastName,
                  email: record.user.email,
                  reviewRequested: record.user.reviewRequested,
                };
              }
              if (emailReviewRequest && user.email && !user.reviewRequested) {
                strapi.services.messagebroker.publish('email:request-review', user);
              }
              return updatedRecord;
            } else throw new Error('Unable to toggle property');
          } else throw new Error('Record was not found');
        }).catch(() => {
          return ctx.notFound();
        });
      })
      .catch(e => {
        if (e.message) strapi.log.error('waitinglist.toggleProperty Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

};
