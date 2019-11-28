'use strict';

/**
 * Buttons.js controller
 *
 * @description: A set of functions called "actions" for managing `Buttons`.
 */


module.exports = {

  /**
   * Perform an action when button was clicked once
   * @param ctx
   * @returns {Promise<void>}
   */
  onClick: async ctx => {
    if (!ctx.query.token) return ctx.badRequest(null, { errors: 'Invalid token provided'});
    const isEnabled = await strapi.services.buttons.isEnabled();
    if (!isEnabled) return ctx.badRequest(null, { errors: 'Functionality is not enabled' });
    const user = await strapi.services.buttons.getAssignedUser(ctx.query.token);
    const id = user.id;
    if (id) {
      const employee = await strapi.controllers.queue.getEmployeeById(id);
      if (!employee.initialized) {
        await strapi.controllers.queue.enableEmployee(id);
      }
      const moveResult = await strapi.controllers.queue.moveEmployeeToListEnd(employee);
      if (moveResult) {
        strapi.io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
        strapi.io.sockets.in('queue').emit('queue.flashEmployee', id);
      }
      return ctx.send({ statusCode: 200, message: 'ok' });
    }
    return ctx.badRequest(null, { errors: 'Unable to perform this action' });
  },

  /**
   * Perform an action when button was double clicked
   * @param ctx
   * @returns {Promise<void>}
   */
  onDoubleClick: async ctx => {
    if (!ctx.query.token) return ctx.badRequest(null, { errors: 'Invalid token provided'});
    const isEnabled = await strapi.services.buttons.isEnabled();
    if (!isEnabled) return ctx.badRequest(null, { errors: 'Functionality is not enabled' });
    const user = await strapi.services.buttons.getAssignedUser(ctx.query.token);
    const id = user.id;
    if (id) {
      const employee = await strapi.controllers.queue.getEmployeeById(id);
      if (employee.id) {
        const toggleStatusResult = await strapi.controllers.queue.toggleStatus(
          employee.id,
        );
        if (toggleStatusResult) {
          strapi.io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
          strapi.io.sockets.in('queue').emit('queue.flashEmployee', id);
        }
        return ctx.send({ statusCode: 200, message: 'ok' });
      }
    }
    return ctx.badRequest(null, { errors: 'Unable to perform this action' });
  },

  /**
   * Perform an action when button was hold
   * @param ctx
   * @returns {Promise<void>}
   */
  onHold: async ctx => {
    if (!ctx.query.token) return ctx.badRequest(null, { errors: 'Invalid token provided'});
    const isEnabled = await strapi.services.buttons.isEnabled();
    if (!isEnabled) return ctx.badRequest(null, { errors: 'Functionality is not enabled' });
    const user = await strapi.services.buttons.getAssignedUser(ctx.query.token);
    const id = user.id;
    if (id) {
      const employee = await strapi.controllers.queue.getEmployeeById(id);
      if (employee.id) {
        await strapi.controllers.queue.toggleEmployeeList(employee.id);
        strapi.io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
        strapi.io.sockets.in('queue').emit('queue.flashEmployee', id);
        return ctx.send({ statusCode: 200, message: 'ok' });
      }
    }
    return ctx.badRequest(null, { errors: 'Unable to perform this action' });
  },

};
