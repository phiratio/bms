'use strict';

const { HOUR_1, HOUR_6, HOUR_12, MINUTES_5, DAY_1, DAY_7, MINUTES_20, DAY_30, DAY_60, DAY_90, DAY_120 } = require('../../constants');

const Moment = require('moment');
const MomentRange = require('moment-range');
const MomentDurationFormatSetup = require('moment-duration-format');

const moment = MomentRange.extendMoment(Moment);
MomentDurationFormatSetup(moment);


module.exports = {
  /**
   * Generates moment time range
   * e.g.
   * @param from starting point in seconds
   * @param to ending point in seconds
   * @param step time between steps in seconds
   * @param returnObject returns an array ob objects
   * @returns {Array}
   */
  generateRange: ({from, to, step, returnArray}) => {

    const timeRanges = [];
    for (let i = from; i <= to; i += step) {
      if (returnArray) {
        timeRanges.push({ id: i, name: moment.duration(i, "seconds").format("d [days], h [hours], m [minutes], ", { trim: "all" })  })
      } else {
        //  "w [weeks], d [days], h [hours], m [minutes], s [seconds]"
        timeRanges.push(moment.duration(i, "seconds").format("d [days], h [hours], m [minutes], ", { trim: "all" }))
      }
    }

    return timeRanges;
  },

  formatDuration: ({duration, unit='seconds', format='d [days], h [hours], m [minutes]', options={ trim: "all" }}) => {
    return moment.duration(duration, unit).format(format, options);
  },

  /**
   * Aliases for most used time ranges
   */
  generate: {
    from_5min_to_20min_array: () => strapi.services.time.generateRange({ from: MINUTES_5, to: MINUTES_20, step: MINUTES_5, returnArray: true }),
    from_5min_to_1hour_array: () => strapi.services.time.generateRange({ from: MINUTES_5, to: HOUR_1, step: MINUTES_5, returnArray: true }),
    from_1hour_to_12hour_array: () => strapi.services.time.generateRange({ from: HOUR_1, to: HOUR_12, step: HOUR_1, returnArray: true }),
    from_1hour_to_6hour_array: () => strapi.services.time.generateRange({ from: HOUR_1, to: HOUR_6, step: HOUR_1, returnArray: true }),
    from_1hour_to_24hour_array: () => strapi.services.time.generateRange({ from: HOUR_1, to: DAY_1, step: HOUR_1, returnArray: true }),
    from_1day_to_7day: () => strapi.services.time.generateRange({ from: DAY_1, to: DAY_7, step: DAY_1, returnArray: true }),
    from_30day_to_120day: () => strapi.services.time.generateRange({ from: DAY_30, to: DAY_120, step: DAY_30, returnArray: true }),
  },
  timeZone: () => 'America/New_York',
  startOfDay: () => {
    return moment().startOf('day').tz(strapi.services.time.timeZone()).toDate();
  },

  endOfDay: () => {
    return moment().endOf('day').tz(strapi.services.time.timeZone()).toDate();
  },

  now: () => {
    return moment().tz(strapi.services.time.timeZone());
  },

  unix: timeStamp => {
    if (timeStamp) {
      return {
        startOfDay:  moment.unix(timeStamp).startOf('day').tz(strapi.services.time.timeZone()).unix(),
        endOfDay:  moment.unix(timeStamp).endOf('day').tz(strapi.services.time.timeZone()).unix(),
        timeStamp: moment.unix(timeStamp).tz(strapi.services.time.timeZone()).unix(),
        toDate: moment.unix(timeStamp).tz(strapi.services.time.timeZone()).toDate(),
      }
    }

    return {
      startOfDay:  moment().startOf('day').tz(strapi.services.time.timeZone()).unix(),
      endOfDay:  moment().endOf('day').tz(strapi.services.time.timeZone()).unix(),
      now: moment().tz(strapi.services.time.timeZone()).unix(),
    };
  },

  unixTimestamp: () => {
    return moment().tz(strapi.services.time.timeZone()).unix();
  },

};
