'use strict';

const _ = require('lodash');
const googleApis = require('googleapis');

/**
 * A set of functions called "actions" for `Appointments`
 */

module.exports = {
  terms: async () => strapi.services.business.terms(),
  contacts: async () => strapi.services.business.info(),
  meta: async () => ({
    signIn: await strapi.services.config.get('accounts').key('signIn'),
    signUp: await strapi.services.config.get('accounts').key('signUp'),
    forgotPassword: await strapi.services.config.get('accounts').key('forgotPassword'),
    mobilePhoneVerification: await strapi.services.config.get('accounts').key('mobilePhoneVerification'),
    socials: await strapi.services.config.get('general').key('socials'),
    website: (await strapi.services.config.get('general').key('storeInfo')).website,
  }),

  services: async () => {
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
