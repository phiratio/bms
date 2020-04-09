'use strict';

/**
 * Waitinglist.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const mongoose = require('mongoose');
const _ = require('lodash');
const ObjectId = require('bson-objectid');

const {
  WAITING_LIST_STATUS_CANCELED,
  WAITING_LIST_TYPE_WALKINS,
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_RESERVED,
} = require('../../constants');

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
    const clients = await strapi.models.waitinglist.populate(aggregatedClients, [ { path: 'user' }, { path: 'employees' }, { path: 'user.avatar' } ]);

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

  getList: async (params, values, sort, metaCfg={}) => {
    const totalRecords = await Waitinglist.countDocuments( params );
    if (totalRecords <= 0) return;
    const pageSize = await strapi.services.config.get('waitinglist').key('pageSize');
    const currentPage = values.page || 1;
    let meta = {};

    if (_.isEmpty(metaCfg)) {
      meta = {
        currentPage,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        paginationLinks: await strapi.services.config.get('waitinglist').key('paginationLinks'),
      };
    } else {
      meta = metaCfg;
    }

    const waitingList = await Waitinglist
      .find(params, values.$exclude)
      .skip(values ? meta.pageSize *  meta.currentPage - meta.pageSize : null)
      .limit(meta.pageSize)
      .sort(sort)
      .populate('employees', values.$employees ? values.$employees : '-password')
      .populate('user', '-password')
      .populate('services');
    return {
      records: waitingList,
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
   * Promise to count appointments
   * @param params
   * @returns {*}
   */
  countAppointments: params => {
    return Waitinglist.find(params).countDocuments().exec();
  },

  /**
   * Promise to add a/an waitingList record.
   *
   * @return {Promise}
   */

  add: async (values) => {
    const listData = {
      type: values.type,
      status: values.status,
      services: values.services,
      ...(values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && { apptStartTime: strapi.services.time.unix(_.get(values, 'timeRange[0][0]')).toDate }),
      ...(values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && { apptEndTime: strapi.services.time.unix(_.get(values, 'timeRange[0][1]')).toDate }),
      flag: values.flag,
      check: false,
      note: values.note,
      user: values.type === WAITING_LIST_TYPE_RESERVED ? null : ObjectId(values.user._id),
      employees: values.employees.map(el => el.id),
      $unset: {
        ...(values.type === WAITING_LIST_TYPE_RESERVED && { user: 1 }),
        ...(values.type === WAITING_LIST_TYPE_WALKINS && { apptStartTime: 1 }),
        ...(values.type === WAITING_LIST_TYPE_WALKINS && { apptEndTime: 1 }),
      }
    };

    // Extract values related to relational data.
    const relations = _.pick(listData, Waitinglist.associations.map(ast => ast.alias));
    const data = _.omit(listData, Waitinglist.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Waitinglist.create(data);

    // Create relational data and return the entry.
    const newEntry = await Waitinglist.updateRelations({ _id: entry.id, values: relations });

    return new strapi.classes.waitingListRecord(newEntry, values);
  },

  /**
   * Promise to edit a/an waitingList record.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    let dataObject = {
      status: values.status,
      flag: values.flag,
      check: values.check,
      note: values.note,
      services: values.services,
    };
    if (!values.check) {
      dataObject = {
        type: values.type,
        status: values.status,
        services: values.services,
        ...values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && { apptStartTime: strapi.services.time.unix(_.get(values, 'timeRange[0][0]')).toDate },
        ...values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && { apptEndTime: strapi.services.time.unix(_.get(values, 'timeRange[0][1]' )).toDate },
        ...values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && _.get(values, 'apptStartTime') && { apptStartTime: values.apptStartTime },
        ...values.type !== WAITING_LIST_TYPE_WALKINS && values.status !== WAITING_LIST_STATUS_CANCELED && _.get(values, 'apptEndTime') && { apptEndTime: values.apptEndTime },
        flag: values.flag,
        check: values.check,
        note: values.note,
        ...Array.isArray(values.employees) && { employees: values.employees.map(el => el.id) },
        $unset: {
          ...values.type === WAITING_LIST_TYPE_WALKINS && { apptStartTime: 1 },
          ...values.type === WAITING_LIST_TYPE_WALKINS && { apptEndTime: 1 },
        }
      };
    }

    const oldRecord = await strapi.services.waitinglist.fetch(params);

    // Extract values related to relational data.
    const relations = _.pick(dataObject, Waitinglist.associations.map(a => a.alias));
    const data = _.omit(dataObject, Waitinglist.associations.map(a => a.alias));

    // Update entry with no-relational data.
    const entry = await Waitinglist.updateOne(params, data, { multi: true });


    // Update relational data and return the entry.
    const updatedEntry = await Waitinglist.updateRelations(Object.assign(params, { values: relations }));

    return new strapi.classes.waitingListRecord(updatedEntry, values, oldRecord);
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
   * Promise to return a list of appointments
   * @param params
   * @param values
   * @param sort
   * @returns {Promise<void>}
   */
  appointments: async (params={}, values, sort={ apptStartTime: 1, createdAt: 1 }) => {
    const query = { ...{
        type: [ WAITING_LIST_TYPE_APPOINTMENT, WAITING_LIST_TYPE_RESERVED ],
        check: false,
      }, ...params };
    const totalRecords = await strapi.services.waitinglist.countAppointments( query );
    if (totalRecords <= 0) return;
    const currentPage = values.page || 1;
    const pageSize = await strapi.services.config.get('appointments').key('pageSize');
    const paginationLinks = await strapi.services.config.get('appointments').key('paginationLinks');
    const appointments = await strapi.services.waitinglist.getList(query, values, sort, {
      currentPage,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      paginationLinks,

    }) || {};

    return appointments;

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
