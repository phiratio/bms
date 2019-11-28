'use strict';

/**
 * Tokens.js controller
 *
 * @description: A set of functions called "actions" for managing `Tokens`.
 */

module.exports = {

  /**
   * Retrieve tokens records.
   *
   * @return {Object|Array}
   */

  find: async (ctx) => {
    if (ctx.query._q) {
      return strapi.services.tokens.search(ctx.query);
    } else {
      return strapi.services.tokens.fetchAll(ctx.query);
    }
  },

  /**
   * Retrieve a tokens record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.tokens.fetch(ctx.params);
  },

  /**
   * Count tokens records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.tokens.count(ctx.query);
  },

  /**
   * Create a/an tokens record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.tokens.add(ctx.request.body);
  },

  /**
   * Update a/an tokens record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.tokens.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an tokens record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.tokens.remove(ctx.params);
  }
};
