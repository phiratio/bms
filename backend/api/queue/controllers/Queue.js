'use strict';

/**
 * Queue.js controller - helper controller
 * In order to set permissions to a certain role every action should be exposed via controller
 *
 * @description: A set of functions called "actions" for managing `Queue`.
 */

module.exports = {

  /**
   * Retrieve queue employee records.
   *
   * @return {Object|Array}
   */

  getEmployees: async () => {
    return strapi.services.queue.get();
  },

  getAllEmployees: async () => {
    return strapi.services.queue.getAll();
  },

  toggleStatus: async (id) => {
    return strapi.services.queue.toggleStatus(id);
  },

  toggleEmployeeList: async (id) => {
    return strapi.services.queue.toggleEmployeeList(id);
  },

  enableEmployee: async (id) => {
    return strapi.services.queue.enableEmployee(id);
  },

  disableEmployee: async (id) => {
    return strapi.services.queue.disableEmployee(id);
  },

  moveEmployee: async (element) => {
    return strapi.services.queue.moveEmployee(element);
  },

  moveEmployeeToListEnd: async (element) => {
    return strapi.services.queue.moveEmployeeToListEnd(element);
  },

  addToCache: async (user, list) => {
    return strapi.services.queue.addToCache(user, list);
  },

  updateCache: async (user) => {
    return strapi.services.queue.updateCache(user);
  },

  removeFromCache: async (user) => {
    return strapi.services.queue.removeFromCache(user);
  },

  getEmployeeById: async (id) => {
    return strapi.services.queue.getById(id);
  },

};
