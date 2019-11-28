'use strict';

/**
 * Waitinglist.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const mongoose = require('mongoose');
const _ = require('lodash');

module.exports = {
  /**
   * Promise to fetch all visits.
   * @param params object mongodb search query
   * @param values object current query params
   * @param sort object mongodb sort object
   * @return {Promise}
   */
  getVisits: async (params, values, sort) => {
    const totalRecords = await Waitinglist.countDocuments( params );
    if (totalRecords <= 0) return;
    const pageSize = await strapi.services.config.get('waitinglist').key('pageSize');
    const currentPage = parseInt(values.page) || 1;
    const waitingList = await Waitinglist
      .find(params)
      .skip(pageSize *  currentPage - pageSize)
      .limit(pageSize)
      .sort(sort)
      .populate('employees');

    const meta = {
      currentPage,
      pageSize: totalRecords < pageSize ? totalRecords : pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      paginationLinks: await strapi.services.config.get('waitinglist').key('paginationLinks'),
    };

    return {
      records: waitingList,
      meta,
    };
  },

  /**
   * Promise to fetch all clients.
   * @param params object mongodb search query
   * @param values object current query params
   * @param sort object mongodb sort object
   * @return {Promise}
   */
  getClients: async (id, values, sort) => {
    const pageSize = await strapi.services.config.get('waitinglist').key('pageSize');
    const currentPage = parseInt(values.page) || 1;
    const aggregatedClients = await Waitinglist
      .aggregate([
        {
          '$match': {
            'employees': mongoose.Types.ObjectId(id),
          }
        },
        {
          '$group': {
            '_id': '$user',
            'employees': { '$first': '$employees' },
            'user': {'$first': '$user' },
          }
        },
        {
          '$skip': pageSize *  currentPage - pageSize,
        },
        {
          '$limit': pageSize,
        },
      ]);

    const totalRecords = await Waitinglist
      .aggregate([
        {
          '$match': {
            'employees': mongoose.Types.ObjectId(id),
          }
        },
        {
          '$group': {
            '_id': '$user',
          }
        },
      ]);

    const clients = await Waitinglist.populate(aggregatedClients, [ { path: 'user' }, { path: 'employees' }, { path: 'avatar' } ]);

    const meta = {
      currentPage,
      pageSize: totalRecords.length < pageSize ? totalRecords.length : pageSize,
      totalRecords: totalRecords.length,
      totalPages: Math.ceil(totalRecords.length / pageSize),
      paginationLinks: await strapi.services.config.get('waitinglist').key('paginationLinks'),
    };

    return {
      records: clients,
      meta
    };
  },

  /**
   * Promise to fetch all waitingLists.
   * @param params object mongodb search query
   * @param values object current query params
   * @param sort object mongodb sort object
   * @return {Promise}
   */

  getList: async (params, values, sort) => {
    const totalRecords = await Waitinglist.countDocuments( params );
    if (totalRecords <= 0) return;
    const pageSize = await strapi.services.config.get('waitinglist').key('pageSize');
    const currentPage = values.page || 1;
    const meta = {
      currentPage,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      paginationLinks: await strapi.services.config.get('waitinglist').key('paginationLinks'),

    };
    const waitingList = await Waitinglist
      .find(params)
      .skip(values ? pageSize *  currentPage - pageSize : null)
      .limit(pageSize)
      .populate(['user', 'services'])
      .sort(sort)
      .populate('employees');
    return {
      clients: waitingList,
      meta,
    };
  },

  /**
   * Promise to fetch a/an waitingList.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Waitinglist.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    return Waitinglist
      .findOne(_.pick(params, _.keys(Waitinglist.schema.paths)))
      .populate(populate);
  },

  /**
   * Promise to count waitinglists.
   *
   * @return {Promise}
   */

  count: (query) => {
    return Waitinglist
      .find(query)
      .countDocuments()
      .exec();
  },

  /**
   * Promise to add a/an waitinglist.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Waitinglist.associations.map(ast => ast.alias));
    const data = _.omit(values, Waitinglist.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Waitinglist.create(data);

    // Create relational data and return the entry.
    return Waitinglist.updateRelations({ _id: entry.id, values: relations });
  },

  /**
   * Promise to edit a/an waitinglist.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Waitinglist.associations.map(a => a.alias));
    const data = _.omit(values, Waitinglist.associations.map(a => a.alias));

    // Update entry with no-relational data.
    const entry = await Waitinglist.updateOne(params, data, { multi: true });

    // Update relational data and return the entry.
    return Waitinglist.updateRelations(Object.assign(params, { values: relations }));
  },

  /**
   * Promise to remove a/an waitinglist.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Select field to populate.
    const populate = Waitinglist.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Waitinglist
      .findOneAndRemove(params, {})
      .populate(populate);

    if (!data) {
      return data;
    }

    await Promise.all(
      Waitinglist.associations.map(async association => {
        if (!association.via || !data._id || association.dominant) {
          return true;
        }

        const search = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: data._id } : { [association.via]: { $in: [data._id] } };
        const update = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: null } : { $pull: { [association.via]: data._id } };

        // Retrieve model.
        const model = association.plugin ?
          strapi.plugins[association.plugin].models[association.model || association.collection] :
          strapi.models[association.model || association.collection];

        return model.update(search, update, { multi: true });
      })
    );

    return data;
  },

  /**
   * Promise to delete records from Users model
   * @param query
   * @param callback
   * @returns {*|Promise<*>|Promise<*>}
   */
  deleteMany(query={}, callback) {
    return Waitinglist.deleteMany(query, callback);
  },

  /**
   * Promise to search a/an waitinglist.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Mongo.
    const filters = strapi.utils.models.convertParams('waitinglist', params);
    // Select field to populate.
    const populate = Waitinglist.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    const $or = Object.keys(Waitinglist.attributes).reduce((acc, curr) => {
      switch (Waitinglist.attributes[curr].type) {
        case 'integer':
        case 'float':
        case 'decimal':
          if (!_.isNaN(_.toNumber(params._q))) {
            return acc.concat({ [curr]: params._q });
          }

          return acc;
        case 'string':
        case 'text':
        case 'password':
          return acc.concat({ [curr]: { $regex: params._q, $options: 'i' } });
        case 'boolean':
          if (params._q === 'true' || params._q === 'false') {
            return acc.concat({ [curr]: params._q === 'true' });
          }

          return acc;
        default:
          return acc;
      }
    }, []);

    return Waitinglist
      .find({ $or })
      .sort(filters.sort)
      .skip(filters.start)
      .limit(filters.limit)
      .populate(populate);
  }
};
