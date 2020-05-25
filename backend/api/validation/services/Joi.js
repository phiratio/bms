const BaseJoi = require('@hapi/joi');
const _ = require('lodash');
const mongoose = require('mongoose');
const libphonenumber = require('libphonenumber-js');
const objectId = require('bson-objectid');
const sanitizeHtml = require('sanitize-html');

const { DAY_1, MINUTES_10 } = require('../../constants');
const ALLOW_NULL = true;
const ALLOW_PAST_DATES = true;
const DO_NOT_ALLOW_NULL = false;

const JoiString = joi => ({
  base: joi.string(),
  name: 'string',
  language: {
    phoneNumber: 'Please provide correct phone number'
  },
  // pre(value, state, prefs) {
  //   return value.replace(/[^- ()+\d]/g,'') // Change the value
  // },
  rules: [
    {
      name: 'phoneNumber',
      validate(params, value, state, prefs) {
        try {
          const phoneNumberInternational = libphonenumber.parsePhoneNumberFromString(value);
          // const phoneNumberNational = libphonenumber.parsePhoneNumberFromString(value, 'US');

          if (phoneNumberInternational && phoneNumberInternational.isValid()) {
            return phoneNumberInternational.format('E.164');

          // } else if (phoneNumberNational && phoneNumberNational.isValid()) {
          //   return phoneNumberNational.formatNational();
          } else {
            throw new Error('Please provide correct phone number')
          }
        } catch(e) {
          return this.createError('string.phoneNumber', {value}, state, prefs);
        }

      }
    },
  ]
});

const JoiMath = joi => ({
  base: joi.number(),
  name: 'number',
  language: {
    moduloZero: 'Wrong number was provided'
  },
  rules: [
    {
      name: 'moduloZero',
      params: {
        divisor: joi.number().required(),
      },
      validate(params, value, state, prefs) {
        if (value % params.divisor !== 0) {
          return this.createError('number.moduloZero', {value}, state, prefs);
        } else {
          return value
        }
      }
    },
  ]
});

const JoiTimeComparator = joi => ({
  base: joi.array(),
  name: 'array',
  language: {
    timeComparator: 'Wrong values provided'
  },
  rules: [
    {
      name: 'timeComparator',
      params: {
        action: joi.any().required(),
        allowNull: joi.boolean(),
        propertyName: joi.string(),
      },
      validate(params, value, state, prefs) {
        const path = state.path;
        const parent = state.parent;
        const timeRanges = parent[params.propertyName];

        const first = params.propertyName ? timeRanges[path[3]][0] : parent[path[1]][0][0];
        const second = params.propertyName ? timeRanges[path[3]][1] : parent[path[1]][0][1];

        if (params.allowNull && first === null && second === null) {
          return value;
        }

        if (Number.isInteger(first) && Number.isInteger(second)) {
          if (typeof params.action === 'function') {
            const result = params.action({ value, start: first, end: second,  arr: timeRanges, index: path[3] });
            if (result instanceof Error) {
              return this.createError('array.timeComparator', {value}, state, prefs);
            }
            return result;
          } else if (params.action === 'a < b' && first < second) {
            return value;
          } else if (params.action === 'a > b' && first > second) {
            return value;
          } else  if (params.action === 'a === b' && first === second) {
            return value;
          }
        }
        return this.createError('array.timeComparator', {value}, state, prefs);
      }
    },
  ]
});


const JoiDateComparator = joi => ({
  base: joi.array(),
  name: 'array',
  language: {
    dateComparator: 'Wrong values provided'
  },
  rules: [
    {
      name: 'dateComparator',
      params: {
        action: joi.string().required(),
        allowNull: joi.boolean(),
        pastDates: joi.boolean(),
      },
      validate(params, value, state, prefs) {
        const first = value[0];
        const second = value[1];
        if (params.pastDates === false && new Date().getTime() / 1000 > first) {
          return this.createError('array.dateComparator', {value}, state, prefs);
        }
        if (Number.isInteger(first) && Number.isInteger(second)) {
          if (params.action === 'a <= b' && first <= second) {
            return value;
          } else if (params.action === 'a >= b' && first >= second) {
            return value;
          } else  if (params.action === 'a === b' && first === second) {
            return value;
          }
        }
        return this.createError('array.dateComparator', {value}, state, prefs);
      }
    },
  ]
});

