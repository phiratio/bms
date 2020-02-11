'use strict';
const { DAY_1, DAY_7, HOUR_1, HOUR_6, HOUR_12, MINUTES_5, MINUTES_20  } = require('../../constants');
/**
 * Settings.js controller
 *
 * @description: A set of functions called "actions" for managing `Settings`.
 */

module.exports = {

  /**
   * Retrieve settings records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {

    const buttons = await strapi.services.tokens.fetchAll({ type: 'button' }) || [];
    let employees = await strapi.controllers.queue.getAllEmployees() || [];
    employees = employees.filter(el => el.name !== 'Anyone');
    return {
      queue: {
        scheduleClearQueue: await strapi.services.config.get('queue').key('scheduleClearQueue'),
      },
      accounts: {
        signUp: await strapi.services.config.get('accounts').key('signUp'),
        signIn: await strapi.services.config.get('accounts').key('signIn'),
        mobilePhoneVerification: await strapi.services.config.get('accounts').key('mobilePhoneVerification'),
        forgotPassword: await strapi.services.config.get('accounts').key('forgotPassword'),
        deleteUnusedAccounts: await strapi.services.config.get('accounts').key('deleteUnusedAccounts'),
      },
      appointments: {
        enabled: await strapi.services.config.get('appointments').key('enabled'),
        sendReminderPriorTime: await strapi.services.config.get('appointments').key('sendReminderPriorTime'),
        priorTime: await strapi.services.config.get('appointments').key('priorTime'),
        futureBooking: await strapi.services.config.get('appointments').key('futureBooking'),
        autoConfirm: await strapi.services.config.get('appointments').key('autoConfirm'),
        redirect: await strapi.services.config.get('appointments').key('redirect'),
        showOnTvOnlyTodayRecords: await strapi.services.config.get('appointments').key('showOnTvOnlyTodayRecords'),
        notificationSlackPublic: await strapi.services.config.get('appointments').key('notificationSlackPublic'),
        notificationSlackPrivate: await strapi.services.config.get('appointments').key('notificationSlackPrivate'),
        redirectCfg: await strapi.services.config.get('appointments').key('redirectCfg'),
        timeStep: await strapi.services.config.get('appointments').key('timeStep'),
        showInWaitingListTime: await strapi.services.config.get('appointments').key('showInWaitingListTime'),
      },
      waitinglist: {
        askEmail: await strapi.services.config.get('waitinglist').key('askEmail'),
        preSelectEmployees: await strapi.services.config.get('waitinglist').key('preSelectEmployees'),
        allowSelectEmployee: await strapi.services.config.get('waitinglist').key('allowSelectEmployee'),
        emailReviewRequest: await strapi.services.config.get('waitinglist').key('emailReviewRequest'),
        showTimeoutModal: await strapi.services.config.get('waitinglist').key('showTimeoutModal'),
        showOnTv: await strapi.services.config.get('waitinglist').key('showOnTv'),
      },
      // servicesAndPrices: await settings.general.get({ key: 'servicesAndPrices' }),
      timeRanges: {
        from_5min_to_20min: strapi.services.time.generate.from_5min_to_20min_array(),
        from_5min_to_1hour: strapi.services.time.generate.from_5min_to_1hour_array(),
        from_1hour_to_12hour: strapi.services.time.generate.from_1hour_to_12hour_array(),
        from_1hour_to_6hour: strapi.services.time.generate.from_1hour_to_6hour_array(),
        from_1day_to_7day: strapi.services.time.generate.from_1day_to_7day(),
      },
      generalSettings: {
        workingHours: await strapi.services.config.get('general').key('workingHours'),
        closedDates: await strapi.services.config.get('general').key('closedDates'),
      },
      buttons: {
        enabled: await strapi.services.config.get('buttons').key('enabled'),
        data: buttons.map(el => ({
          id: el._id,
          name: el.name,
          ...(el.user && el.user.username && { username: el.user.username }),
          ...(el.user && el.user._id && { userid: el.user._id }),
        })
        ),
      },
      employees
    };


  },


  /**
   * Update general settings
   *
   * @return {Object}
   */
  updateGeneralSettings: async(ctx, next) => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.request.body })
      .weekTimeRanges('workingHours', { allowNull: true })
      .dateRange('closedDates', { allowMultipleDates: true, pastDates: true })
      .result()
      .then(async data => {
        const workingHours = data.workingHours;
        const closedDates = data.closedDates;
        await strapi.services.config.set('general').key('workingHours', workingHours);
        await strapi.services.config.set('general').key('closedDates', closedDates);
        return { message: { success: true }, notifications: { flash: { msg: 'Successfully saved', type: 'success' } }};
      })
      .catch(e => {
        if (e.message) strapi.log.error('settings.updateGeneralSettings Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Update Flic buttons settings
   * @param ctx
   * @param next
   * @returns {Q.Promise<any>}
   */
  updateButtons: async (ctx, next) => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.request.body })
      .object('button.data',
        {
          keys: {
            employee: strapi.services.joi.class.string().allow('').required().error(() => 'Invalid employee provided'),
            buttonId: strapi.services.joi.class.string().regex(/^[0-9A-Fa-f]{24}$/).required(),
          }
        })
      .result()
      .then(async data => {
        const buttonId = data['button.data'].buttonId;
        const employeeName = data['button.data'].employee;

        const allEmployees = await strapi.controllers.queue.getAllEmployees();
        let employee;

        if (typeof employeeName === 'string' && employeeName.length === 0) employee = null;
        else employee = allEmployees.filter(el => el.name === employeeName)[0].id;

        if(employee === undefined) return ctx.notFound();
        const button = await strapi.services.tokens.fetch({ type: 'button', _id: buttonId });

        if (button.id) {
          const updatedButton = await strapi.services.tokens.edit({ _id: button.id }, { user: employee });
          if (updatedButton) {
            const token = await strapi.plugins['users-permissions'].services.jwt.verify(button.token);
            await strapi.services.buttons.clearCache(token.id);
            return { success: true, notifications: { flash: { msg: 'Successfully saved', type: 'success' } }};
          } else {
            return ctx.notFound();
          }
        }
        return ctx.notFound();
      })
      .catch(e => {
        if (e.message) strapi.log.error('settings.updateButtons Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });

  },

  /**
   * Update a/an settings record.
   *
   * @return {Object}
   */

  updateServicesAndPrices: async (ctx, next) => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.request.body })
      .arrayWithObject('servicesAndPrices',
        {
          name: strapi.services.joi.class.string().max(50).required().error(() => 'Invalid name provided'),
          price: strapi.services.joi.class.number().integer().required().error(() => 'Invalid price provided'),
          priceAppt: strapi.services.joi.class.number().integer().required().error(() => 'Invalid appointment price provided'),
          showInAppt: strapi.services.joi.class.boolean(),
          showInPos: strapi.services.joi.class.boolean(),
          time: strapi.services.joi.class.object().keys({
            id: strapi.services.joi.class.number().required().min(300 /* 5 minutes */).max(60 * 60 /* 1 hour */),
            name: strapi.services.joi.class.string().required().max(14),
          }),
          description: strapi.services.joi.class.string().max(150).allow('').required().error(() => 'Invalid description provided'),
        })
      .result()
      .then(async data => {
        const servicesAndPrices = data.servicesAndPrices;
        await strapi.services.config.set('general').key('servicesAndPrices', servicesAndPrices);
        return { message: { success: true }, notifications: { flash: { msg: 'Successfully saved', type: 'success' } }};
      })
      .catch(e => {
        if (e.message) strapi.log.error('settings.updateServicesAndPrices Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  /**
   * Update a/an settings record.
   *
   * @return {Object}
   */
  update: async (ctx, next) => {
    return strapi
      .services
      .joi
      .validate({ ...ctx.request.body })
      .boolean('queue.scheduleClearQueue', { optional: true })
      .boolean('waitinglist.askEmail', { optional: true })
      .boolean('waitinglist.preSelectEmployees', { optional: true })
      .boolean('waitinglist.allowSelectEmployee', { optional: true })
      .boolean('waitinglist.emailReviewRequest', { optional: true })
      .boolean('waitinglist.showTimeoutModal', { optional: true })
      .boolean('waitinglist.showOnTv', { optional: true })
      .boolean('accounts.deleteUnusedAccounts', { optional: true })
      .boolean('accounts.mobilePhoneVerification', { optional: true })
      .boolean('accounts.signIn', { optional: true })
      .boolean('accounts.signUp', { optional: true })
      .boolean('accounts.forgotPassword', { optional: true })
      .boolean('buttons.enabled', { optional: true })
      .boolean('appointments.enabled', { optional: true })
      .boolean('appointments.redirect', { optional: true })
      .boolean('appointments.showOnTvOnlyTodayRecords', { optional: true })
      .boolean('appointments.notificationSlackPublic', { optional: true })
      .boolean('appointments.notificationSlackPrivate', { optional: true })
      .object('appointments.redirectCfg', {
        keys: {
          url: strapi.services.joi.class.string().uri({ scheme: ['http', 'https'] }).allow([null, '']),
        },
        optional: true,
      })
      .boolean('appointments.autoConfirm', { optional: true })
      .validateTimeObject('appointments.priorTime', { from: HOUR_1, to: HOUR_12, step: HOUR_1, optional: true })
      .validateTimeObject('appointments.timeStep', { from: MINUTES_5, to: MINUTES_20, step: MINUTES_5, optional: true })
      .validateTimeObject('appointments.futureBooking', { from: DAY_1, to: DAY_7, step: DAY_1, optional: true })
      // .validateTimeObject('appointments.showInWaitingListTime', { from: HOUR_1, to: HOUR_12, step: HOUR_1, optional: true, allowNull: true })
      .validateTimeObject('appointments.sendReminderPriorTime', { from: HOUR_1, to: HOUR_6, step: HOUR_1, optional: true, allowNull: true })
      .result()
      .then(async data => {
        try {
          const settingName = Object.keys(data).filter(el => data[el] !== undefined)[0].split('.');
          const settingValue = data[`${settingName[0]}.${settingName[1]}`];
          await strapi.services.config.set(settingName[0]).key(settingName[1], settingValue);

          if (settingName[0] === 'waitinglist' && settingName[1] === 'showTimeoutModal') {
            strapi.io.sockets.emit('waitinglist.registration.config', { showTimeoutModal: await strapi.services.config.get('waitinglist').key('showTimeoutModal')});
          } else if (settingName[0] === 'appointments' && settingName[1] === 'showInWaitingListTime') {
            strapi.io.sockets.emit('waitingList.setClients', true);
          }
          return { message: { success: true }, notifications: { flash: { msg: 'Successfully saved', type: 'success' } }};
        } catch(e) {
          strapi.log.error('settings.update Error: %s', e.message);
          return ctx.notFound();
        }
      })
      .catch(e => {
        if (e.message) strapi.log.error('settings.update Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },


};
