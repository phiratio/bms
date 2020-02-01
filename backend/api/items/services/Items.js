'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

const REDIS_NAMESPACE = 'items';

module.exports = {
  /**
   * Promise to fetch items.
   * @param params object mongodb search query
   * @param values object current query params
   * @param sort object mongodb sort object
   * @return {Promise}
   */
  getItems: async (params, values, sort) => {
    const totalRecords = await Items.countDocuments(params);
    if (totalRecords <= 0) return;
    const pageSize = await strapi.services.config.get('items').key('pageSize');
    const currentPage = parseInt(values.page) || 1;
    const items = await Items
      .find(params)
      .skip(pageSize * currentPage - pageSize)
      .limit(pageSize)
      .sort(sort);

    const meta = {
      currentPage,
      pageSize: totalRecords < pageSize ? totalRecords : pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      paginationLinks: await strapi.services.config.get('items').key('paginationLinks'),
    };

    return {
      records: items,
      meta,
    };
  },

  /**
   * Promise to fetch all items.
   * @param params object mongodb search query
   * @param values object current query params
   * @param sort object mongodb sort object
   * @return {Promise}
   */
  getAllItems: async (sort = { index: 1}) => {
    return Items.find().select(['-createdAt', '-updatedAt','-__v']).sort(sort) || [];
  },

  getAllServices: async(sort = { index: 1 }) => {
    const cached = await strapi.services.redis.get(`${REDIS_NAMESPACE}:AllServices`);
    if (cached) {
      return cached;
    }
    const allServices = await strapi.services.items.getAllItems(sort);
    await strapi.services.redis.set(`${REDIS_NAMESPACE}:AllServices`, allServices);
    return allServices;
  },

  /**
   * Deleted cached data
   * @returns {Promise<*|void|request.Request>}
   */
  clearCache: () => {
    return strapi.services.redis.del(`${REDIS_NAMESPACE}`)
  },

};
