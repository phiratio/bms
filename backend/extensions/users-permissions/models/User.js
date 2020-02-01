'use strict';

const _ = require('lodash');

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  // Before saving a value.
  // Fired before an `insert` or `update` query.
  // beforeSave: async (model) => {console.log(model)},

  // After saving a value.
  // Fired after an `insert` or `update` query.
  // afterSave: async (model, result) => { console.log() },

  // Before fetching all values.
  // Fired before a `fetchAll` operation.
  // beforeFetchAll: async (model) => {},

  // After fetching all values.
  // Fired after a `fetchAll` operation.
  // afterFetchAll: async (model) => {console.log(model)},

  // Fired before a `fetch` operation.
  // beforeFetch: async (model) => {},

  // After fetching a value.
  // Fired after a `fetch` operation.
  // afterFetch: async (model, result) => {},

  // Before creating a value.
  // Fired before `insert` query.
  // beforeCreate: async (model) => {},

  // After creating a value.
  // Fired after `insert` query.
  // afterCreate: async (model, result) => {},

  // Before updating a value.
  // Fired before an `update` query.
  // beforeUpdate: async (model) => {},

  // After updating a value.
  // Fired after an `update` query.
  // afterUpdate: async (model, result) => {},

  // Before destroying a value.
  // Fired before a `delete` query.
  // beforeDestroy: async (model) => {},

  // After destroying a value.
  // Fired after a `delete` query.
  afterDestroy: async (model, result) => {
    strapi.log.info(`accounts.remove Account deleted: %s`, `${result.firstName} ${result.lastName}` );
    await strapi.services.waitinglist.deleteMany({ user: result._id },(err, response) => {
        const namespace = 'accounts.afterdestroy.waitinglist.cleanup';
        if (err) return strapi.log.error(namespace, err);
        if(response.deletedCount > 0) strapi.log.info(`${namespace} Number of cleaned up records: %s`, response.deletedCount , response);
    });

    await strapi.services.accounts.deleteAvatar(result);
  },
};
