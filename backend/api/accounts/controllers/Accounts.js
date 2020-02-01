'use strict';
const { DAY_1, DAY_7, HOUR_1, HOUR_12, GROUP_NAME_ADMINISTRATOR } = require('../../constants');
const _ = require('lodash');
const objectId = require('bson-objectid');

/**
 *  Accounts.js controller
 *  Retrieves users from user-permission plugin
 */
module.exports = {
  /**
   * Retrieve a list of users
   * @param ctx Koa object
   * @returns { Promise }
   */
  find: async ctx => {
    return strapi
      .services
      .joi
      .validate(ctx.query)
      .number('page', { optional: true, positive: true })
      .number('limit', { optional: true, positive: true, max: 100 })
      .string('search', { optional: true, sanitize: false, regex: /^(?!-)(?!.*--)[A-Za-z0-9 -.@]+(?<!-)$/ })
      .result()
      .then(async values => {
        let search;
        if (values.search ) {
          const matchPhoneNumber = values.search.match(/^[0-9 ]*$/);
          const matchInternationalPhoneNumber = values.search.match(/^[+0-9 ]*$/);
          if (values.search.indexOf(' ') > -1 && !matchPhoneNumber && !matchInternationalPhoneNumber) {
            // We assume that if provided search query has spaces we have to treat it as a Full Name
            const fullName = values.search.match(/^(\S+)\s(.*)/);
            search = {
              $or:
                [
                  {firstName:{$regex: fullName[1], $options: 'i'}},
                  {lastName:{$regex: fullName[2] || '', $options: 'i'}}
                ]
            };
          } else if (matchPhoneNumber || matchInternationalPhoneNumber) {
            search = {
              $or:
                [
                  { mobilePhone:{$regex: values.search.replace(/[\n\r\s\t]+/g, ''), $options: 'i'}},
                ]
            };
          }
          else {
            search = {
              $or:
                [
                  { firstName: {$regex: values.search, $options: 'i'} },
                  { lastName: {$regex: values.search, $options: 'i'} },
                  { email: {$regex: values.search, $options: 'i'} },
                  { username: {$regex: values.search, $options: 'i'} },
                ],
            };
          }

        }

        const pageSize = values.limit || await strapi.services.config.get('accounts').key('pageSize');
        const paginationLinks = await strapi.services.config.get('accounts').key('paginationLinks');
        const currentPage = values.page || 1;
        const totalRecords = await strapi.services.accounts.count(values.search && search);
        const totalPages = Math.ceil(totalRecords / pageSize);
        const users = await strapi
          .services
          .accounts
          .fetchAll({
            skip: pageSize *  currentPage - pageSize,
            limit: pageSize,
            ...values.search && { query: search }
          });
        return ctx.send({
          users,
          meta: {
            totalPages,
            currentPage,
            pageSize,
            totalRecords,
            paginationLinks
          },
        });
      }).catch(e => {
        if (e.message) strapi.log.error('accounts.find Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });

  },

  /**
   *  Retrieve one user object
   * @param ctx Koa object
   * @returns {Promise}
   */

  findOne: async ctx => {
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(async values => strapi.services.accounts.fetch({ _id: values.id }))
      .catch((e) => {
        if (e.message) strapi.log.error('accounts.findOne Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },
  /**
   * Retrieves data required for accounts
   * @returns {Promise}
   */
  getMetaData: async () => {
    const roles = await strapi.services.accounts.getRoles();
    const items = await strapi.services.items.getAllItems();
    return {
      employeeRoles: await strapi.services.accounts.getEmployeeRoles(),
      timeRanges: {
        from_1hour_to_12hour: strapi.services.time.generate.from_1hour_to_12hour_array(),
        from_1day_to_7day: strapi.services.time.generate.from_1day_to_7day(),
      },
      roles: roles.map(el => ({ id: el.id, name: el.name, })),
      items,
    };
  },

  /**
   * Creates a user record using users-permissions plugin
   * @param ctx
   * @returns {Promise}
   */
  create: async ctx => {
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .boolean('blocked', { optional: true })
      .boolean('autoConfirmAppointments', { optional: true })
      .boolean('confirmed', { optional: true })
      .boolean('customAppointmentsHours', { optional: true })
      .boolean('acceptAppointments', { optional: true })
      .dateRange('vacationDates', { allowMultipleDates: true })
      .boolean('enableSchedule', { optional: true })
      .string('firstName', { label: 'First Name', startCase: true })
      .string('lastName', { label: 'Last Name', startCase: true })
      .string('description', { label: 'Description', max: 250, optional: true, allowEmpty: true })
      .email( { optional: true, unique: true, mxValidation: true, checkBlacklists: true })
      .mobilePhone('mobilePhone', { optional: true, unique: true })
      .role()
      .username( { optional: true })
      .schedule('customAppointmentsSchedule', { allowNull: true, optional: true })
      .schedule('schedule', { allowNull: true, optional: true })
      .password({ optional: true })
      .validateTimeObject('futureBooking', { from: DAY_1, to: DAY_7, step: DAY_1, optional: true })
      .validateTimeObject('priorTimeBooking', { from: HOUR_1, to: HOUR_12, step: HOUR_1, optional: true })
      .result()
      .then(async values => {
        const role = await strapi.services.accounts.getRole(values.role);
        const errors = {};
        if (role.name === GROUP_NAME_ADMINISTRATOR && !values.email) {
          errors.email = { msg: 'Accounts in Administator group should have emails', param: 'email' };
        }

        if (await strapi.services.accounts.isEmployeeRole(role.name) && !values.username) {
          errors.username = { msg: `Accounts in ${_.startCase(role.name)} group should have usernames`, param: 'username' };
        }

        if (Object.keys(errors).length > 0) {
          return ctx.badRequest(null, { errors });
        }
        values.createdAt = Date.now();
        return strapi
          .plugins['users-permissions']
          .services
          .user
          .add(values)
          .then(async user => {
            strapi.services.eventemitter.emit('accounts.create', { ...user, role: {...role._doc} });
            return user;
          });
      })
      .catch(e => {
        if (e.message) strapi.log.error('accounts.create Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Updates user record
   * @param ctx
   * @returns {Promise}
   */
  update: async ctx => {
    return strapi
      .services
      .joi
      .validate({...ctx.params, ...ctx.request.body})
      .objectId('id')
      .boolean('blocked', { optional: true })
      .boolean('autoConfirmAppointments', { optional: true })
      .boolean('acceptAppointments', { optional: true })
      .boolean('confirmed', { optional: true })
      .boolean('enableSchedule', { optional: true })
      .boolean('customAppointmentsHours', { optional: true })
      .dateRange('vacationDates', { allowMultipleDates: true, allowNull: true })
      .items({ optional: true })
      .string('firstName', { label: 'First Name' })
      .string('lastName', { label: 'Last Name' })
      .string('description', { label: 'Description', max: 250, optional: true, allowEmpty: true })
      .email( { optional: true, update: true, unique: true, mxValidation: true, checkBlacklists: true  })
      .mobilePhone('mobilePhone', { update: true, optional: true, unique: true })
      .role()
      .username( { optional: true, update: true})
      .schedule('customAppointmentsSchedule', { allowNull: true, optional: true })
      .schedule('schedule', { allowNull: true, optional: true })
      .validateTimeObject('futureBooking', { from: DAY_1, to: DAY_7, step: DAY_1, optional: true, allowNull: true })
      .validateTimeObject('priorTimeBooking', { from: HOUR_1, to: HOUR_12, step: HOUR_1, optional: true, allowNull: true })
      .password({ optional: true })
      .result()
      .then(async values => {
        const role = await strapi.services.accounts.getRole(values.role);
        const errors = {};
        if (role.name === GROUP_NAME_ADMINISTRATOR && !values.email) {
          errors.email = { msg: 'Accounts in Administator group should have emails', param: 'email' };
        }

        if (await strapi.services.accounts.isEmployeeRole(role.name) && !values.username) {
          errors.username = { msg: 'Accounts in Employee group should have usernames', param: 'username' };
        }

        if (Object.keys(errors).length > 0) {
          return ctx.badRequest(null, { errors });
        }
        const original = await strapi.services.accounts.fetch({ _id: objectId(values.id) });
        values.updatedAt = Date.now();
        if (original.email !== values.email && original.slackId) {
          values.slackId = null;
        }
        return strapi
          .services
          .accounts
          .update({ id: values.id }, values)
          .then(async user => {
            strapi.services.eventemitter.emit('accounts.update', { ...user, role: {...role._doc }, original });
            return {..._.pick(user, strapi.services.accounts.USER_FIELDS),
              ...{ notifications: {
                  flash: {
                    msg: 'Successfully saved', 'type':'success'
                  }
                }
              }};
          });
      })
      .catch(e => {
        if (e.message) strapi.log.error('accounts.update Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Removes user
   * @param ctx Koa object
   * @returns {Promise<void>}
   */
  remove: async ctx => {
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(async res =>  strapi.services.accounts.delete(res))
      .then(user => strapi.services.eventemitter.emit('accounts.remove', user))
      .catch(e => {
        if (e.message) strapi.log.error('accounts.remove Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },
  /**
   * Gets profile of a currently logged in user
   * @param ctx
   */
  getProfile: ctx => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    let data = _.omit(user.toJSON ? user.toJSON() : user, ['blocked','confirmed','description', 'password', 'resetPasswordToken', 'tokens', 'preferredEmployees', 'linkedTokens', 'visits']);
    // Send 200 `ok`
    ctx.send({ ...data, role: data.role.name });
  },

  /**
   * Updates profile of a currently loggged in user
   * @param ctx
   * @returns {Promise<void>}
   */
  updateProfile: async ctx => {
    const user = ctx.state.user;
    if (!user) return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    const data = { ...ctx.request.body, ...{ role: user.role._id.toString() } };
    if (data.username === user.username) delete data.username;
    return strapi
      .services
      .joi
      .validate(data)
      .string('firstName', { label: 'First Name' })
      .string('lastName', { label: 'Last Name' })
      .role()
      .username( { optional: true, update: true})
      .result()
      .then(async values => {
        delete values.role;
        values.updatedAt = Date.now();
        return strapi
          .plugins['users-permissions']
          .services
          .user
          .edit({ id: user.id }, values)
          .then(async user => {
            if (await strapi.services.accounts.isEmployeeRole(user.role.name)) {
              await strapi.controllers.queue.updateCache(user);
              strapi.io.sockets.emit(
                'queue.setEmployees',
                await strapi.controllers.queue.getEmployees(),
              );
            }
            return { ...user, ...{ role: user.role.name, }, ...{ notifications: {
                  flash: {
                    msg: 'Successfully saved', 'type':'success'
                  }
                }
              } };
          });
      }).catch(e => {
        if (e.message) strapi.log.error('accounts.updateProfile Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });

  },

  /**
   * Changes currently logged in user's password
   * @param ctx
   * @returns {Promise<void>}
   */
  changePassword: async ctx => {
    const user = ctx.state.user;
    if (!user) return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .password()
      .result()
      .then(async values => {
        return strapi
          .plugins['users-permissions']
          .services
          .user
          .edit({ id: user.id }, { password: values.password })
          .then(async () => {
            return ctx.send({ notifications: { flash: { msg: 'Successfully changed', type: 'success' } } });
          });
      }).catch(e => {
        if (e.message) strapi.log.error('accounts.changePassword Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });

  },

  /**
   * Clear avatar
   * @param ctx
   * @returns {Promise<void>}
   */
  clearAvatar: async (ctx) => {
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .objectId('id')
      .result()
      .then(async values => {
        const account = await strapi.services.accounts.fetch({ _id: objectId(values.id) });
        const avatarId = _.get(account, 'avatar._id');
        if (avatarId) {
          await strapi.services.accounts.deleteAvatar(account);
          const updatedAccount = await strapi.services.accounts.fetch({ _id: objectId(values.id) });
          strapi.services.eventemitter.emit('accounts.avatar.clear', updatedAccount, ctx);
          return ctx.send({}); // Send 200 `ok`
        }
        return ctx.badRequest(null, 'Bad request');
      })
      .catch((e) => {
        if (e.message) strapi.log.error('accounts.clearAvatar Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Upload avatar
   * @param ctx
   * @returns {Promise<void>}
   */
  uploadAvatar: async (ctx) => {
    try {
      // TODO: Implement validation process !important
      // Retrieve provider configuration.
      const config = await strapi.services.config.get('upload').key('provider');
      // Verify if the file upload is enable.
      if (config.enabled === false) {
        return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Upload.status.disabled' }] }] : 'File upload is disabled');
      }

      // Extract optional relational data.
      const { refId, ref, source, field, path } = ctx.request.body;
      const { files = {} } = ctx.request.files;

      if (_.isEmpty(files)) {
        return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Upload.status.empty' }] }] : 'Files are empty');
      }

      // Transform stream files to buffer
      const buffers = await strapi.plugins.upload.services.upload.bufferize(files);
      const enhancedFiles = buffers.map(file => {
        if (file.size > config.sizeLimit) {
          return ctx.badRequest(null, ctx.request.admin ? [{ messages: [{ id: 'Upload.status.sizeLimit', values: {file: file.name} }] }] : `${file.name} file is bigger than limit size!`);
        }

        // Add details to the file to be able to create the relationships.
        if (refId && ref && field) {
          Object.assign(file, {
            related: [{
              refId,
              ref,
              source,
              field
            }]
          });
        }

        // Update uploading folder path for the file.
        if (path) {
          Object.assign(file, {
            path
          });
        }

        return file;
      });

      // Something is wrong (size limit)...
      if (ctx.status === 400) {
        return;
      }
      const account = await strapi.services.accounts.fetch({ _id: objectId(refId) });
      if (!account) return ctx.badRequest(null);

      const avatarId = _.get(account, 'avatar._id');

      if (avatarId) {
        await strapi.plugins['upload'].services.upload.remove({ _id: avatarId }, config);
      }

      const uploadedFiles = await strapi.plugins.upload.services.upload.upload(enhancedFiles, config);
      const updatedAccount = await strapi.services.accounts.fetch({ _id: objectId(refId) });
      strapi.services.eventemitter.emit('accounts.avatar.upload', updatedAccount, ctx);

      // Send 200 `ok`
      ctx.send(uploadedFiles.map((file) => {
        // If is local server upload, add backend host as prefix
        if (file.url && file.url[0] === '/') {
          file.url = strapi.config.url + file.url;
        }

        if (_.isArray(file.related)) {
          file.related = file.related.map(obj => obj.ref || obj);
        }

        return file;
      }));
    } catch(e) {
      if (e.message) strapi.log.error('accounts.uploadAvatar Error: %s', e.message);
      if (e instanceof TypeError) return ctx.badRequest(null, e.message);
      return ctx.badRequest(null, e);
    }
  },

};