const Joi = BaseJoi.extend(JoiMath).extend(JoiString).extend(JoiTimeComparator).extend(JoiDateComparator);


/**
 * String sanitation function
 * @param value
 * @returns {*}
 */
const sanitize = (value) => {
  if (!value) return undefined;
  // removes double spaces
  return value.replace(/ +(?= )/g, '');
};

module.exports = {
  /**
   * Expose main class, so it can be used outside
   */
  class: Joi,
  /**
   * Main validation function
   * @param entries object Objact that contains key:value pairs of data that should be validated
   * @returns {{role(*=): exports, string(*=, *=): exports, validateTimeObject(*=, {from: *, to: *, step: *, optional?: *}): *, result(): Promise<R|any|T>, schedule(*=, *=): *, number(*=, *=): exports, password(*=): exports, phoneNumber(*=, *=): exports, boolean(*=, *=): exports, weekTimeRanges(*=, *=): exports, arrayWithObject(*=, *=, *=): exports, employees(*=): exports, email(*=): exports, objectId(*=, *=): exports, isIn(*=, *=, *=): exports, object(*=, *=): exports, username(*=): exports}}
   */
  validate: function(entries = {}) {
    const MAX_STRING_LENGTH = 60;
    const PASSWORD_MIN_LENGTH = 7;
    const data = {};
    const schema = {};
    const async = {};
    const keys = [];
    const settings = {};
    return {
      /**
       * Validates an array of arrays containing two timestamps from date and to date
       * e.g. [[1565998596, 1565998596], [1565998596, 1565998596]]
       * @param name
       * @param options
       */
      dateRange(name, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.array().items(
          Joi.array().ordered().items(
            Joi.date().timestamp('unix').raw(),
          ).dateComparator('a <= b', ALLOW_NULL, options.pastDates).length(2)
        ).min(0).max(options.allowMultipleDates ? 365 : 1);
        if(options.allowNull) schema[name] = schema[name].allow(null);
        return this;
      },
      /**
       * Validates arbitrary filter object
       * @param name
       * @param options
       * @returns {exports}
       */
      filter(name, obj, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.object(obj);
        if (!options.optional) schema[name] = schema[name].required();
        if(options.allowNull) schema[name] = schema[name].allow(null);
        return this;
      },
      /**
       * Validates an object containing weekdays as key and status and time ranges (an array [from, to]) as values
       * e.g {"sunday": {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }, "monday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }, "tuesday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }, "wednesday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }, "thursday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] },	"friday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }, "saturday":  {status: true, timeRanges: [[ 80100, 81000 ],[ 80100, 81000 ]] }}
       * @param name
       * @param options
       */
      schedule(name, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] =
          Joi.object().pattern(
            /(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/,
            Joi.object({
              status: Joi.boolean(),
              timeRanges: Joi.array().items(
                Joi.array().items(
                  Joi.number().moduloZero(MINUTES_10).min(0).max(DAY_1).error(() =>  'Wrong hours provided'),
                ).length(2).timeComparator(({ value, start, end, arr, index }) => {
                  const previousEndTime = _.get(arr[ index - 1 ], '[1]');
                  const lastValue = _.get(arr[ arr.length - 1 ],'[1]');
                  if (start > end || start <= previousEndTime || start === end || lastValue > DAY_1 - MINUTES_10) {
                    return new Error('First value cannot be more than second');
                  }
                  return value;
                }, DO_NOT_ALLOW_NULL, 'timeRanges').error(() => 'Wrong hours provided')
              ).error(() => 'Wrong time ranges provided')
            })
          );
        if (!options.optional) schema[name] = schema[name].required();
        if(options.allowNull) schema[name] = schema[name].allow(null);
        return this;
      },
      /**
       * Validates an object containing time in seconds as `id` and amount of time as `name`
       * e.g. { id: 7200, name: "2 hours" }
       * @param name
       * @param options
       */
      validateTimeObject(name, { from, to, step, optional, allowNull }) {
        keys.push(name);
        const timeRange = strapi.services.time.generateRange({ from, to, step, returnArray: true });
        data[name] = entries[name];
        settings[name] = { from, to, step, optional };
        const id = _.get(entries[name], 'id');
        schema[name] = Joi.object({
          id: Joi.number().valid(timeRange.map(el => el.id)).required(),
          name: Joi.string().valid(strapi.services.time.formatDuration({ duration: id })).required(),
        });
        if(allowNull) schema[name] = schema[name].allow(null, false);
        if (!optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Validates an object containing weekdays as key and time ranges (an array [from, to]) as values
       * e.g {"sunday": [ 80100, 81000 ], "monday": [ 80100, 81000 ], "tuesday": [ 80100, 81000 ], "wednesday": [ 80100, 81000 ], "thursday": [ 80100, 81000 ],	"friday": [ 80100, 81000 ], "saturday": [ 80100, 81000 ]}
       * @param name
       * @param options
       * @returns {exports}
       */
      weekTimeRanges(name, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] =
          Joi.object().pattern(
            /(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/,
            Joi.array().items(
              Joi.array().items(
                Joi.number().moduloZero(MINUTES_10).min(0).max(DAY_1).error(() => 'Wrong hours provided'),
                options.allowNull ? Joi.string().allow(null) : false,
              ).timeComparator('a < b', ALLOW_NULL).length(2)
            ).min(0).max(2).error(() => 'Wrong hours provided')
          ).length(options.length || 7);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Mobile Phone number validation
       * @param name
       * @param options
       * @returns {exports}
       */
      mobilePhone(name, options={}) {
        keys.push(name);
        const isEmpty = _.isNil(entries[name]) || entries[name] === '';
        // Treat all mobile numbers without plus sign as local (US) numbers
        data[name] = isEmpty ? null : _.get(entries, `['${name}']`, '').startsWith('+') ? entries[name] : `+1${entries[name]}`;
        settings[name] = options;
        schema[name] = Joi.string().trim().max(17).error(() => 'Wrong mobile phone number provided');
        if (!isEmpty) schema[name] = schema[name].phoneNumber();
        if (options.optional) schema[name] = schema[name].allow('').allow(null);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Object within an array validation
       * @param name
       * @param objectPattern
       * @param options
       * @returns {exports}
       */
      arrayWithObject(name, objectPattern, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.array().items(Joi.object().keys(objectPattern));
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Object validation function
       * @param name
       * @param options
       * @returns {exports}
       */
      object(name, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.object().keys(options.keys);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Url validation function
       * @param name
       * @param options
       * @returns {exports}
       */
      url(name, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.string().uri({ scheme: ['http', 'https'] });
        if (options.optional) schema[name] = schema[name].allow([null,'']);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Email validation function
       * @param name string
       * @param options object
       * @returns {exports}
       */
      email(options={}) {
        const name = options.name || 'email';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.string().email({ minDomainSegments: 2 }).max(MAX_STRING_LENGTH).trim();
        if (options.optional) schema[name] = schema[name].allow([null,'']);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * String validation function
       * @param name string
       * @param options object
       * @returns {exports}
       */
      string(name, options={}) {
        keys.push(name);
        let value = entries[name];
        if (options.sanitize ? options.sanitize : true) {
          value = sanitize((value));
        }
        if (options.startCase) data[name] = _.startCase(_.toLower(value));
        else data[name] = value;
        settings[name] = options;
        /**
         * ^             # Anchor at start of string
         * (?!-)         # Assert that the first character isn't a - (Negative lookahead)
         * (?!.*--)      # Assert that there are no -- present anywhere
         * [a-zA-Z -]+    # Match one or more allowed characters (+ means match one or more of the preceding token)
         * (?<!-)        # Assert that the last one isn't a -
         * $             # Anchor at end of string
         */
        schema[name] = Joi
          .string()
          .regex(options.regex || /^(?!-)(?!.*--)[A-Za-z -]+(?<!-)$/)
          .max(options.max || MAX_STRING_LENGTH)
          .trim(options.trim ? options.trim : true)
          .normalize()
          .error(() => `Please provide correct ${options.label || name}`);
        if (options.allowEmpty) {
          schema[name] = schema[name].allow(['',null]);
          data[name] = null;
        }
        if (!options.optional) schema[name] = schema[name].required();
        if (options.min) schema[name] = schema[name].min(options.min);
        if (options.max) schema[name] = schema[name].max(options.max);
        return this;
      },
      /**
       * MongoDB ObjectId validation function
       * @param name string
       * @param options object
       * @returns {exports}
       */
      objectId(name, options = {}) {
        keys.push(name);
        if (options.return === 'mongoId')
          data[name] = mongoose.Types.ObjectId(entries[name]);
        else data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.string().regex(/^[0-9a-fA-F]{24}$/).error(() => 'Wrong object id provided');
        if(!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Boolean validation object
       * @param name string
       * @param options object
       * @returns {exports}
       */
      boolean(name, options = {}) {
        keys.push(name);
        data[name] = entries[name];
        schema[name] = Joi.boolean();
        settings[name] = options;
        if (options.optional) schema[name] = schema[name].allow(null);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Number validation function
       * @param name string
       * @param options object
       * @returns {exports}
       */
      number(name, options = {}) {
        keys.push(name);
        data[name] = entries[name];
        schema[name] = Joi.number();
        settings[name] = options;
        if (!options.optional) schema[name] = schema[name].required();
        if (options.optional) schema[name] = schema[name].allow(null);
        if (options.integer) {
          schema[name] = schema[name].integer().min(options.min).max(options.max)
        }
        if (options.max) schema[name] = schema[name].max(options.max);
        if (options.min) schema[name] = schema[name].min(options.min);
        if (options.positive) schema[name] = schema[name].positive();
        if (options.error) schema[name] = schema[name].error(() => options.error);
        return this;
      },

      /**
       * Role validation function
       * @param options
       * @returns {exports}
       */
      role(options={}) {
        const name = 'role';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        if (options.name) {
          schema[name] = Joi.string().alphanum().max(MAX_STRING_LENGTH).error(() => 'Wrong role name provided');
        } else {
          schema[name] = Joi.string().regex(/^[0-9a-fA-F]{24}$/).error(() => 'Wrong role name provided');
        }
        if (!options.optional) schema[name] = schema[name].required().min(1);
        return this;
      },

      /**
       * Items validation function
       * @param options
       * @returns {exports}
       */
      items(options={}) {
        const name = 'items';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.array().items(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/).error(() => 'Wrong items name provided')
        );
        if (!options.optional) schema[name] = schema[name].required().min(1);
        return this;
      },

      /**
       * Username validation function
       * @param options
       * @returns {exports}
       */
      username(options={}) {
        const name = 'username';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.string().alphanum().max(MAX_STRING_LENGTH).allow(['',null]).error(() => 'Please provide correct username');
        if (!options.optional) schema[name] = schema[name].min(2).required();
        return this;
      },

      /**
       * Employees validation function
       * @param options
       * @returns {exports}
       */
      employees(options={}) {
        const name = 'employees';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.array().error(() => 'Please provide employees in a correct form');
        if (!options.optional) schema[name] = schema[name].min(1).required();
        if (!options.optional && options.max) schema[name] = schema[name].max(options.max);
        return this;
      },
      /**
       * Services validation function
       * @param options
       * @returns {exports}
       */
      services(options={}) {
        const name = 'services';
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        schema[name] = Joi.array().error(() => 'Please provide services in a correct form');
        if (!options.optional) schema[name] = schema[name].min(1).required();
        return this;
      },
      /**
       * Validation function that checks in `name` is in `array`
       * @param name
       * @param array
       * @param options
       * @returns {exports}
       */
      isIn(name, array, options={}) {
        keys.push(name);
        data[name] = entries[name];
        settings[name] = options;
        if (Array.isArray(data[name])) schema[name] = Joi.array().items(Joi.string().valid(array));
        else schema[name] = Joi.string().valid(array).error(() => `Wrong ${name} provided`);
        if (!options.optional) schema[name] = schema[name].required();
        return this;
      },
      /**
       * Password validation function
       * @param name
       * @param options
       * @returns {exports}
       */
      password(options={}) {
        const fieldName = !options.field ? 'password' : options.field;
        const value = sanitize(entries[fieldName]);
        keys.push(fieldName);
        data[fieldName] = value;
        settings[fieldName] = options;
        schema[fieldName] = Joi.string().strict().min(PASSWORD_MIN_LENGTH);
        if (!options.optional) schema[fieldName] = schema[fieldName].required();
        return this;
      },

      /**
       * Sanitize html
       * https://github.com/apostrophecms/sanitize-html/
       * @param name
       * @param options
       * @returns {exports}
       */
      sanitizeHtml(name, options={}) {
        keys.push(name);
        data[name] = sanitizeHtml(
          entries[name],
          options,
        );
        schema[name] = Joi.string();
        if (!options.optional) schema[name] = schema[name].required();
        settings[name] = options;
        return this;
      },
      /**
       * Processing validation function
       * @returns {Promise<R | any | T>}
       */
      async result() {
        return Joi
          .validate(data, Joi.object().keys(schema).with('joi', keys), {abortEarly: false})
          .then(async result => {
            // TODO: Refactor below. Find a better solution for async validation
            // Second stage validation: Validate data against database
            const secondStageSchema = {};
            const secondStageKeys = [];
            const secondStageData = {};

            if (keys.includes('employees') && result.employees) {
              result.employees = _.uniq(result.employees);
              const employees = await strapi.controllers.queue.getAllEmployees();
              const anyoneEmployee = employees.filter(el => el.name === 'Anyone');
              const providedEmployees = [];
              if (result.employees.includes('Anyone')) {
                result.employees = anyoneEmployee;
              } else {
                result.employees.map(el => {
                  const index = employees.findIndex(i => i.name === el);
                  if (index > -1) {
                    providedEmployees.push(employees[index]);
                  }
                });
                if (providedEmployees.length === 0) throw new Error('Employees were not found');
                result.employees = providedEmployees;
              }
            }

            if (keys.includes('services') && result.services) {

              const returnObjectId = _.get(settings, `services.returnObjectId`, false);
              const returnDBObject = _.get(settings, `services.returnDBObject`, false);

              const allItems = await strapi.services.items.getAllServices();
              const itemsIds = allItems.map(el => String(el._id));
              result.services = _.uniq(result.services);
              const intersectedItems = _.intersection(itemsIds, result.services);

              if (intersectedItems.length !== result.services.length) {
                throw new Error('One or more provided services are invalid')
              }

              if (returnObjectId) {
                result.services = intersectedItems.map(el => objectId(el));
              } else if (returnDBObject) {
                const mappedServices = result.services.map(el => ({ id: el }));
                result.services = _.intersectionBy( allItems, mappedServices, 'id' );
              } else {
                result.services = intersectedItems;
              }
            }

            if (keys.includes('email') || keys.includes('user.email')) {
              const key = keys.includes('email') ? 'email' : 'user.email';
              const uniqueEmailSetting = _.get(settings, `['${key}'].unique`, false);
              const checkBlacklists = _.get(settings, `['${key}'].checkBlacklists`, false);
              const mxValidation = _.get(settings, `['${key}'].mxValidation`, false);
              let email = _.get(entries, `['${key}']`, false);
              email = email ? email.toLowerCase() : null;
              result[key] = email;

              try {
                if (email) {
                  if (mxValidation) {
                    const verification = await strapi.services.email.verify(email);
                    if (!verification.validDomain || !verification.wellFormed) {
                      throw new Error('Invalid domain');
                    }
                  }

                  if (checkBlacklists && await strapi.services.email.isDisposable(email)) {
                    throw new Error('Disposable emails not allowed');
                  }

                  if (uniqueEmailSetting) {

                    if (settings[key].update && result[key]) {
                      const originalUser = await strapi.services.accounts.fetch({ _id: objectId(result.id) });
                      if (originalUser.email === email) {
                        secondStageKeys.splice(secondStageKeys.indexOf(key), 0);
                        delete secondStageData[key];
                        delete secondStageSchema[key];
                      } else {
                        const userWithEmail = await strapi.services.accounts.fetch({ email });
                        if (userWithEmail) {
                          throw new Error('Email was already taken');
                        }
                      }
                    } else {
                      const userWithEmail = await strapi.services.accounts.fetch({ email });
                      if (userWithEmail) {
                        throw new Error('Email was already taken');
                      }
                    }
                  }
                }

              } catch (e) {
                secondStageKeys.push(key);
                secondStageData[key] = email;
                secondStageSchema[key] = Joi.string().invalid(email).error(() => e.message);
              }

            }

            if (keys.includes('mobilePhone') || keys.includes('user.mobilePhone')) {
              const key = keys.includes('mobilePhone') ? 'mobilePhone' : 'user.mobilePhone';
              const mobilePhone = result[key];
              const uniquePhoneNumber = _.get(settings, `['${key}'].unique`, true);
              const isUpdate = _.get(settings, `['${key}'].update`, false);
              const isEmpty = _.isNil(mobilePhone) || mobilePhone === '';
              let searchForUniquePhoneNumbers = true;
              if (isUpdate && result.id) {
                const originalUser = await strapi.services.accounts.fetch({ _id: objectId(result.id) });
                if (originalUser.mobilePhone === mobilePhone) {
                  secondStageKeys.splice(secondStageKeys.indexOf(key), 0);
                  delete secondStageData[key];
                  delete secondStageSchema[key];
                  searchForUniquePhoneNumbers = false;
                }
              }

              if (uniquePhoneNumber && !isEmpty && searchForUniquePhoneNumbers) {
                const userWithMobilePhone = await strapi.services.accounts.fetch({ mobilePhone });
                if (userWithMobilePhone) {
                  secondStageKeys.push(key);
                  secondStageData[key] = mobilePhone;
                  secondStageSchema[key] = Joi.string().invalid(userWithMobilePhone.mobilePhone).error(() => 'Mobile phone already taken');
                }
              }
            }

            // Check if provided role exist in database
            if (keys.includes('role')) {
              secondStageKeys.push('role');
              secondStageData.role = result.role;
              const roleErrorMessage = 'Wrong role name was provided';
              const roles = await strapi.services.accounts.getRoles();
              if (_.get(settings, 'role.name')) {
                secondStageSchema.role = Joi.string().valid(roles.map(el => el.type)).error(() => roleErrorMessage);
              } else {
                secondStageSchema.role = Joi.string().valid(roles.map(el => el.id.toString())).error(() => roleErrorMessage);
              }
            }

            // Check if provided role exist in database
            if (keys.includes('items')) {
              secondStageKeys.push('items');
              secondStageData.items = result.items;
              const itemsErrorMessage = 'Wrong item name was provided';
              const items = await strapi.services.items.getAllItems();
              secondStageSchema.items = Joi.array().items(items.map(el => el.id)).error(() => itemsErrorMessage)
            }

            // Check if provided username is unique
            if (keys.includes('username') && result.username) {

              result.username = _.upperFirst(_.toLower(result.username));
              const user = await strapi.services.accounts.fetch({username: result.username});

              if (user) {
                secondStageKeys.push('username');
                secondStageData.username = result.username;
                secondStageSchema.username = Joi.string().invalid(user.username).error(() => 'Username was already taken');
              }
              if (settings.username.update && result.id) {
                const originalUser = await strapi.services.accounts.fetch({ _id: objectId(result.id) });
                if (originalUser.username === result.username) {
                  secondStageKeys.splice(secondStageKeys.indexOf('username'), 0);
                  delete secondStageData.username;
                  delete secondStageSchema.username;
                }
              }

            }

            await Joi.validate(secondStageData, Joi.object().keys(secondStageSchema).with('joi', secondStageKeys), {abortEarly: false});
            if (result.password === undefined) delete result.password;
            if (result.username === undefined) delete result.username;
            return result;
          })
          .catch(e => {
            if (e.message && !e.details) {
              throw {name: e.message};
            } else {
              const errors = {};
              if (Array.isArray(e.details)) {
                e.details.map(el => {
                  errors[el.path[0]] = {
                    param: el.path[0],
                    msg: el.message,
                  };
                });
              }
              throw {
                errors,
              };
            }
          });
      },
    };
  }
};
